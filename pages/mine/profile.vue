<template>
	<view class="profile-container">
		<!-- 头部用户信息（未登录时显示登录提示） -->
		<view class="profile-header">
			<view class="user-card" v-if="isLogin">
				<view class="avatar-section" @click="changeAvatar">
					<view class="avatar-wrapper">
						<u-image width="120" height="120" shape="circle"
							:src="getImageUrl(userInfo.avatar || '/static/images/user-avatar.jpg')" mode="aspectFill"
							class="avatar-img"></u-image>
						<view class="avatar-edit">
							<u-icon name="camera-fill" color="#fff" size="24"></u-icon>
						</view>
					</view>
					<text class="change-avatar-text">点击更换头像</text>
				</view>
				<view class="user-info-section">
					<view class="nickname-row">
						<text class="nickname">{{ userInfo.nickname }}</text>
						<u-icon name="edit-pen" color="#2979ff" size="32" @click="editNickname"></u-icon>
					</view>
					<text class="username">@{{ userInfo.username }}</text>
					<text class="user-id">ID: {{ userInfo.id }}</text>
				</view>
			</view>
			<view class="login-prompt" v-else @click="goToLogin">
				<u-icon name="account" size="80" color="#ccc"></u-icon>
				<text class="prompt-text">登录后享受更多功能</text>
				<button class="login-btn">立即登录/注册</button>
			</view>
		</view>

		<!-- 主要内容区域（设置项分组） -->
		<view class="profile-content">
			<!-- 账户信息（仅登录显示） -->
			<view class="info-card" v-if="isLogin">
				<view class="card-header">
					<text class="card-title">账户信息</text>
				</view>
				<u-cell-group :border="false">
					<u-cell-item title="手机号码" :value="userInfo.mobile || '未绑定'" :arrow="true" @click="editMobile"
						:title-style="titleStyle" :value-style="valueStyle">
						<u-icon slot="icon" name="phone" size="32" color="#2979ff"
							style="margin-right: 20rpx;"></u-icon>
					</u-cell-item>
					<u-cell-item title="我的余额" :value="`¥${userInfo.balance}`" :arrow="true" @click="goToBalance"
						:title-style="titleStyle" :value-style="balanceValueStyle">
						<u-icon slot="icon" name="rmb" size="32" color="#52c41a" style="margin-right: 20rpx;"></u-icon>
					</u-cell-item>
				</u-cell-group>
			</view>

			<!-- 安全设置（仅登录显示） -->
			<view class="info-card" v-if="isLogin">
				<view class="card-header">
					<text class="card-title">安全设置</text>
				</view>
				<u-cell-group :border="false">
					<u-cell-item title="修改密码" :arrow="true" @click="changePassword" :title-style="titleStyle">
						<u-icon slot="icon" name="lock" size="32" color="#faad14" style="margin-right: 20rpx;"></u-icon>
					</u-cell-item>
				</u-cell-group>
			</view>

			<!-- 账号管理（仅登录显示） -->
			<view class="info-card" v-if="isLogin">
				<view class="card-header">
					<text class="card-title">账号管理</text>
				</view>
				<u-cell-group :border="false">
					<u-cell-item title="关联账号" :arrow="true" @click="goToAccountManage" :title-style="titleStyle">
						<u-icon slot="icon" name="/static/icons/account.png" size="32" color="#5d7291"
							style="margin-right: 20rpx;"></u-icon>
					</u-cell-item>
					<u-cell-item title="切换账号" :arrow="true" @click="showSwitchAccountSheet = true"
						:title-style="titleStyle">
						<u-icon slot="icon" name="/static/icons/exchange.png" size="32" color="#5d7291"
							style="margin-right: 20rpx;"></u-icon>
					</u-cell-item>
				</u-cell-group>
			</view>

			<!-- 关于我们（未登录也显示） -->
			<view class="info-card">
				<view class="card-header">
					<text class="card-title">关于</text>
				</view>
				<u-cell-group :border="false">
					<u-cell-item title="关于我们" :arrow="true" @click="aboutUs" :title-style="titleStyle">
						<u-icon slot="icon" name="info-circle" size="32" color="#52c41a"
							style="margin-right: 20rpx;"></u-icon>
					</u-cell-item>
					<u-cell-item title="用户协议与隐私政策" :arrow="true" @click="userAgreement" :title-style="titleStyle">
					    <u-icon slot="icon" name="/static/icons/shield.png" size="32" color="#999" style="margin-right: 20rpx;"></u-icon>
					</u-cell-item>
				</u-cell-group>
			</view>

			<!-- 退出登录（仅登录显示） -->
			<view class="logout-section" v-if="isLogin">
				<button class="logout-btn" @click="logout">退出登录</button>
			</view>

			<!-- 切换账号 - 底部弹窗 -->
			<u-popup v-model="showSwitchAccountSheet" mode="bottom" round="20" :closeable="true"
				@close="showSwitchAccountSheet = false">
				<view class="switch-account-popup">
					<view class="popup-title">切换账号</view>
					<scroll-view scroll-y class="account-list" :style="{ maxHeight: '500rpx' }">
						<view v-for="acc in switchAccountActions" :key="acc.userId" class="account-item"
							@click="onSwitchAccountSelect(acc)">
							<u-image width="80" height="80" shape="circle" :src="getImageUrl(acc.avatar)"
								mode="aspectFill"></u-image>
							<view class="info">
								<text class="nickname">{{ acc.nickname }}</text>
								<text class="username">@{{ acc.username }}</text>
							</view>
						</view>
						<view v-if="switchAccountActions.length === 0" class="empty-tip">暂无关联账号</view>
					</scroll-view>
					<button class="cancel-btn" @click="showSwitchAccountSheet = false">取消</button>
				</view>
			</u-popup>
		</view>

		<!-- ==================== 弹窗部分（原有，仅登录可用） ==================== -->
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

		<!-- 修改昵称弹窗 -->
		<u-modal v-model="showNicknameModal" :show-cancel-button="true" @confirm="confirmNickname">
			<view class="modal-content">
				<text class="modal-title">修改昵称</text>
				<u-input v-model="editForm.nickname" placeholder="请输入新昵称" :border="true" maxlength="10" />
				<text class="input-tips">昵称长度2-10个字符</text>
			</view>
		</u-modal>

		<!-- 修改手机号弹窗 -->
		<u-modal v-model="showMobileModal" :show-cancel-button="true" @confirm="confirmMobile">
			<view class="modal-content">
				<text class="modal-title">修改手机号</text>
				<u-input v-model="editForm.mobile" placeholder="请输入手机号" :border="true" type="number" maxlength="11" />
				<text class="input-tips">请输入11位手机号码</text>
			</view>
		</u-modal>

		<!-- 修改密码弹窗 -->
		<u-modal v-model="showPasswordModal" :show-cancel-button="true" @confirm="confirmPassword">
			<view class="modal-content">
				<text class="modal-title">修改密码</text>
				<u-input v-model="editForm.oldPassword" placeholder="请输入原密码" :border="true" type="password" />
				<u-input v-model="editForm.newPassword" placeholder="请输入新密码" :border="true" type="password" />
				<u-input v-model="editForm.confirmPassword" placeholder="请确认新密码" :border="true" type="password" />
				<text class="input-tips">密码长度6-20位，需包含字母和数字</text>
			</view>
		</u-modal>
	</view>
