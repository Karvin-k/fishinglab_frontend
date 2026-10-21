// common/request.js
import { BASE_URL } from './config.js'

const baseURL = BASE_URL;   // 后端服务地址，统一在 common/config.js 里改
let isRefreshing = false;  // 防止重复刷新
let failedQueue = [];      // 存储待重试的请求

// 处理队列中的请求
function processQueue(error, token = null) {
    failedQueue.forEach(promise => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve(token);
        }
    });
    failedQueue = [];
}

// 清除登录状态
function clearLoginState() {
    uni.removeStorageSync('vuex_user_token');
    uni.removeStorageSync('vuex_user_refresh_token');
    uni.removeStorageSync('vuex_user_info');
    uni.removeStorageSync('isLoginStatus');
    uni.reLaunch({ url: '/pages/login/login' });
}

/**
 * 统一请求封装
 * 自动添加认证 token，支持 token 自动刷新
 * @param {Object} options 请求参数：{ url, method, data, header, ... }
 * @returns {Promise}
 */
export default function request(options) {
    return new Promise((resolve, reject) => {
        // 获取存储的 access_token
        const token = uni.getStorageSync('vuex_user_token');
        // 拼接完整 URL（若已是完整路径则直接使用）
        const url = options.url.startsWith('http') ? options.url : baseURL + options.url;
        const header = {
            'Content-Type': 'application/json',
            ...(options.header || {})
        };
        if (token) {
            header['Authorization'] = 'Bearer ' + token;
        }

        // 发起请求，不再直接展开 options，避免覆盖 url
        uni.request({
            url: url,
            method: options.method || 'GET',
            data: options.data,
            header: header,
            success: async (res) => {
                // 处理 401 未授权（token 过期）
                if (res.statusCode === 401) {
                    // 如果已经在刷新 token，将请求加入队列
                    if (isRefreshing) {
                        try {
                            const newToken = await new Promise((resolve, reject) => {
                                failedQueue.push({ resolve, reject });
                            });
                            // 使用新 token 重试原请求
                            const retryRes = await request({
                                ...options,
                                header: {
                                    ...options.header,
                                    'Authorization': 'Bearer ' + newToken
                                }
                            });
                            resolve(retryRes);
                        } catch (err) {
                            reject(err);
                        }
                        return;
                    }

                    isRefreshing = true;
                    const refreshToken = uni.getStorageSync('vuex_user_refresh_token');
                    if (!refreshToken) {
                        clearLoginState();
                        reject(new Error('登录已过期，请重新登录'));
                        return;
                    }

                    try {
                        const refreshRes = await new Promise((resolve, reject) => {
                            uni.request({
                                url: baseURL + '/api/user/refresh',
                                method: 'POST',
                                data: { refresh_token: refreshToken },
                                header: { 'Content-Type': 'application/json' },
                                success: (r) => resolve(r),
                                fail: (e) => reject(e)
                            });
                        });
                        if (refreshRes.statusCode === 200 && refreshRes.data.code === 0) {
                            const newAccessToken = refreshRes.data.data.access_token;
                            uni.setStorageSync('vuex_user_token', newAccessToken);
                            processQueue(null, newAccessToken);
                            // 用新 token 重试当前请求
                            const retryRes = await request({
                                ...options,
                                header: {
                                    ...options.header,
                                    'Authorization': 'Bearer ' + newAccessToken
                                }
                            });
                            resolve(retryRes);
                        } else {
                            clearLoginState();
                            reject(new Error('登录已过期，请重新登录'));
                        }
                    } catch (err) {
                        clearLoginState();
                        reject(new Error('登录已过期，请重新登录'));
                    } finally {
                        isRefreshing = false;
                    }
                } else {
                    // 正常响应
                    resolve(res);
                }
            },
            fail: (err) => {
                reject(err);
            }
        });
    });
}


/**
 * 上传文件（图片）封装
 * 同样支持 token 自动刷新（简化版，仅跳转登录）
 * @param {Object} options uni.uploadFile 参数（需包含 url, filePath, name 等）
 * @returns {Promise}
 */
export function uploadFile(options) {
    return new Promise((resolve, reject) => {
        const token = uni.getStorageSync('vuex_user_token');
        // 拼接完整 URL
        const url = options.url.startsWith('http') ? options.url : baseURL + options.url;
        const header = { ...(options.header || {}) };
        if (token) {
            header['Authorization'] = 'Bearer ' + token;
        }

        uni.uploadFile({
            url: url,
            filePath: options.filePath,
            name: options.name,
            formData: options.formData,
            header: header,
            success: async (res) => {
                if (res.statusCode === 401) {
                    // 简单处理：token 过期时清除登录状态并跳转
                    clearLoginState();
                    reject(new Error('登录已过期，请重新登录'));
                } else {
                    resolve(res);
                }
            },
            fail: (err) => {
                reject(err);
            }
        });
    });
}