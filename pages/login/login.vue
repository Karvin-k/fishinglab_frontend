<template>
	<view class="login-page">
		<view class="bg-gradient" />
		<view class="card">
			<view class="brand">
				<image src="/static/images/logo.png" mode="aspectFit" class="logo" />
				<text class="slogan">钓鱼服务平台</text>
			</view>
			<view class="form">
				<view class="field">
					<u-input v-model="username" placeholder="用户名" :border="false" prefixIcon="account" clearable
						class="custom-input" />
				</view>
				<view class="field">
					<u-input v-model="password" placeholder="密码" :type="showPassword ? 'text' : 'password'"
						:border="false" prefixIcon="lock" clearable class="custom-input">
						<template #suffix>
							<u-icon :name="showPassword ? 'eye' : 'eye-closed'" @click="showPassword = !showPassword"
								class="eye-icon" />
						</template>
					</u-input>
				</view>
				<button class="login-btn" :class="{ 'btn-loading': loading }" @click="doLogin" :disabled="loading">
					<text v-if="!loading">登录</text>
					<text v-else>登录中...</text>
				</button>
				<view class="extra">
					<text class="register-link" @click="goToRegister">没有账号？立即注册</text>
					<text class="forgot-link" @click="forgotPassword">忘记密码？</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import request from '@/common/request.js';
	export default {
		data() {
			return {
				username: '',
				password: '',
				showPassword: false,
				loading: false
			}
		},
		methods: {
			async doLogin() {
				if (!this.username || !this.password) {
					uni.showToast({
						title: '请填写完整信息',
						icon: 'none'
					});
					return;
				}
				this.loading = true;
				const [err, res] = await uni.request({
					url: uni.$baseUrl + '/api/user/login',
					method: 'POST',
					data: {
						username: this.username,
						password: this.password
					}
				});
				this.loading = false;
				if (res.data.code === 0) {
					// 正确提取 user 对象
					const user = res.data.data.user;
					const accessToken = res.data.data.access_token;
					const refreshToken = res.data.data.refresh_token;

					// 存储用户信息（不含令牌）
					this.$store.commit('setUserInfo', user);
					uni.setStorageSync('vuex_user_info', user);
					uni.setStorageSync('isLoginStatus', true);

					// 存储令牌（为后续 JWT 改造准备）
					uni.setStorageSync('vuex_user_token', accessToken);
					uni.setStorageSync('vuex_user_refresh_token', refreshToken);

					uni.showToast({
						title: '登录成功',
						icon: 'success'
					});
					console.log('存储的access_token:', accessToken);
					uni.setStorageSync('vuex_user_token', accessToken);
					
					setTimeout(() => {
						uni.switchTab({
							url: '/pages/home/home'
						});
					}, 1000);
				} else {
					uni.showToast({
						title: res.data.message || '登录失败',
						icon: 'none'
					});
				}
			},
			goToRegister() {
				uni.navigateTo({
					url: '/pages/login/register'
				});
			},
			forgotPassword() {
				uni.showToast({
					title: '请联系管理员重置密码',
					icon: 'none'
				});
			}
		}
	}
</script>

<style lang="scss" scoped>
	.login-page {
		min-height: 100vh;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
	}

	.bg-gradient {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(145deg, #eef2f7 0%, #d9e2ec 100%);
		z-index: -1;
	}

	.card {
		width: 100%;
		height: 100%;
		min-height: 100vh;
		background: rgba(255, 255, 255, 0.96);
		backdrop-filter: blur(2px);
		padding: 60rpx 40rpx 80rpx;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.brand {
		text-align: center;
		margin-bottom: 80rpx;

		.logo {
			width: 160rpx;
			height: 160rpx;
			margin-bottom: 20rpx;
		}

		.slogan {
			font-size: 36rpx;
			font-weight: bold;
			display: block;
		}
	}

	.form {
		.field {
			margin-bottom: 40rpx;
		}

		.custom-input {
			background-color: #f8fafc;
			border-radius: 60rpx;
			padding: 20rpx 32rpx;
			font-size: 30rpx;

			::v-deep .u-input__input {
				padding-left: 30rpx !important;
			}

			::v-deep .u-icon__icon {
				margin-right: 20rpx;
			}

			&:focus-within {
				background-color: #ffffff;
				box-shadow: 0 0 0 2rpx #f38b11;
			}
		}

		.eye-icon {
			padding-right: 16rpx;
			font-size: 38rpx;
			color: #a0aec0;
		}

		.login-btn {
			margin-top: 60rpx;
			background: linear-gradient(90deg, #f38b11, #f5a623);
			border-radius: 60rpx;
			color: white;
			font-size: 34rpx;
			font-weight: 600;
			padding: 24rpx 0;
			border: none;
			box-shadow: 0 8rpx 20rpx rgba(243, 139, 17, 0.25);

			&:active {
				transform: scale(0.97);
				opacity: 0.9;
			}

			&.btn-loading {
				opacity: 0.7;
			}
		}

		.extra {
			display: flex;
			justify-content: space-between;
			margin-top: 40rpx;
			font-size: 28rpx;
			color: #6c757d;

			.register-link,
			.forgot-link {
				color: #f38b11;
			}
		}
	}
</style>