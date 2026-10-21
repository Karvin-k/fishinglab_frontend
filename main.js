import App from './App'
import store from './store'
import { BASE_URL, imgUrl } from './common/config.js'

// 全站后端地址：以后只改 common/config.js 这一处
uni.$baseUrl = BASE_URL
// 图片地址兜底（后端返回完整URL时原样返回，相对路径才拼前缀）
uni.$imgUrl = imgUrl

// #ifndef VUE3
import Vue from 'vue'

Vue.prototype.$store = store

import uView from "uview-ui";
Vue.use(uView);

Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
    store, 
    ...App
})

// http拦截器
import httpInterceptor from '@/common/http.interceptor.js'
Vue.use(httpInterceptor, app);

// http接口API集中管理引入部分
import httpApi from '@/common/http.api.js'
Vue.use(httpApi, app)

// 设置请求拦截器 - uView UI 1.8.4 兼容方式
// 注意：uView UI 1.8.4 没有 uni.$u.http.setConfig
// 直接在请求拦截器中配置即可

// 请求拦截器
uni.$u.http.interceptor.request = (config) => {
    // 获取token
    const token = uni.getStorageSync('adminToken') || uni.getStorageSync('vuex_user_token') || '';
    if (token) {
        config.header = config.header || {};
        config.header['Authorization'] = 'Bearer ' + token; 
    }
    
    // 全局设置 Content-Type
    if (config.method === 'POST' || config.method === 'PUT') {
        config.header = config.header || {};
        config.header['Content-Type'] = 'application/json';
        
        // 自动将对象转换为JSON字符串
        if (typeof config.data === 'object' && !(config.data instanceof FormData)) {
            config.data = JSON.stringify(config.data);
        }
    }
    
    return config;
}

app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
export function createApp() {
    const app = createSSRApp(App)
    return { app }
}
// #endif