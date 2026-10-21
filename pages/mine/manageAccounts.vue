<template>
	<view class="manage-accounts">
		<u-navbar title="账号管理" :bgColor="'#5d7291'" :title-color="'#fff'" :back-text="'返回'"></u-navbar>

		<view class="tip">可关联最多3个账号，方便快速切换</view>

		<view class="account-list">
			<view v-for="acc in accounts" :key="acc.userId" class="account-item">
				<u-image width="80" height="80" shape="circle" :src="getImageUrl(acc.avatar)"
					mode="aspectFill"></u-image>
				<view class="info">
					<text class="nickname">{{ acc.nickname }}</text>
					<text class="username">@{{ acc.username }}</text>
				</view>
				<u-icon name="trash" size="40" color="#f56c6c" @click="deleteAccount(acc.userId)"></u-icon>
			</view>
			<view v-if="accounts.length === 0" class="empty">暂无关联账号</view>
		</view>

		<button class="add-btn" @click="showAddDialog = true" :disabled="accounts.length >= 3">添加关联账号</button>

		<!-- 添加账号弹窗 -->
		<u-modal v-model="showAddDialog" :show-cancel-button="true" @confirm="addAccount" title="添加关联账号">
			<view class="add-form">
				<u-input v-model="addForm.username" placeholder="用户名" :border="true" class="input-item" />
				<u-input v-model="addForm.password" placeholder="密码" type="password" :border="true"
					class="input-item" />
			</view>
		</u-modal>
	</view>
</template>

<script>
	import request from '@/common/request.js';

	export default {
		data() {
			return {
				accounts: [],
				showAddDialog: false,
				addForm: {
					username: '',
					password: ''
				}
			};
		},
		onShow() {
			this.loadAccounts();
		},
		methods: {
			getImageUrl(url) {
				if (!url) return '/static/images/user-avatar.jpg';
				if (url.startsWith('http')) return url;
				return uni.$imgUrl(url);
			},
			async loadAccounts() {
				try {
					const res = await request({
						url: '/api/user/associated_accounts',
						method: 'GET'
					});
					if (res.data.code === 0) {
						this.accounts = res.data.data;
					}
				} catch (error) {
					console.error('加载关联账号失败', error);
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					});
				}
			},
			async addAccount() {
				const {
					username,
					password
				} = this.addForm;
				if (!username || !password) {
					uni.showToast({
						title: '请填写完整',
						icon: 'none'
					});
					return;
				}
				uni.showLoading({
					title: '验证中...'
				});
				try {
					const res = await request({
						url: '/api/user/associate',
						method: 'POST',
						data: {
							username,
							password
						}
					});
					if (res.data.code === 0) {
						uni.showToast({
							title: '关联成功',
							icon: 'success'
						});
						this.showAddDialog = false;
						this.addForm = {
							username: '',
							password: ''
						};
						this.loadAccounts();
					} else {
						uni.showToast({
							title: res.data.message || '关联失败',
							icon: 'none'
						});
					}
				} catch (error) {
					uni.showToast({
						title: '网络错误',
						icon: 'none'
					});
				} finally {
					uni.hideLoading();
				}
			},
			async deleteAccount(userId) {
				uni.showModal({
					title: '提示',
					content: '确定解除关联吗？',
					success: async (modalRes) => {
						if (modalRes.confirm) {
							try {
								const res = await request({
									url: '/api/user/associate',
									method: 'DELETE',
									data: {
										linked_user_id: userId
									}
								});
								if (res.data.code === 0) {
									uni.showToast({
										title: '已解除关联',
										icon: 'success'
									});
									this.loadAccounts();
								} else {
									uni.showToast({
										title: res.data.message || '操作失败',
										icon: 'none'
									});
								}
							} catch (error) {
								uni.showToast({
									title: '网络错误',
									icon: 'none'
								});
							}
						}
					}
				});
			}
		}
	};
</script>

<style lang="scss" scoped>
	.manage-accounts {
		background: #f8f8f8;
		min-height: 100vh;
		padding: 30rpx;
	}

	.tip {
		font-size: 26rpx;
		color: #999;
		margin-bottom: 30rpx;
	}

	.account-list {
		background: #fff;
		border-radius: 20rpx;

		.account-item {
			display: flex;
			align-items: center;
			padding: 30rpx;
			border-bottom: 1rpx solid #f0f0f0;

			.info {
				flex: 1;
				margin-left: 30rpx;

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

		.empty {
			text-align: center;
			padding: 60rpx;
			color: #999;
			font-size: 28rpx;
		}
	}

	.add-btn {
		background: #f38b11;
		color: #fff;
		border-radius: 60rpx;
		margin-top: 60rpx;
		width: 80%;
	}

	.add-form {
		padding: 20rpx;

		.input-item {
			margin-bottom: 30rpx;
		}
	}
</style>