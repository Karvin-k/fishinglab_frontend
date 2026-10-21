// common/config.js
// ============================================================
// 后端服务地址：自动判断，不用手改
// ------------------------------------------------------------
// 本地开发（localhost / 127.0.0.1）  -> http://localhost:5000
// 部署到服务器（IP 或域名）          -> 当前访问的 origin（同源）
//   这样上线后前端和接口同域，既没有跨域问题，也不用写死 IP。
// ============================================================

function resolveBaseUrl() {
    // #ifdef H5
    if (typeof window !== 'undefined' && window.location) {
        var h = window.location.hostname;
        if (h && h !== 'localhost' && h !== '127.0.0.1') {
            // 线上：用当前访问地址，请求走 Nginx 同源转发
            return window.location.origin;
        }
    }
    // #endif
    // 本地开发 / 小程序：直连本地后端
    return 'http://localhost:5000';
}

export const BASE_URL = resolveBaseUrl();

/**
 * 图片地址兜底
 * 后端已经返回完整 URL（http://.../static/uploads/xxx.png），这种直接返回；
 * 只有历史遗留的相对路径（/static/uploads/xxx.png）才拼上 BASE_URL。
 * 这样不会出现 http://xxxhttp://xxx/... 这种双拼。
 */
export function imgUrl(u) {
    if (!u) return '';
    if (typeof u !== 'string') return u;
    return u.startsWith('http') ? u : BASE_URL + u;
}

export default {
    BASE_URL,
    imgUrl
};
