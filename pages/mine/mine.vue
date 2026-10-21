<template>
	<view class="wrap">
		<view class="user-cover">
			<!-- 右上角设置按钮（仅登录显示） -->
			<view class="setting-btn" @click="goToProfile" v-if="isLoginStatus">
				<u-icon name="setting" size="28" color="#fff"></u-icon>
			</view>

			<!-- 已登录用户头部信息 -->
			<view class="user-info" v-if="isLoginStatus">
				<view class="avatar" @click.stop="changeAvatar">
					<u-image width="100" height="100" shape="circle"
						:src="getImageUrl(vuex_user_info.avatar || '/static/images/user-avatar.jpg')"></u-image>
				</view>
				<view class="info">
					<view class="nickname">{{ vuex_user_info.nickname }}</view>
					<view class="tel">{{ vuex_user_info.mobile || '未绑定手机' }}</view>
				</view>
			</view>

			<!-- 未登录提示区域（增强样式，引导登录） -->
			<view class="user-no-login" v-else @click="authLogin">
				<u-icon name="account" size="60" color="#fff"></u-icon>
				<text class="login-text">登录 / 注册</text>
				<text class="login-sub">立即登录，解锁更多钓鱼服务</text>
			</view>

			<!-- 优惠券中心 -->
			<view class="coupon-center">
				<view class="coupon-header">
					<text class="coupon-title">优惠券中心</text>
					<view class="view-all" @click="goToCouponCenter">
						<text>查看全部</text>
						<u-icon name="arrow-right" size="24" color="#fff"></u-icon>
					</view>
				</view>
				<scroll-view scroll-x class="coupon-scroll" show-scrollbar="false">
					<view class="coupon-card" v-for="(coupon, idx) in couponList" :key="idx">
						<image class="coupon-bg" src="/static/images/coupon_bg.png" mode="widthFix"></image>
						<view class="coupon-content">
							<view class="coupon-value">¥{{ coupon.value }}</view>
							<view class="coupon-condition">{{ coupon.condition }}</view>
							<view class="coupon-expire">{{ coupon.expire }}</view>
						</view>
						<view class="coupon-action">
							<button class="receive-btn" :class="{ disabled: coupon.received }"
								:disabled="coupon.received" @click="receiveCoupon(idx)">
								{{ coupon.received ? '已领取' : '立即领取' }}
							</button>
						</view>
					</view>
				</scroll-view>
			</view>
		</view>

		<!-- 头像选择弹窗 -->
		<u-popup v-model="showAvatarPopup" mode="bottom" border-radius="20">
			<view class="avatar-popup">
				<view class="popup-title">更换头像</view>
				<view class="avatar-options">
					<view class="option-item" @click="chooseImage">
						<u-icon name="photo" size="40" color="#2979ff"></u-icon>
						<text>从相册选择</text>
					</view>
					<view class="option-item" @click="takePhoto">
						<u-icon name="camera" size="40" color="#2979ff"></u-icon>
						<text>拍照</text>
					</view>
				</view>
				<button class="cancel-btn" @click="showAvatarPopup = false">取消</button>
			</view>
		</u-popup>

		<!-- 我的成绩 -->
		<view class="score">
			<view class="title">我的成绩</view>
			<view class="list">
				<view class="item">
					<text>鱼获</text>
					<text>{{ vuex_user_info.fish_count || 0 }}</text>
				</view>
				<view class="item">
					<text>次数</text>
					<text>{{ vuex_user_info.fishing_count || 0 }}</text>
				</view>
				<view class="item">
					<text>过百</text>
					<text>{{ vuex_user_info.over_hundred_count || 0 }}</text>
				</view>
				<view class="item">
					<text>坑冠</text>
					<text>{{ vuex_user_info.champion_count || 0 }}</text>
				</view>
			</view>
		</view>

		<!-- 订单信息 + 功能入口 -->
		<view class="score">
			<view class="list">
				<!-- 我的订单 -->
				<view @click="goShopOrderHandler">
					<view class="item">
						<u-image width="76" height="76" src="/static/images/myorder.png"></u-image>
						<text class="icon-title">我的订单</text>
					</view>
				</view>

				<!-- 根据角色动态显示：商家中心 或 入驻商家 -->
				<!-- 商家中心（已入驻） -->
				<view @click="goMerchantCenter" v-if="isMerchant">
					<view class="item">
						<u-image width="76" height="76" src="/static/images/merchant.png"></u-image>
						<text class="icon-title">商家中心</text>
					</view>
				</view>
				<!-- 入驻商家（未入驻） -->
				<view @click="goMerchantApply" v-else>
					<view class="item">
						<u-image width="76" height="76" src="/static/images/merchant.png"></u-image>
						<text class="icon-title">入驻商家</text>
					</view>
				</view>

				<!-- 我的收藏 -->
				<view @click="goMyCollect">
					<view class="item">
						<u-image width="80" height="80" src="/static/images/myfav.png"></u-image>
						<text class="icon-title">我的收藏</text>
					</view>
				</view>

				<!-- 消息 -->
				<view @click="goToNotifications">
					<view class="item" style="position: relative;">
						<u-image width="80" height="80" src="/static/images/mynot.png"></u-image>
						<text class="icon-title">我的消息</text>
						<u-badge :count="unreadCount" :offset="[-10, -5]" absolute v-if="unreadCount > 0"></u-badge>
					</view>
				</view>
			</view>
		</view>

		<!-- 商品推荐区域 -->
		<view class="random-products">
			<view class="section-header">
				<text class="title">商品推荐</text>
				<view class="refresh-btn" @click="refreshRandomProducts">
					<u-icon name="reload" size="28" color="#5d7291" />
					<text>换一批</text>
				</view>
			</view>
			<view class="product-grid" v-if="randomProducts.length > 0">
				<view class="product-card" v-for="item in randomProducts" :key="item.id" @click="goDetail(item)">
					<image class="product-img" :src="getImageUrl(item.pic_url)" mode="aspectFill" />
					<view class="product-info">
						<text class="product-name">{{ item.name }}</text>
						<text class="product-price">¥{{ item.price }}</text>
					</view>
				</view>
			</view>
			<view v-else class="empty-products">暂无推荐商品</view>
		</view>
	</view>
