<template>
	<view class="apply-status-container">
		<u-navbar title="申请状态" :border="true"></u-navbar>

		<view class="status-content">
			<!-- 状态图标 -->
			<view class="status-icon">
				<u-icon :name="statusConfig.icon" size="120" :color="statusConfig.color"></u-icon>
			</view>

			<!-- 状态标题 -->
			<view class="status-title">{{ statusConfig.title }}</view>

			<!-- 状态描述 -->
			<view class="status-desc">{{ statusConfig.desc }}</view>

			<!-- 申请信息 -->
			<view class="application-info">
				<view class="info-item">
					<text class="label">店铺名称：</text>
					<text class="value">{{ applicationData.shopName }}</text>
				</view>
				<view class="info-item">
					<text class="label">联系电话：</text>
					<text class="value">{{ applicationData.contactPhone }}</text>
				</view>
				<view class="info-item">
					<text class="label">申请时间：</text>
					<text class="value">{{ applicationData.applyTime }}</text>
				</view>
				<view v-if="applicationData.merchantStatus === 'rejected'" class="info-item">
					<text class="label">拒绝原因：</text>
					<text class="value reject-reason">{{ applicationData.rejectReason }}</text>
				</view>
			</view>

			<!-- 操作按钮 -->
			<view class="action-buttons">
				<u-button v-if="applicationData.merchantStatus === 'rejected'" type="primary" @click="reapply">
					重新申请
				</u-button>
				<u-button type="default" @click="goBack">返回首页</u-button>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				applicationData: {
					shopName: '',
					contactPhone: '',
					applyTime: '',
					merchantStatus: '',
					rejectReason: ''
				}
			}
		},
		computed: {
			statusConfig() {
				const status = this.applicationData.merchantStatus
				const configs = {
					'pending': {
						icon: 'clock',
						color: '#ff9900',
						title: '审核中',
						desc: '您的申请正在审核中，请耐心等待'
					},
					'approved': {
						icon: 'checkmark-circle',
						color: '#19be6b',
						title: '审核通过',
						desc: '恭喜！您的商家申请已通过审核'
					},
					'rejected': {
						icon: 'close-circle',
						color: '#fa3534',
						title: '审核未通过',
						desc: '很遗憾，您的申请未通过审核'
					}
				}
				return configs[status] || configs.pending
			}
		},
		onLoad() {
			this.loadApplicationData()
		},
		methods: {
			async loadApplicationData() {
				try {
					const userId = this.getCurrentUserId()
					if (!userId) {
						uni.showToast({
							title: '请先登录',
							icon: 'none'
						})
						setTimeout(() => {
							uni.navigateTo({
								url: '/pages/mine/mine'
							})
						}, 1500)
						return
					}

					const [err, response] = await uni.request({
						url: uni.$baseUrl + '/api/merchant/application_status',
						method: 'GET',
						data: {
							user_id: userId
						}
					})

					if (err) {
						throw err
					}

					if (response.statusCode !== 200) {
						throw new Error(`服务器错误，状态码: ${response.statusCode}`)
					}

					const res = response.data
					console.log('申请状态数据:', res)

					if (res.code === 0 && res.data) {
						this.applicationData = {
							shopName: res.data.shop_name,
							contactPhone: res.data.contact_phone,
							applyTime: this.formatTime(res.data.apply_time),
							merchantStatus: res.data.merchant_status,
							rejectReason: res.data.reject_reason || ''
						}
					} else {
						uni.showToast({
							title: res.message || '获取申请信息失败',
							icon: 'none'
						})
					}
				} catch (error) {
					console.error('加载申请数据失败:', error)
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					})
				}
			},
			getCurrentUserId() {
				let userInfo = this.$store.state.vuex_user_info || uni.getStorageSync('vuex_user_info')
				return userInfo && userInfo.id ? userInfo.id : null
			},
			formatTime(timeStr) {
				if (!timeStr) return ''
				const date = new Date(timeStr)
				return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
			},
			reapply() {
				uni.redirectTo({
					url: '/pages/merchant/apply'
				})
			},
			goBack() {
				uni.switchTab({
					url: '/pages/mine/mine'
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	.apply-status-container {
		height: 100vh;
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
	}

	.status-content {
		padding: 60rpx 40rpx;
		text-align: center;
	}

	.status-icon {
		margin-bottom: 40rpx;
	}

	.status-title {
		font-size: 48rpx;
		font-weight: 600;
		color: #2c3e50;
		margin-bottom: 24rpx;
	}

	.status-desc {
		font-size: 30rpx;
		color: #6c757d;
		margin-bottom: 60rpx;
		line-height: 1.6;
	}

	.application-info {
		background: #fff;
		border-radius: 20rpx;
		padding: 40rpx;
		margin-bottom: 60rpx;
		box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.06);
		text-align: left;
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 24rpx;
		padding-bottom: 24rpx;
		border-bottom: 1rpx solid #f0f0f0;

		&:last-child {
			margin-bottom: 0;
			padding-bottom: 0;
			border-bottom: none;
		}

		.label {
			font-size: 28rpx;
			color: #6c757d;
			flex-shrink: 0;
			margin-right: 20rpx;
		}

		.value {
			font-size: 28rpx;
			color: #2c3e50;
			font-weight: 500;
			text-align: right;
			flex: 1;
		}

		.reject-reason {
			color: #fa3534;
			background: #fef0f0;
			padding: 20rpx;
			border-radius: 8rpx;
			margin-top: 8rpx;
		}
	}

	.action-buttons {
		display: flex;
		flex-direction: column;
		gap: 24rpx;

		::v-deep .u-button {
			height: 88rpx;
			font-size: 32rpx;
			font-weight: 600;
		}
	}
</style>