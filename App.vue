<script>
	export default {
		onLaunch() {
			// 检查本地存储中是否有登录信息
			const isLogin = uni.getStorageSync('isLoginStatus');
			const userInfo = uni.getStorageSync('vuex_user_info');

			if (isLogin && userInfo) {
				// 更新 Vuex 状态
				this.$store.commit('setLoginStatus', true);
				this.$store.commit('setUserInfo', userInfo);
			}
			
			// uView UI 2.x 初始化配置（如果需要）
			console.log('App Launch');
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style lang="scss">
	/* 引入uView全局样式 */
	@import "uview-ui/index.scss";
	
	/* 其他全局样式 */
	page {
	  background-color: #f5f7fa;
	}
	
	/* 强制所有元素可交互，覆盖 uView 的 user-select: none */
	* {
	  -webkit-user-select: auto !important;
	  user-select: auto !important;
	}
	
	/* 特别确保输入框可文本选择 */
	input, textarea, .input, .textarea {
	  -webkit-user-select: text !important;
	  user-select: text !important;
	  pointer-events: auto !important;
	}

	/* ============================================================
	   H5 在电脑浏览器上的适配
	   ------------------------------------------------------------
	   原因：uni-app 的 rpx 按屏幕宽度换算。手机 375px 宽时 1rpx≈0.5px，
	   但电脑浏览器 1920px 宽时 1rpx≈2.56px，所有元素被放大 2.5 倍，
	   看起来就是个"巨型手机界面"。

	   做法分两层：
	   1. manifest.json 里 rpxCalcMaxDeviceWidth=750 -> 超过 750px 的设备按 1rpx=1px 算
	   2. 这里把 uni-app 容器限制成 750px 宽居中
	   ============================================================ */
	/* #ifdef H5 */
	html,
	body {
	  height: 100%;
	  margin: 0;
	}

	body {
	  background-color: #e9edf2;
	}

	/* 只在宽屏（电脑浏览器）生效，手机上完全不受影响 */
	@media screen and (min-width: 751px) {

	  /* 主内容区：限制成手机宽度并居中 */
	  uni-app {
	    max-width: 750px !important;
	    margin: 0 auto !important;
	    position: relative !important;
	    min-height: 100vh;
	    background-color: #f5f7fa;
	    box-shadow: 0 0 24px rgba(0, 0, 0, 0.10);
	    /* 防止某个元素用 100vw 之类的写法横向溢出到列外面 */
	    overflow-x: hidden;
	  }

	  /* 固定定位的头部/底部/悬浮栏：
	     只做「限制宽度 + 左右居中」两件事，绝不改它们的 position，
	     否则会把 uni-tabbar 这类元素的定位方式覆盖掉，布局直接塌。

	     left:0 + right:0 已经把水平位置铺满视口，
	     再用 max-width 收窄、margin:auto 居中，是最不容易出错的写法。

	     注意 tabbar / page-head 要同时写「元素选择器」和「class 选择器」：
	     uni-app 里真正 position:fixed 铺满屏幕的是内部那层 .uni-tabbar，
	     只写 uni-tabbar 是管不到它的。 */
	  uni-page-head,
	  .uni-page-head,
	  uni-tabbar,
	  .uni-tabbar,
	  /* uView 的导航栏组件，27 个页面在用，样式在 uview-ui 自己的组件库里 */
	  .u-navbar,
	  .u-navbar-fixed,
	  .custom-navbar,
	  .custom-nav,
	  .cart-footer,
	  .footer,
	  .footer-bar,
	  .bottom-bar,
	  .bottom-actions,
	  .confirm-btn-wrapper {
	    left: 0 !important;
	    right: 0 !important;
	    margin-left: auto !important;
	    margin-right: auto !important;
	    max-width: 750px !important;
	  }
	  /* 兜底：有些页面把容器写死成 width:750rpx，
	     一旦 rpx 换算没按预期生效，它会撑到整屏宽，
	     里面 right 定位的按钮（比如"我的"右上角齿轮）就会被裁掉。
	     这里强制让它跟随容器宽度。 */
	  .user-cover {
	    width: 100% !important;
	    max-width: 100% !important;
	    box-sizing: border-box;
	  }
	}
	/* #endif */
</style>