</template>

<script>
	import request from '@/common/request.js';

	export default {
		onShow() {
			this.$store.dispatch('initializeStore')
			this.refreshUserInfo()
			this.loadCouponStatus(); // 加载优惠券领取状态
			this.loadUnreadCount();
			this.startPolling(); // 启动轮询
			this.loadRandomProducts();
		},
		onHide() {
			this.stopPolling(); // 页面隐藏时停止
		},
		onUnload() {
			this.stopPolling(); // 页面卸载时清理
		},
		data() {
			return {
				baseUrl: uni.$baseUrl,
				showAvatarPopup: false,
				showPopup: false,
				// 已领取优惠券
				couponList: [],
				newUserCoupons: [{
						id: 0,
						value: 5,
						condition: '无门槛',
						expire: '有效期至2026-12-31',
						received: false
					},
					{
						id: -1,
						value: 10,
						condition: '满50元可用',
						expire: '有效期至2026-12-31',
						received: false
					},
					{
						id: -2,
						value: 20,
						condition: '满100元可用',
						expire: '有效期至2026-12-31',
						received: false
					}
				],
				unreadCount: 0,
				pollingTimer: null,
				randomProducts: [], // 随机商品列表
				loadingRandom: false, // 加载状态


			};
		},
		mounted() {
			console.log('Store state:', this.$store.state)
			console.log('Login status:', this.$store.state.isLoginStatus)
		},
		computed: {
			isMerchant() {
				return this.isLoginStatus && this.vuex_user_info.role === 'merchant'
			},
			isLoginStatus() {
				return this.$store.state.isLoginStatus
			},
			vuex_user_info() {
				return this.$store.state.vuex_user_info
			},
			passwordStrength() {
				if (!this.loginForm.password) return 0;
				let strength = 0;
				if (this.loginForm.password.length >= 8) strength++;
				if (/[A-Z]/.test(this.loginForm.password)) strength++;
				if (/[0-9]/.test(this.loginForm.password)) strength++;
				if (/[^A-Za-z0-9]/.test(this.loginForm.password)) strength++;
				return strength;
			}
		},
		methods: {
			// 加载随机商品（热门商品随机取4个）
			async loadRandomProducts() {
				if (this.loadingRandom) return;
				this.loadingRandom = true;
				try {
					const res = await request({
						url: '/api/products/hot',
						method: 'GET'
					});
					if (res.data.code === 0) {
						let products = res.data.data;
						// 随机打乱数组
						const shuffled = products.sort(() => 0.5 - Math.random());
						this.randomProducts = shuffled.slice(0, 4); // 取前4个
					} else {
						this.randomProducts = [];
					}
				} catch (error) {
					console.error('加载随机商品失败', error);
					this.randomProducts = [];
				} finally {
					this.loadingRandom = false;
				}
			},

			// 换一批（重新加载随机商品）
			refreshRandomProducts() {
				this.loadRandomProducts();
			},

			// 跳转商品详情（复用现有 goDetail 方法）
			goDetail(item) {
				const productJson = encodeURIComponent(JSON.stringify(item));
				uni.navigateTo({
					url: `/pages/shop/detail?product=${productJson}`
				});
			},
			startPolling() {
				if (this.pollingTimer) clearInterval(this.pollingTimer);
				this.pollingTimer = setInterval(() => {
					if (this.getCurrentUserId()) {
						this.loadUnreadCount(); // 复用原有方法
					}
				}, 3000);
			},
			stopPolling() {
				if (this.pollingTimer) {
					clearInterval(this.pollingTimer);
					this.pollingTimer = null;
				}
			},
			// 进入优惠券中心
			goToCouponCenter() {
				uni.navigateTo({
					url: '/pages/mine/couponCenter'
				});
			},

			// 加载优惠券领取状态（从本地存储）
			async loadCouponStatus() {
				if (!this.isLoginStatus) {
					// 未登录：展示新人优惠券（不可领取）
					this.couponList = [{
							id: 0,
							value: 5,
							condition: '无门槛',
							expire: '有效期至2026-12-31',
							received: false
						},
						{
							id: -1,
							value: 10,
							condition: '满50元可用',
							expire: '有效期至2026-12-31',
							received: false
						},
						{
							id: -2,
							value: 20,
							condition: '满100元可用',
							expire: '有效期至2026-12-31',
							received: false
						}
					];
					return;
				}
				// 已登录：从后端获取用户已领取的优惠券
				try {
					const res = await request({
						url: uni.$baseUrl + '/api/user/coupons',
						method: 'GET'
					});
					// request 返回的是 uni.request 的成功回调参数，结构是 { data, statusCode, header ... }
					if (res.data.code === 0) {
						const userCoupons = res.data.data;
						this.couponList = userCoupons.map(c => ({
							id: c.id,
							value: c.value,
							condition: c.condition,
							expire: `有效期至${c.expire}`,
							received: true
						}));
					} else {
						this.couponList = [];
					}
				} catch (error) {
					console.error('加载优惠券失败', error);
					this.couponList = [];
				}
			},
			// 领取优惠券
			async receiveCoupon(index) {
				if (!this.isLoginStatus) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					setTimeout(() => {
						uni.navigateTo({
							url: '/pages/login/login'
						});
					}, 1000);
					return;
				}
				const coupon = this.couponList[index];
				if (coupon.received) return;

				const res = await request({
					url: uni.$baseUrl + '/api/coupons/receive',
					method: 'POST',
					data: {
						coupon_id: coupon.id
					}
				});
				if (res[1].data.code === 0) {
					uni.showToast({
						title: `领取成功！${coupon.value}元优惠券已到账`,
						icon: 'success'
					});
					// 重新加载优惠券状态
					this.loadCouponStatus();
					// 同时刷新优惠券中心页面的数据（如果需要）
				} else {
					uni.showToast({
						title: res[1].data.message || '领取失败',
						icon: 'none'
					});
				}
			},
			// 跳转设置页面
			goToSetting() {
				uni.navigateTo({
					url: '/pages/mine/setting'
				});
			},
			// 刷新用户信息
			async refreshUserInfo() {
				if (!this.isLoginStatus) return;
				try {
					const res = await request({
						url: uni.$baseUrl + '/api/user/info',
						method: 'GET'
					});
					if (res.data.code === 0) {
						const newInfo = res.data.data;
						this.$store.commit('setUserInfo', newInfo);
						this.$store.commit('setLoginStatus', true);
						uni.setStorageSync('vuex_user_info', newInfo);
						uni.setStorageSync('isLoginStatus', true);
					}
				} catch (error) {
					console.error('刷新用户信息失败:', error);
				}
			},

			getImageUrl(url) {
				if (!url) return ''
				if (url.startsWith('http') || url.startsWith('data:')) return url
				return this.baseUrl + url
			},

			goMerchantCenter() {
				uni.navigateTo({
					url: '/pages/merchant/dashboard'
				})
			},
			checkLoginBeforeAction(actionCallback) {
				if (!this.isLoginStatus) {
					uni.navigateTo({
						url: '/pages/login/login'
					});
					return false;
				}
				if (actionCallback && typeof actionCallback === 'function') {
					actionCallback();
				}
				return true;
			},
			goShopOrderHandler() {
				this.checkLoginBeforeAction(() => {
					uni.navigateTo({
						url: '/pages/mine/shopOrder'
					});
				});
			},
			goMerchantApply() {
				this.checkLoginBeforeAction(() => {
					uni.navigateTo({
						url: '/pages/merchant/apply'
					});
				});
			},
			goMyCollect() {
				this.checkLoginBeforeAction(() => {
					uni.navigateTo({
						url: '/pages/mine/collect'
					});
				});
			},
			shareHandler() {
				this.checkLoginBeforeAction(() => {
					this.showPopup = true;
				});
			},
			getFullAvatarUrl(avatarPath) {
				if (!avatarPath) return '/static/images/user-avatar.jpg';
				if (avatarPath.startsWith('http') || avatarPath.startsWith('data:')) {
					return avatarPath;
				}
				if (avatarPath.startsWith('/static/')) {
					return uni.$imgUrl(avatarPath);
				}
				return avatarPath;
			},
			changeAvatar() {
				this.showAvatarPopup = true;
			},
			chooseImage() {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album'],
					success: (res) => {
						this.uploadAvatar(res.tempFilePaths[0]);
						this.showAvatarPopup = false;
					}
				});
			},
			takePhoto() {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['camera'],
					success: (res) => {
						this.uploadAvatar(res.tempFilePaths[0]);
						this.showAvatarPopup = false;
					}
				});
			},
			async uploadAvatar(filePath) {
				try {
					uni.showLoading({
						title: '上传中...'
					});
					const [uploadErr, uploadRes] = await uni.uploadFile({
						url: uni.$baseUrl + '/api/user/avatar',
						filePath: filePath,
						name: 'avatar',
						// 后端这个接口有 @login_required，必须带 token，否则一律 401。
						// formData 里的 user_id 后端已经改成从 token 取了，留着不影响。
						header: {
							'Authorization': 'Bearer ' + (uni.getStorageSync('vuex_user_token') || '')
						},
						formData: {
							'user_id': this.vuex_user_info.id
						}
					});
					if (uploadErr) {
						throw new Error('上传失败');
					}
					const result = JSON.parse(uploadRes.data);
					if (result.code === 0) {
						const fullAvatarUrl = uni.$imgUrl(result.data.avatar_url);
						const updatedUserInfo = {
							...this.vuex_user_info,
							avatar: fullAvatarUrl
						};
						this.$store.commit('setUserInfo', updatedUserInfo);
						uni.setStorageSync('vuex_user_info', updatedUserInfo);
						uni.showToast({
							title: '头像更新成功',
							icon: 'success'
						});
						console.log('头像更新成功，完整URL:', fullAvatarUrl);
					} else {
						throw new Error(result.message || '上传失败');
					}
				} catch (error) {
					console.error('头像上传失败:', error);
					uni.showToast({
						title: error.message || '头像上传失败',
						icon: 'none'
					});
				} finally {
					uni.hideLoading();
				}
			},
			goToProfile() {
				uni.navigateTo({
					url: '/pages/mine/profile'
				});
			},
			authLogin() {
				uni.navigateTo({
					url: '/pages/login/login'
				});
			},
			privateHandler() {
				uni.navigateTo({
					url: '/pages/mine/privateRule'
				})
			},
			staffHandler() {
				this.checkLoginBeforeAction(() => {
					uni.navigateTo({
						url: '/pages/staff/staff'
					});
				});
			},
			logout() {
				uni.removeStorageSync('vuex_user_info');
				uni.removeStorageSync('isLoginStatus');
				this.$store.commit('clearUserData');
				uni.showToast({
					title: '已退出登录',
					icon: 'success'
				});
			},
			async loadUnreadCount() {
				try {
					const res = await request({
						url: '/api/notifications/unread_count',
						method: 'GET'
					});
					if (res.data.code === 0) {
						this.unreadCount = res.data.data.count;
						if (this.unreadCount > 0) {
							const text = this.unreadCount > 99 ? '99+' : this.unreadCount.toString();
							uni.setTabBarBadge({
								index: 4,
								text: text
							});
						} else {
							uni.removeTabBarBadge({
								index: 4
							});
						}
					}
				} catch (e) {
					console.error('获取未读消息数失败', e);
				}
			},
			getCurrentUserId() {
				let userInfo = this.$store.state.vuex_user_info || uni.getStorageSync('vuex_user_info');
				return userInfo?.id || null;
			},
			goToNotifications() {
				this.checkLoginBeforeAction(() => {
					uni.navigateTo({
						url: '/pages/mine/notifications'
					});
				});
			}
		}
	}
