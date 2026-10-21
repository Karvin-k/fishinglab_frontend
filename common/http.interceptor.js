import { BASE_URL } from './config.js'
/* 
 这一块的封装完全是参照 uview 封装的网络请求 api ，直接复制粘贴代码即可。
  https://v1.uviewui.com/js/http.html
  https://v1.uviewui.com/js/apiManage.html
  
 */
const install = (Vue, vm) => {
	// 此为自定义配置参数，具体参数见上方说明
	// 定义接口的基准 url地址（接口的前缀）超时时间

	Vue.prototype.$u.http.setConfig({
		baseUrl: BASE_URL,
		loadingText: '努力加载中~',
		loadingTime: 800,
		
		// 配置请求头信息 post 提交时候表单的编码
		header: {
			'content-type': 'application/x-www-form-urlencoded'
		},


	});

	// 请求拦截部分，如配置，每次请求前都会执行，见上方说明
	Vue.prototype.$u.http.interceptor.request = (config) => {
		// 一般在这里配置 token 
		
		config.header['X-Access-Token'] = '03pmUl3WlmnGEhiHZqj5wyszUgIKkkHa'; 
		// 稍等登录成功后然后把 token 存起来之后在获取 由于现在还没有做登录功能，则我们先通过接口拿到token，在这里先完成功能先。后期我们在做登录功能。 https://apifox.com/apidoc/shared-e3ac8d74-b009-45a6-bce4-b098c9766c25/api-72606150
		config.header['X-App-Platform'] = 'wxapp';
		
		// ......
		return config;
	}

	// 响应拦截，如配置，每次请求结束都会执行本方法
	/* 
	 本项目的接口，如果成功响应数据，code为 0
	 如果 token 失效了 code 为 1001
	 
	 
	 */
	Vue.prototype.$u.http.interceptor.response = (res) => {
		if (res.code == 0) {
			
			return res;
			
		} else if (res.code == 1001) {
			// 假设201为token失效，这里跳转登录
			vm.$u.toast('验证失败，请重新登录');
			setTimeout(() => {
				vm.$u.route('/pages/mine/mine')
			}, 1500)
			return false;
		} else {
			// 如果返回false，则会调用Promise的reject回调， 到时候可以通过 try catch 捕获错误
			// 并将进入this.$u.post(url).then().catch(res=>{})的catch回调中，res为服务端的返回值
			return false;
		}
	}
}

export default {
	install
}