</template>

<script>
	import request from '@/common/request.js';
	import {
		uploadFile
	} from '@/common/request.js';

	export default {
		data() {
			return {
				baseUrl: uni.$baseUrl,
				version: '1.0.0',
				isLogin: false,
				userInfo: {
					id: 0,
					username: '',
					nickname: '',
					mobile: '',
					avatar: '/static/images/user-avatar.jpg',
					balance: 0,
					hy_balance: 0,
					coupon_count: 0,
					fish_count: 0,
					fishing_count: 0,
					over_hundred_count: 0,
					champion_count: 0,
					create_time: ''
				},
				showAvatarPopup: false,
				showNicknameModal: false,
				showMobileModal: false,
				showPasswordModal: false,
				editForm: {
					nickname: '',
					mobile: '',
					oldPassword: '',
					newPassword: '',
					confirmPassword: ''
				},
				titleStyle: {
					fontSize: '32rpx',
					color: '#333'
				},
				valueStyle: {
					fontSize: '28rpx',
					color: '#666'
				},
				balanceValueStyle: {
					fontSize: '28rpx',
					color: '#52c41a'
				},
				hyBalanceValueStyle: {
					fontSize: '28rpx',
					color: '#fa541c'
				},
				showSwitchAccountSheet: false,
				switchAccountActions: [] // 动态生成
			};
		},
		onLoad() {
			this.checkLoginStatus();
		},
		onShow() {
			this.checkLoginStatus();
			if (this.isLogin) {
				this.loadUserInfo();
				this.loadLinkedAccounts();
			}

		},
		methods: {
			// 跳转账号管理页面
			goToAccountManage() {
				if (!this.isLogin) return this.goToLogin();
				uni.navigateTo({
					url: '/pages/mine/manageAccounts'
				});
			},

			// 加载关联账号列表用于切换
			async loadLinkedAccounts() {
				if (!this.isLogin) return;
				try {
					const res = await request({
						url: '/api/user/associated_accounts',
						method: 'GET'
					});
					if (res.data.code === 0) {
						const linked = res.data.data;
						const currentUserId = this.userInfo.id;
						const actions = linked
							.filter(acc => acc.userId !== currentUserId)
							.map(acc => ({
								name: `${acc.nickname} (@${acc.username})`,
								userId: acc.userId,
								username: acc.username,
								nickname: acc.nickname,
								avatar: acc.avatar,
								mobile: acc.mobile,
								balance: acc.balance
							}));
						this.switchAccountActions = actions;
					}
				} catch (error) {
					console.error('加载关联账号失败', error);
				}
			},

			// 点击切换账号
			async onSwitchAccountSelect(acc) {
				if (!acc) return;
				try {
					uni.showLoading({
						title: '切换中...'
					});
					const res = await request({
						url: '/api/user/switch',
						method: 'POST',
						data: {
							target_user_id: acc.userId
						}
					});
					if (res.data.code === 0) {
						const newUser = res.data.data.user;
						const newToken = res.data.data.access_token;
						// 更新 Vuex 和本地存储
						this.$store.commit('setUserInfo', newUser);
						uni.setStorageSync('vuex_user_info', newUser);
						uni.setStorageSync('isLoginStatus', true);
						uni.setStorageSync('vuex_user_token', newToken);
						// 注意：refresh_token 保持不变（切换后仍可用）
						this.isLogin = true;
						this.userInfo = newUser;
						uni.hideLoading();
						uni.showToast({
							title: '切换成功',
							icon: 'success'
						});
						this.showSwitchAccountSheet = false;
						this.loadUserInfo();
						this.loadLinkedAccounts(); // 刷新列表
					} else {
						uni.showToast({
							title: res.data.message || '切换失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('切换失败', error);
					uni.showToast({
						title: '切换失败',
						icon: 'none'
					});
				} finally {
					uni.hideLoading();
				}
			},
			checkLoginStatus() {
				const token = uni.getStorageSync('isLoginStatus');
				const user = uni.getStorageSync('vuex_user_info');
				this.isLogin = !!token && user;
				if (this.isLogin) {
					// 确保 Vuex 中有用户信息
					if (!this.$store.state.vuex_user_info || !this.$store.state.vuex_user_info.id) {
						this.$store.commit('setUserInfo', user);
					}
				}
			},
			goToLogin() {
				uni.navigateTo({
					url: '/pages/login/login'
				});
			},
			getImageUrl(url) {
				if (!url) return '';
				if (url.startsWith('http') || url.startsWith('data:')) return url;
				return this.baseUrl + url;
			},
			loadUserInfo() {
				try {
					const userInfo = this.$store.state.vuex_user_info;
					if (userInfo && typeof userInfo === 'object') {
						this.userInfo = {
							id: userInfo.id || 0,
							username: userInfo.username || '',
							nickname: userInfo.nickname || '',
							mobile: userInfo.mobile || '',
							avatar: userInfo.avatar || '/static/images/user-avatar.jpg',
							balance: userInfo.balance || 0,
							hy_balance: userInfo.hy_balance || 0,
							coupon_count: userInfo.coupon_count || 0,
							fish_count: userInfo.fish_count || 0,
							fishing_count: userInfo.fishing_count || 0,
							over_hundred_count: userInfo.over_hundred_count || 0,
							champion_count: userInfo.champion_count || 0,
							create_time: userInfo.create_time || '未知时间'
						};
					}
				} catch (error) {
					console.error('加载用户信息失败:', error);
				}
			},
			// ========== 头像上传（仅登录有效） ==========
			changeAvatar() {
				if (!this.isLogin) {
					this.goToLogin();
					return;
				}
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
				if (!this.isLogin) return;
				try {
					uni.showLoading({
						title: '上传中...'
					});
					const res = await uploadFile({
						url: uni.$baseUrl + '/api/user/avatar',
						filePath: filePath,
						name: 'avatar',
						// 不需要再传 formData 中的 user_id
					});
					const result = JSON.parse(res.data);
					if (result.code === 0) {
						const fullAvatarUrl = uni.$imgUrl(result.data.avatar_url);
						this.userInfo.avatar = fullAvatarUrl;
						const updatedUserInfo = {
							...this.$store.state.vuex_user_info,
							avatar: fullAvatarUrl
						};
						this.$store.commit('setUserInfo', updatedUserInfo);
						uni.setStorageSync('vuex_user_info', updatedUserInfo);
						uni.showToast({
							title: '头像更新成功',
							icon: 'success'
						});
					} else {
						throw new Error(result.message || '上传失败');
					}
				} catch (error) {
					uni.showToast({
						title: error.message || '头像上传失败',
						icon: 'none'
					});
				} finally {
					uni.hideLoading();
				}
			},
			// ========== 修改昵称/手机号/密码 ==========
			editNickname() {
				if (!this.isLogin) return this.goToLogin();
				this.editForm.nickname = this.userInfo.nickname;
				this.showNicknameModal = true;
			},
			// 修改昵称确认
			async confirmNickname() {
				const newNickname = this.editForm.nickname.trim();
				if (newNickname.length < 2 || newNickname.length > 10) {
					uni.showToast({
						title: '昵称长度需2-10个字符',
						icon: 'none'
					});
					return;
				}
				uni.showLoading({
					title: '更新中...'
				});
				try {
					const res = await request({
						url: uni.$baseUrl + '/api/user/nickname',
						method: 'PUT',
						data: {
							nickname: newNickname
						}
					});
					if (res.data.code === 0) {
						uni.showToast({
							title: '昵称修改成功',
							icon: 'success'
						});
						this.userInfo.nickname = newNickname;
						const storeUser = this.$store.state.vuex_user_info;
						storeUser.nickname = newNickname;
						this.$store.commit('setUserInfo', storeUser);
						uni.setStorageSync('vuex_user_info', storeUser);
						this.showNicknameModal = false;
					} else {
						uni.showToast({
							title: res.data.message || '修改失败',
							icon: 'none'
						});
					}
				} catch (error) {
					uni.showToast({
						title: '请求失败',
						icon: 'none'
					});
				} finally {
					uni.hideLoading();
				}
			},
			editMobile() {
				if (!this.isLogin) return this.goToLogin();
				this.editForm.mobile = this.userInfo.mobile || '';
				this.showMobileModal = true;
			},
			// 修改手机号确认
			async confirmMobile() {
				const mobile = this.editForm.mobile.trim();
				if (!/^1[3-9]\d{9}$/.test(mobile)) {
					uni.showToast({
						title: '请输入正确的手机号',
						icon: 'none'
					});
					return;
				}
				uni.showLoading({
					title: '更新中...'
				});
				try {
					const res = await request({
						url: uni.$baseUrl + '/api/user/update_mobile',
						method: 'POST',
						data: {
							mobile: mobile
						}
					});
					if (res.data.code === 0) {
						uni.showToast({
							title: '手机号修改成功',
							icon: 'success'
						});
						this.userInfo.mobile = mobile;
						const storeUser = this.$store.state.vuex_user_info;
						storeUser.mobile = mobile;
						this.$store.commit('setUserInfo', storeUser);
						uni.setStorageSync('vuex_user_info', storeUser);
						this.showMobileModal = false;
					} else {
						uni.showToast({
							title: res.data.message || '修改失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('修改手机号失败', error);
					uni.showToast({
						title: '网络错误，请重试',
						icon: 'none'
					});
				} finally {
					uni.hideLoading();
				}
			},
			changePassword() {
				if (!this.isLogin) return this.goToLogin();
				this.editForm = {
					oldPassword: '',
					newPassword: '',
					confirmPassword: ''
				};
				this.showPasswordModal = true;
			},
			// 修改密码确认
			// 修改密码确认
			async confirmPassword() {
				const {
					oldPassword,
					newPassword,
					confirmPassword
				} = this.editForm;
				if (!oldPassword || !newPassword || !confirmPassword) {
					uni.showToast({
						title: '请填写完整',
						icon: 'none'
					});
					return;
				}
				if (newPassword !== confirmPassword) {
					uni.showToast({
						title: '两次新密码不一致',
						icon: 'none'
					});
					return;
				}
				if (newPassword.length < 6 || newPassword.length > 20) {
					uni.showToast({
						title: '密码长度6-20位',
						icon: 'none'
					});
					return;
				}
				if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(newPassword)) {
					uni.showToast({
						title: '密码需包含字母和数字',
						icon: 'none'
					});
					return;
				}
				uni.showLoading({
					title: '修改中...'
				});
				try {
					const res = await request({
						url: uni.$baseUrl + '/api/user/update_password',
						method: 'POST',
						data: {
							old_password: oldPassword,
							new_password: newPassword
						}
					});
					if (res.data.code === 0) {
						uni.showToast({
							title: '密码修改成功，请重新登录',
							icon: 'success'
						});
						// 清除本地登录状态，跳转到登录页
						uni.removeStorageSync('vuex_user_info');
						uni.removeStorageSync('isLoginStatus');
						uni.removeStorageSync('vuex_user_token');
						this.$store.commit('clearUserData');
						setTimeout(() => {
							uni.reLaunch({
								url: '/pages/login/login'
							});
						}, 1500);
					} else {
						uni.showToast({
							title: res.data.message || '修改失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('修改密码失败', error);
					uni.showToast({
						title: '网络错误，请重试',
						icon: 'none'
					});
				} finally {
					uni.hideLoading();
				}
			},
			goToBalance() {
				if (!this.isLogin) return this.goToLogin();
				uni.navigateTo({
					url: '/pages/mine/balance'
				});
			},
			// ========== 通用设置方法 ==========
			notificationSettings() {
				uni.showToast({
					title: '功能开发中',
					icon: 'none'
				});
			},
			privacySettings() {
				uni.showToast({
					title: '功能开发中',
					icon: 'none'
				});
			},
			aboutUs() {
				uni.navigateTo({
					url: '/pages/mine/aboutUs'
				});
			},
			userAgreement() {
				uni.navigateTo({
					url: '/pages/mine/userAgreement'
				});
			},
			// ========== 退出登录 ==========
			logout() {
				uni.showModal({
					title: '提示',
					content: '确定退出登录吗？',
					success: (res) => {
						if (res.confirm) {
							uni.removeStorageSync('vuex_user_info');
							uni.removeStorageSync('isLoginStatus');
							this.$store.commit('clearUserData');
							this.isLogin = false;
							uni.showToast({
								title: '已退出登录',
								icon: 'success'
							});
							setTimeout(() => {
								uni.reLaunch({
									url: '/pages/mine/mine'
								});
							}, 1000);
						}
					}
				});
			}
		}
	}
</script>

<style lang="scss" scoped>
	.profile-container {
		background-color: #fff;
		min-height: 100vh;
	}

	.profile-header {
		padding: 40rpx 30rpx 20rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.user-card {
		display: flex;
		align-items: center;
	}

	.avatar-section {
		margin-right: 40rpx;
		text-align: center;

		.avatar-wrapper {
			position: relative;
			margin-bottom: 16rpx;

			.avatar-edit {
				position: absolute;
				bottom: 0;
				right: 0;
				background: #5d7291;
				border-radius: 50%;
				width: 48rpx;
				height: 48rpx;
				display: flex;
				align-items: center;
				justify-content: center;
			}
		}

		.change-avatar-text {
			font-size: 24rpx;
			color: #999;
		}
	}

	.user-info-section {
		flex: 1;

		.nickname-row {
			display: flex;
			align-items: center;
			margin-bottom: 12rpx;

			.nickname {
				font-size: 40rpx;
				font-weight: bold;
				margin-right: 20rpx;
			}
		}

		.username,
		.user-id {
			font-size: 28rpx;
			color: #666;
		}
	}

	.login-prompt {
		text-align: center;
		padding: 80rpx 0;

		.prompt-text {
			font-size: 32rpx;
			color: #999;
			display: block;
			margin: 20rpx 0;
		}

		.login-btn {
			width: 300rpx;
			background: #f38b11;
			color: #fff;
			border-radius: 60rpx;
			margin-top: 40rpx;
		}
	}

	.profile-content {
		padding: 30rpx;
	}

	.info-card {
		background: #fff;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 30rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);

		.card-header {
			margin-bottom: 30rpx;
		}

		.card-title {
			font-size: 32rpx;
			font-weight: bold;
			display: block;
			margin-bottom: 8rpx;
		}
	}

	.logout-section {
		margin-top: 40rpx;
		padding: 0 30rpx 60rpx;

		.logout-btn {
			background-color: #fff;
			color: #e54d42;
			border-radius: 60rpx;
			height: 88rpx;
			line-height: 88rpx;
			font-size: 32rpx;
			border: 1rpx solid #e54d42;
		}
	}

	.avatar-popup {
		padding: 40rpx;

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

	.modal-content {
		padding: 20rpx;

		.modal-title {
			display: block;
			font-size: 32rpx;
			font-weight: bold;
			text-align: center;
			margin-bottom: 30rpx;
		}

		.u-input {
			margin-bottom: 20rpx;
		}

		.input-tips {
			display: block;
			font-size: 24rpx;
			color: #999;
			margin-top: 16rpx;
			text-align: center;
		}
	}

	/* 切换账号弹窗样式 */
	.switch-account-popup {
		padding: 40rpx 30rpx;

		.popup-title {
			font-size: 34rpx;
			font-weight: bold;
			text-align: center;
			margin-bottom: 30rpx;
		}

		.account-list {
			max-height: 500rpx;

			.account-item {
				display: flex;
				align-items: center;
				padding: 20rpx 0;
				border-bottom: 1rpx solid #f0f0f0;

				&:active {
					background-color: #f5f5f5;
				}

				.info {
					margin-left: 30rpx;
					flex: 1;

					.nickname {
						font-size: 32rpx;
						font-weight: bold;
						display: block;
					}

					.username {
						font-size: 26rpx;
						color: #666;
					}
				}
			}

			.empty-tip {
				text-align: center;
				padding: 60rpx;
				color: #999;
				font-size: 28rpx;
			}
		}

		.cancel-btn {
			margin-top: 40rpx;
			background: #f5f5f5;
			border-radius: 60rpx;
			color: #333;
			font-size: 32rpx;
			padding: 20rpx 0;
			border: none;
		}
	}
</style>