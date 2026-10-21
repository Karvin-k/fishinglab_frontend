<template>
	<view class="admin-login">
		<!-- 全屏背景图（16:9 自适应） -->
		<view class="bg-wrapper">
			<image class="bg-image" :src="bgImage" mode="aspectFill" />
			<view class="bg-overlay"></view>
		</view>

		<!-- 左侧品牌区（垂直居中） -->
		<view class="brand-area">
			<view class="brand-logo">
				<image src="/static/images/admin-logo.png" mode="aspectFit" />
			</view>
			<text class="brand-title">十鲤钓鱼服务平台</text>
			<text class="brand-slogan">一站式钓鱼服务，轻松管理您的钓场与商品</text>
			<!-- 动态钓鱼图标（CSS 浮动动画） -->
			<view class="dynamic-icon">
				<u-icon name="star" size="80" color="#fff" />
			</view>
		</view>

		<!-- 右侧登录卡片（右上角） -->
		<view class="login-card">
			<view class="card-inner">
				<view class="logo">
					<image src="/static/images/admin.png" mode="aspectFit" />
					<text class="title">钓鱼服务平台管理</text>
				</view>

				<u-form :model="form" :rules="rules" ref="loginForm" class="login-form">
					<u-form-item prop="username" borderBottom="false">
						<u-input v-model="form.username" placeholder="管理员账号" prefix-icon="account" size="large"
							class="login-input" />
					</u-form-item>
					<u-form-item prop="password" borderBottom="false" class="password-item">
						<u-input v-model="form.password" placeholder="密码" type="password" prefix-icon="lock"
							size="large" class="login-input" />
					</u-form-item>
				</u-form>

				<u-button type="primary" size="large" @click="handleLogin" :loading="loading" class="login-btn">
					登录
				</u-button>

				<view class="forgot-link" @click="showForgot = true">
					忘记密码？
				</view>
			</view>
		</view>

		<!-- 忘记密码弹窗 -->
		<u-popup v-model="showForgot" mode="center" width="85%" border-radius="20" class="forgot-popup-container">
			<view class="forgot-popup">
				<view class="popup-icon">
					<u-icon name="info-circle" color="#909399" size="60"></u-icon>
				</view>
				<text class="popup-title">忘记密码</text>
				<text class="popup-desc">请联系超级管理员重置密码</text>
				<view class="popup-footer">
					<u-button type="primary" @click="showForgot = false" class="popup-btn">确定</u-button>
				</view>
			</view>
		</u-popup>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				bgImage: '/static/images/admin-bg.jpg', // 16:9背景图路径
				form: {
					username: '',
					password: ''
				},
				rules: {
					username: [{
						required: true,
						message: '请输入管理员账号',
						trigger: 'blur'
					}],
					password: [{
						required: true,
						message: '请输入密码',
						trigger: 'blur'
					}]
				},
				loading: false,
				showForgot: false
			}
		},
		methods: {
			async handleLogin() {
				try {
					const valid = await this.$refs.loginForm.validate()
					if (!valid) return

					this.loading = true

					const [err, response] = await uni.request({
						url: uni.$baseUrl + '/api/admin/login',
						method: 'POST',
						data: {
							username: this.form.username,
							password: this.form.password
						},
						header: {
							'Content-Type': 'application/json'
						}
					})

					if (err) throw err

					const res = response.data
					if (res.code === 0) {
						uni.showToast({
							title: '登录成功',
							icon: 'success'
						})

						uni.setStorageSync('adminToken', res.data.token)
						uni.setStorageSync('adminInfo', res.data.admin_info)

						uni.reLaunch({
							url: '/pages/admin/dashboard'
						})
					} else {
						uni.showToast({
							title: res.message || '登录失败',
							icon: 'none'
						})
					}
				} catch (error) {
					console.error('登录失败:', error)
					uni.showToast({
						title: '登录失败，请检查网络',
						icon: 'none'
					})
				} finally {
					this.loading = false
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.admin-login {
		min-height: 100vh;
		position: relative;
		overflow: hidden;
	}

	/* 背景图区域 */
	.bg-wrapper {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 0;
	}

	.bg-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.bg-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.45);
		/* 半透明遮罩，提高文字对比度 */
	}

	/* 左侧品牌区 */
	.brand-area {
		position: absolute;
		left: 5%;
		top: 50%;
		transform: translateY(-50%);
		z-index: 2;
		color: #fff;
		max-width: 40%;
		text-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.3);

		.brand-logo {
			width: 120rpx;
			height: 120rpx;
			margin-bottom: 30rpx;

			image {
				width: 100%;
				height: 100%;
				border-radius: 30rpx;
				background: rgba(255, 255, 255, 0.2);
				padding: 10rpx;
			}
		}

		.brand-title {
			font-size: 48rpx;
			font-weight: bold;
			display: block;
			margin-bottom: 20rpx;
		}

		.brand-slogan {
			font-size: 28rpx;
			opacity: 0.9;
			display: block;
			margin-bottom: 40rpx;
			line-height: 1.5;
		}

		.dynamic-icon {
			animation: float 3s ease-in-out infinite;
			width: 80rpx;
			height: 80rpx;
		}
	}

	@keyframes float {
		0% {
			transform: translateY(0);
		}

		50% {
			transform: translateY(-20rpx);
		}

		100% {
			transform: translateY(0);
		}
	}

	/* 右侧登录卡片 */
	.login-card {
		position: absolute;
		top: 15%;
		right: 5%;
		width: 620rpx;
		background: rgba(255, 255, 255, 0.96);
		border-radius: 32rpx;
		box-shadow: 0 30rpx 80rpx rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(8rpx);
		z-index: 2;
		overflow: hidden;

		.card-inner {
			padding: 60rpx 40rpx 50rpx;
		}
	}

	.logo {
		text-align: center;
		margin-bottom: 50rpx;

		image {
			width: 120rpx;
			height: 120rpx;
			margin-bottom: 20rpx;
			border-radius: 50%;
			background: #f5f5f5;
			padding: 15rpx;
		}

		.title {
			display: block;
			font-size: 36rpx;
			font-weight: 600;
			color: #333;
		}
	}

	.login-form {
		margin-bottom: 40rpx;
	}

	.login-input {
		height: 90rpx;
		border-radius: 16rpx;
		background-color: #f7f8fa;
		padding-left: 30rpx;
		font-size: 28rpx;
	}

	.login-input:focus {
		background-color: #fff;
		border-color: #667eea !important;
		box-shadow: 0 0 0 2rpx rgba(102, 126, 234, 0.3);
	}

	.password-item {
		margin-top: 20rpx;
	}

	.login-btn {
		width: 100%;
		height: 90rpx;
		font-size: 32rpx;
		border-radius: 16rpx;
		background: linear-gradient(135deg, #0eb0ea 0%, #75a292 100%);
		border: none;
		margin-bottom: 20rpx;
	}

	.forgot-link {
		text-align: center;
		color: #0eb0ea;
		font-size: 28rpx;
		padding: 10rpx 0;
		cursor: pointer;
	}

	/* 忘记密码弹窗 */
	.forgot-popup {
		padding: 60rpx 40rpx 40rpx;
		text-align: center;
		background: #fff;
		border-radius: 20rpx;
	}

	.popup-icon {
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		background: #f0f2f5;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 30rpx;
	}

	.popup-title {
		font-size: 36rpx;
		font-weight: 600;
		display: block;
		margin-bottom: 20rpx;
		color: #303133;
	}

	.popup-desc {
		font-size: 28rpx;
		color: #606266;
		display: block;
		margin-bottom: 40rpx;
		line-height: 1.6;
	}

	.popup-footer {
		padding-top: 20rpx;
		border-top: 1rpx solid #ebeef5;
	}

	.popup-btn {
		width: 100%;
		height: 80rpx;
		font-size: 30rpx;
		border-radius: 12rpx;
		background: linear-gradient(135deg, #0eb0ea 0%, #75a292 100%);
	}
</style>