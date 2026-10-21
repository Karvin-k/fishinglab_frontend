// 其他api

// 使用相对路径（代理会处理）
let getPondListUrl = '/api/pond/list';
let getSeatByPondIdUrl = '/api/pond/seat';
let payStep1Url = '/api/order/submit';
let payStep2Url = '/api/order/pay_data';
let payStep3Url = '/api/payment/methods';
let payStep4Url = '/api/payment/params';

const install = (Vue, vm) => {
  // ...其他API定义...
  
  // 添加相关API
  let getPondList = (params = {}) => vm.$u.get(getPondListUrl, params);
  let getSeatByPondId = (params = {}) => vm.$u.get(getSeatByPondIdUrl, params);
  let payStep1 = (params = {}) => vm.$u.post(payStep1Url, params);
  let payStep2 = (params = {}) => vm.$u.post(payStep2Url, params);
  let payStep3 = (params = {}) => vm.$u.get(payStep3Url, params);
  let payStep4 = (params = {}) => vm.$u.post(payStep4Url, params);

  vm.$u.api = {
    // ...其他API...
    getPondList,
    getSeatByPondId,
    payStep1,
    payStep2,
    payStep3,
    payStep4
  };
}

export default {
	install
}
