// store/index.js
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    isLoginStatus: false,
    vuex_user_info: {}
  },
  mutations: {
    setLoginStatus(state, status) {
      state.isLoginStatus = status
    },
    setUserInfo(state, userInfo) {
      state.vuex_user_info = userInfo
    },
    clearUserData(state) {
      state.isLoginStatus = false
      state.vuex_user_info = {}
    }
  },
  actions: {
    initializeStore({ commit }) {
      // 从本地存储恢复登录状态
      const loginStatus = uni.getStorageSync('isLoginStatus')
      if (loginStatus) {
        commit('setLoginStatus', loginStatus)
      }
      
      // 从本地存储恢复用户信息
      const userInfo = uni.getStorageSync('vuex_user_info')
      if (userInfo) {
        commit('setUserInfo', userInfo)
      }
      
      console.log('Store initialized from storage')
    }
  }
})

// 应用启动时初始化 store
store.dispatch('initializeStore')

export default store