</script>

<style lang="scss">
	/* ========== 全局重置 ========== */
	.wrap {
		width: 100%;
		background-color: #f7f7f8;

		.wrap-in {
			width: auto;
			margin: 0;
		}
	}

	/* ========== 顶部用户封面 ========== */
	.user-cover {
		width: 750rpx;
		min-height: 500rpx;
		background: #282828;
		background-size: 750rpx 564rpx;
		padding-top: 24rpx;
		position: relative;

		/* 右上角设置按钮（仅登录显示） */
		.setting-btn {
			position: absolute;
			top: 30rpx;
			right: 30rpx;
			z-index: 10;
			width: 60rpx;
			height: 60rpx;
			background: rgba(0, 0, 0, 0.2);
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		/* 已登录用户信息 */
		.user-info {
			display: flex;
			align-items: center;
			color: #fff;
			padding-left: 40rpx;
			margin-bottom: 40rpx;

			.avatar {
				margin-right: 20rpx;
				position: relative;

				.avatar-edit {
					position: absolute;
					bottom: 0;
					right: 0;
					background: rgba(0, 0, 0, 0.6);
					padding: 4rpx 12rpx;
					border-radius: 20rpx;
					font-size: 20rpx;
					color: #fff;
				}
			}

			.info {
				.nickname {
					font-size: 30rpx;
					line-height: 1.4;
					font-weight: bold;
				}

				.tel {
					font-size: 24rpx;
				}
			}
		}

		/* 未登录提示区（中心化卡片样式） */
		.user-no-login {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 80rpx 0;
			margin: 0;
			background: transparent;
			color: #fff;

			.login-text {
				font-size: 36rpx;
				font-weight: bold;
				margin-top: 20rpx;
			}

			.login-sub {
				font-size: 24rpx;
				margin-top: 12rpx;
				opacity: 0.85;
			}
		}

		/* 优惠券中心区域 */
		.coupon-center {
			margin-top: 30rpx;
			padding: 0 20rpx;

			.coupon-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 0 20rpx 20rpx;

				.coupon-title {
					font-size: 32rpx;
					font-weight: bold;
					color: #fff;
				}

				.view-all {
					display: flex;
					align-items: center;
					font-size: 26rpx;
					color: rgba(255, 255, 255, 0.8);

					.u-icon {
						margin-left: 8rpx;
					}
				}
			}

			.coupon-scroll {
				white-space: nowrap;
				height: 240rpx;
				width: 100%;
			}

			.coupon-card {
				display: inline-flex;
				width: 500rpx;
				margin-right: 20rpx;
				background: linear-gradient(135deg, #ff9800, #ff5722);
				border-radius: 20rpx;
				overflow: hidden;
				position: relative;
				box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.15);

				.coupon-bg {
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					opacity: 0.1;
				}

				.coupon-content {
					flex: 2;
					padding: 30rpx 20rpx;
					color: #fff;

					.coupon-value {
						font-size: 48rpx;
						font-weight: bold;
						line-height: 1.2;
					}

					.coupon-condition {
						font-size: 24rpx;
						margin-top: 12rpx;
					}

					.coupon-expire {
						font-size: 22rpx;
						margin-top: 8rpx;
						opacity: 0.8;
					}
				}

				.coupon-action {
					flex: 1;
					display: flex;
					align-items: center;
					justify-content: center;
					background: rgba(0, 0, 0, 0.1);

					.receive-btn {
						background: #fff;
						color: #ff5722;
						border-radius: 60rpx;
						padding: 12rpx 20rpx;
						font-size: 26rpx;
						font-weight: bold;
						border: none;

						&.disabled {
							background: #ccc;
							color: #666;
						}
					}
				}
			}
		}
	}

	/* ========== 成绩卡片 ========== */
	.score {
		background-color: #fff;
		border-radius: 0;
		padding: 20rpx 30rpx;
		margin-bottom: 16rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.02);
		transition: all 0.2s;

		&:not(:first-of-type) {
			border-top: 1rpx solid #f0f0f0;
		}

		.title {
			line-height: 3;
			font-weight: 500;
			text-align: center;
			color: #333;
		}

		.list {
			display: flex;
			justify-content: space-around;
			align-items: center;
			padding: 10rpx 0;

			.item {
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				text-align: center;
				position: relative;

				.icon-title {
					margin-top: 16rpx;
					font-size: 26rpx;
					color: #666;
				}
			}
		}
	}

	/* ========== 头像选择弹窗 ========== */
	.avatar-popup {
		padding: 40rpx;
		background: white;

		.popup-title {
			text-align: center;
			font-size: 32rpx;
			font-weight: bold;
			margin-bottom: 40rpx;
		}

		.avatar-options {
			display: flex;
			justify-content: space-around;
			margin-bottom: 40rpx;

			.option-item {
				display: flex;
				flex-direction: column;
				align-items: center;

				text {
					margin-top: 16rpx;
					font-size: 28rpx;
					color: #333;
				}
			}
		}

		.cancel-btn {
			width: 100%;
			height: 80rpx;
			line-height: 80rpx;
			text-align: center;
			background: #f5f5f5;
			border-radius: 40rpx;
			font-size: 32rpx;
		}
	}

	/* ========== 登录注册弹窗 ========== */
	.login-dialog {
		padding: 40rpx;
		background-color: #fff;
		border-radius: 16rpx;
		position: relative;

		.title {
			text-align: center;
			font-size: 36rpx;
			font-weight: bold;
			margin-bottom: 40rpx;
		}

		.password-strength {
			display: flex;
			align-items: center;
			margin-top: 15rpx;
			margin-bottom: 10rpx;
			font-size: 24rpx;
			color: #666;
			padding: 5rpx 0;

			.strength-label {
				margin-right: 10rpx;
			}

			.strength-indicator {
				display: flex;
				margin: 0 10rpx;

				.strength-bar {
					width: 35rpx;
					height: 8rpx;
					background: #e0e0e0;
					margin: 0 3rpx;
					border-radius: 4rpx;

					&.active {
						&.weak {
							background: #ff4d4f;
						}

						&.medium {
							background: #faad14;
						}

						&.strong {
							background: #52c41a;
						}

						&.very-strong {
							background: #1890ff;
						}
					}
				}
			}

			.strength-text {
				font-weight: bold;
				min-width: 80rpx;
				font-size: 24rpx;

				&.weak {
					color: #ff4d4f;
				}

				&.medium {
					color: #faad14;
				}

				&.strong {
					color: #52c41a;
				}

				&.very-strong {
					color: #1890ff;
				}
			}
		}

		.actions {
			display: flex;
			justify-content: space-between;
			margin-top: 40rpx;
			gap: 20rpx;

			.u-button {
				flex: 1;
			}
		}

		.register-tips {
			margin-top: 30rpx;
			padding: 20rpx;
			background-color: #f5f5f5;
			border-radius: 8rpx;
			font-size: 24rpx;
			color: #666;

			text {
				font-weight: bold;
				color: #333;
			}

			view {
				margin-top: 10rpx;
				line-height: 1.6;
			}
		}
	}


	/* ========== 辅助样式 ========== */
	.u-form-item__body {
		min-height: 100rpx;
	}

	.strength-text {
		min-width: 100rpx;
		text-align: right;
	}

	@media (max-width: 480px) {
		.password-strength {
			flex-direction: column;
			align-items: flex-start;

			.strength-indicator {
				margin: 10rpx 0;
			}
		}
	}

	.function-disabled {
		opacity: 0.6;
	}
	
	/* 商品推荐区域 */
	.random-products {
	    background-color: #fff;
	    padding: 30rpx;
	    margin-bottom: 16rpx;
	
	    .section-header {
	        display: flex;
	        justify-content: space-between;
	        align-items: center;
	        margin-bottom: 30rpx;
	
	        .title {
	            font-size: 34rpx;
	            font-weight: bold;
	            color: #1a1a1a;
	        }
	
	        .refresh-btn {
	            display: flex;
	            align-items: center;
	            gap: 8rpx;
	            font-size: 26rpx;
	            color: #5d7291;
	        }
	    }
	
	    .product-grid {
	        display: grid;
	        grid-template-columns: repeat(2, 1fr);
	        gap: 20rpx;
	
	        .product-card {
	            background: #f8f8f8;
	            border-radius: 16rpx;
	            overflow: hidden;
	
	            .product-img {
	                width: 100%;
	                height: 240rpx;
	                display: block;
	            }
	
	            .product-info {
	                padding: 16rpx;
	
	                .product-name {
	                    font-size: 28rpx;
	                    font-weight: 500;
	                    display: block;
	                    margin-bottom: 8rpx;
	                    overflow: hidden;
	                    text-overflow: ellipsis;
	                    white-space: nowrap;
	                }
	
	                .product-price {
	                    font-size: 28rpx;
	                    color: #f38b11;
	                    font-weight: bold;
	                }
	            }
	        }
	    }
	
	    .empty-products {
	        text-align: center;
	        padding: 60rpx;
	        color: #999;
	        font-size: 28rpx;
	    }
	}
</style>