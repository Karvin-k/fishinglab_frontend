<template>
	<view class="register-page">
		<!-- 炫光渐变背景 -->
		<view class="bg-gradient" />

		<!-- 卡片内容 -->
		<view class="card">
			<!-- 顶部品牌区 -->
			<view class="brand">
				<image src="/static/images/logo.png" mode="aspectFit" class="logo" />
				<text class="slogan">加入十鲤钓场，开启渔乐人生</text>
			</view>

			<!-- 表单区 -->
			<view class="form">
				<!-- 用户名 -->
				<view class="field">
					<u-input v-model="form.username" placeholder="用户名" :border="false" prefixIcon="account" clearable
						class="custom-input" />
					<view class="error-tip" v-if="errors.username">{{ errors.username }}</view>
				</view>

				<!-- 密码 -->
				<view class="field">
					<u-input v-model="form.password" placeholder="密码" :type="showPassword ? 'text' : 'password'"
						:border="false" prefixIcon="lock" clearable class="custom-input">
						<template #suffix>
							<u-icon :name="showPassword ? 'eye' : 'eye-closed'" @click="showPassword = !showPassword"
								class="eye-icon" />
						</template>
					</u-input>
					<!-- 密码强度条 -->
					<view class="strength-bar" v-if="form.password">
						<view class="strength-level" :class="strengthClass" :style="{ width: strengthPercent }"></view>
					</view>
					<view class="error-tip" v-if="errors.password">{{ errors.password }}</view>
				</view>

				<!-- 确认密码 -->
				<view class="field">
					<u-input v-model="form.confirmPassword" placeholder="确认密码"
						:type="showConfirmPwd ? 'text' : 'password'" :border="false" prefixIcon="lock" clearable
						class="custom-input">
						<template #suffix>
							<u-icon :name="showConfirmPwd ? 'eye' : 'eye-closed'"
								@click="showConfirmPwd = !showConfirmPwd" class="eye-icon" />
						</template>
					</u-input>
					<view class="error-tip" v-if="errors.confirmPassword">{{ errors.confirmPassword }}</view>
				</view>

				<!-- 昵称 -->
				<view class="field">
					<u-input v-model="form.nickname" placeholder="昵称（选填）" :border="false" prefixIcon="person" clearable
						class="custom-input" />
					<view class="error-tip" v-if="errors.nickname">{{ errors.nickname }}</view>
				</view>

				<!-- 注册按钮 -->
				<button class="register-btn" :class="{ 'btn-loading': loading }" @click="doRegister"
					:disabled="loading">
					<text v-if="!loading">立即注册</text>
					<text v-else>注册中...</text>
				</button>

				<!-- 登录引导 -->
				<view class="login-tip">
					<text>已有账号？</text>
					<text class="login-link" @click="toLogin">去登录</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				form: {
					username: '',
					password: '',
					confirmPassword: '',
					nickname: ''
				},
				showPassword: false,
				showConfirmPwd: false,
				loading: false,
				errors: { // 动态错误提示
					username: '',
					password: '',
					confirmPassword: '',
					nickname: ''
				}
			};
		},
		computed: {
			// 密码强度百分比 (0~100)
			strengthPercent() {
				const level = this.passwordStrength;
				if (level === 0) return '0%';
				if (level === 1) return '25%';
				if (level === 2) return '50%';
				if (level === 3) return '75%';
				if (level === 4) return '100%';
				return '0%';
			},
			// 密码强度等级 class
			strengthClass() {
				const level = this.passwordStrength;
				if (level <= 1) return 'level-weak';
				if (level === 2) return 'level-medium';
				if (level >= 3) return 'level-strong';
				return '';
			},
			// 计算密码强度（复用原逻辑）
			passwordStrength() {
				const pwd = this.form.password;
				if (!pwd) return 0;
				let strength = 0;
				if (pwd.length >= 8) strength++;
				if (/[A-Z]/.test(pwd)) strength++;
				if (/[0-9]/.test(pwd)) strength++;
				if (/[^A-Za-z0-9]/.test(pwd)) strength++;
				return strength;
			}
		},
		watch: {
			'form.username'(val) {
				this.validateUsername(val);
			},
			'form.password'(val) {
				this.validatePassword(val);
				// 密码改变时同时校验确认密码
				if (this.form.confirmPassword) this.validateConfirmPassword(this.form.confirmPassword);
			},
			'form.confirmPassword'(val) {
				this.validateConfirmPassword(val);
			},
			'form.nickname'(val) {
				this.validateNickname(val);
			}
		},
		methods: {
			// ---------- 独立校验方法 ----------
			validateUsername(val) {
				if (!val) {
					this.errors.username = '用户名不能为空';
					return false;
				}
				if (val.length < 3 || val.length > 20) {
					this.errors.username = '用户名长度3-20个字符';
					return false;
				}
				if (!/^[a-zA-Z0-9_]+$/.test(val)) {
					this.errors.username = '只能包含字母、数字和下划线';
					return false;
				}
				this.errors.username = '';
				return true;
			},
			validatePassword(val) {
				if (!val) {
					this.errors.password = '密码不能为空';
					return false;
				}
				if (val.length < 6 || val.length > 20) {
					this.errors.password = '密码长度6-20个字符';
					return false;
				}
				// 注册要求包含字母和数字
				if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(val)) {
					this.errors.password = '需包含字母和数字';
					return false;
				}
				this.errors.password = '';
				return true;
			},
			validateConfirmPassword(val) {
				if (!val) {
					this.errors.confirmPassword = '请再次输入密码';
					return false;
				}
				if (val !== this.form.password) {
					this.errors.confirmPassword = '两次输入的密码不一致';
					return false;
				}
				this.errors.confirmPassword = '';
				return true;
			},
			validateNickname(val) {
				if (!val) return true; // 昵称选填，允许为空
				if (val.length < 2 || val.length > 10) {
					this.errors.nickname = '昵称长度2-10个字符';
					return false;
				}
				this.errors.nickname = '';
				return true;
			},
			// 整体表单校验
			async validateForm() {
				const validMap = {
					username: this.validateUsername(this.form.username),
					password: this.validatePassword(this.form.password),
					confirmPassword: this.validateConfirmPassword(this.form.confirmPassword),
					nickname: this.validateNickname(this.form.nickname)
				};
				return Object.values(validMap).every(v => v === true);
			},
			// 提交注册
			async doRegister() {
				const isValid = await this.validateForm();
				if (!isValid) {
					uni.showToast({
						title: '请检查表单信息',
						icon: 'none'
					});
					return;
				}

				this.loading = true;
				const nickname = this.form.nickname.trim() || this.form.username;
				try {
					const [err, res] = await uni.request({
						url: uni.$baseUrl + '/api/user/register',
						method: 'POST',
						data: {
							username: this.form.username,
							password: this.form.password,
							nickname: nickname
						}
					});
					if (err) throw err;
					if (res.data.code === 0) {
						uni.showToast({
							title: '注册成功，请登录',
							icon: 'success'
						});
						setTimeout(() => {
							uni.navigateBack(); // 返回上一页（登录页）
						}, 1500);
					} else {
						uni.showToast({
							title: res.data.message || '注册失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('注册失败:', error);
					uni.showToast({
						title: '网络错误，请重试',
						icon: 'none'
					});
				} finally {
					this.loading = false;
				}
			},
			toLogin() {
				uni.navigateBack();
			}
		}
	};
</script>

<style lang="scss" scoped>
	.register-page {
		min-height: 100vh;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		/* 取消内边距，让卡片直接贴边 */
		padding: 0;
		box-sizing: border-box;
	}

	/* 渐变背景依然铺满 */
	.bg-gradient {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(145deg, #eef2f7 0%, #d9e2ec 100%);
		z-index: -1;
	}

	/* 卡片铺满全屏，无圆角无最大宽度 */
	.card {
		width: 100%;
		height: 100%;
		min-height: 100vh;
		background: rgba(255, 255, 255, 0.96);
		backdrop-filter: blur(2px);
		border-radius: 0;
		/* 移除圆角 */
		padding: 60rpx 40rpx 80rpx;
		box-shadow: none;
		/* 移除阴影，全屏不必要 */
		display: flex;
		flex-direction: column;
		justify-content: center;
		/* 垂直居中内容 */
	}

	/* 品牌区不变，但可适当调整间距 */
	.brand {
		text-align: center;
		margin-bottom: 60rpx;

		.logo {
			width: 120rpx;
			height: 120rpx;
			margin-bottom: 20rpx;
		}

		.slogan {
			font-size: 28rpx;
			color: #7f8c8d;
			letter-spacing: 1px;
			display: block;
		}
	}

	/* 表单 */
	.form {
		width: 100%;

		.field {
			margin-bottom: 32rpx;
			position: relative;
		}

		.custom-input {

			// 调整间距
			::v-deep .u-input__input {
				padding-left: 30rpx !important;
			}

			::v-deep .u-icon__icon {
				margin-right: 20rpx;
			}

			background-color: #f8fafc;
			border-radius: 60rpx;
			padding: 20rpx 32rpx;
			font-size: 30rpx;
			transition: 0.2s;

			&:focus-within {
				background-color: #ffffff;
				box-shadow: 0 0 0 2rpx #f38b11;
			}
		}

		.eye-icon {
			padding-right: 16rpx;
			// margin-right: 20rpx;
			font-size: 38rpx;
			color: #a0aec0;
		}

		.strength-bar {
			height: 6rpx;
			background: #e2e8f0;
			border-radius: 3rpx;
			margin: 12rpx 24rpx 0;
			overflow: hidden;

			.strength-level {
				height: 100%;
				width: 0;
				transition: width 0.2s;
			}

			.level-weak {
				background: #ef4444;
			}

			.level-medium {
				background: #f59e0b;
			}

			.level-strong {
				background: #10b981;
			}
		}

		.error-tip {
			font-size: 22rpx;
			color: #ef4444;
			margin-left: 32rpx;
			margin-top: 8rpx;
		}

		.register-btn {
			margin-top: 40rpx;
			background: linear-gradient(90deg, #f38b11, #f5a623);
			border-radius: 60rpx;
			color: white;
			font-size: 34rpx;
			font-weight: 600;
			padding: 24rpx 0;
			border: none;
			transition: 0.2s;
			box-shadow: 0 8rpx 20rpx rgba(243, 139, 17, 0.25);

			&:active {
				transform: scale(0.97);
				opacity: 0.9;
			}

			&.btn-loading {
				opacity: 0.7;
			}
		}

		.login-tip {
			text-align: center;
			margin-top: 40rpx;
			font-size: 28rpx;
			color: #6c757d;

			.login-link {
				color: #f38b11;
				margin-left: 12rpx;
				font-weight: 500;
			}
		}
	}
</style>