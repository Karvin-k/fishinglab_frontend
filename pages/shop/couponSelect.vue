<template>
	<view class="coupon-select-page">
		<u-navbar title="选择优惠券" :bgColor="'#5d7291'" :title-color="'#fff'" :back-text="'返回'"></u-navbar>

		<!-- Tab 切换 -->
		<view class="tabs">
			<view class="tab-item" :class="{ active: currentTab === 'available' }" @click="currentTab = 'available'">
				可用优惠券</view>
			<view class="tab-item" :class="{ active: currentTab === 'unavailable' }"
				@click="currentTab = 'unavailable'">不可用优惠券</view>
		</view>

		<!-- 优惠券列表 -->
		<scroll-view scroll-y class="coupon-list">
			<!-- 可用优惠券 -->
			<view v-if="currentTab === 'available'">
				<view v-for="coupon in availableCoupons" :key="coupon.id" class="coupon-card"
					:class="{ selected: selectedId === coupon.id }" @click="selectCoupon(coupon)">
					<image class="card-bg" src="/static/images/coupon_bg.png" mode="scaleToFill"></image>
					<view class="card-content">
						<view class="card-left">
							<text class="value">¥{{ coupon.value }}</text>
							<text class="condition">{{ coupon.condition }}</text>
						</view>
						<view class="card-right">
							<text class="expire">有效期至 {{ coupon.expire }}</text>
							<view class="radio-icon">
								<u-icon :name="selectedId === coupon.id ? 'checkbox-mark' : 'circle'" size="24"
									color="#5d7291" />
							</view>
						</view>
					</view>
				</view>
				<view v-if="availableCoupons.length === 0" class="empty-tip">暂无可用优惠券</view>
			</view>

			<!-- 不可用优惠券 -->
			<view v-else>
				<view v-for="coupon in unavailableCoupons" :key="coupon.id" class="coupon-card disabled">
					<image class="card-bg" src="/static/images/coupon_bg.png" mode="scaleToFill"></image>
					<view class="card-content">
						<view class="card-left">
							<text class="value">¥{{ coupon.value }}</text>
							<text class="condition">{{ coupon.condition }}</text>
						</view>
						<view class="card-right">
							<text class="expire">有效期至 {{ coupon.expire }}</text>
							<view class="unavailable-reason">{{ coupon.unavailableReason }}</view>
						</view>
					</view>
				</view>
				<view v-if="unavailableCoupons.length === 0" class="empty-tip">暂无不可用优惠券</view>
			</view>
		</scroll-view>

		<!-- 底部固定栏 -->
		<view class="footer-bar">
			<view class="discount-info">
				<text>已优惠</text>
				<text class="discount-price">¥{{ selectedDiscount.toFixed(2) }}</text>
			</view>
			<button class="confirm-btn" @click="confirmSelect">确认</button>
		</view>
	</view>
</template>

<script>
	import request from '@/common/request.js';

	export default {
		data() {
			return {
				totalAmount: 0,
				currentTab: 'available',
				availableCoupons: [],
				unavailableCoupons: [],
				selectedId: null,
				selectedDiscount: 0,
				selectedCoupon: null,
				category: ''
			}
		},
		onLoad(options) {
			this.totalAmount = parseFloat(options.totalAmount) || 0;
			this.category = options.category || '';
			const selectedId = options.selectedId;
			if (selectedId) this.selectedId = parseInt(selectedId);
			this.fetchCoupons();
			console.log('接收到的类别:', this.category);
		},
		methods: {
			async fetchCoupons() {
				if (!this.getCurrentUserId()) return;
				try {
					// 获取可用优惠券（不需要传 user_id）
					const res = await request({
						url: `${uni.$baseUrl}/api/user/available_coupons?total_amount=${this.totalAmount}&category=${this.category}`,
						method: 'GET'
					});
					if (res.data.code === 0) {
						this.availableCoupons = res.data.data;
						// 同步选中状态
						if (this.selectedId) {
							const selected = this.availableCoupons.find(c => c.id === this.selectedId);
							if (selected) {
								this.selectedCoupon = selected;
								this.selectedDiscount = selected.value;
							} else {
								this.selectedId = null;
							}
						}
					}
					// 获取所有已领取但未使用的优惠券（用于不可用列表）
					await this.fetchUnavailableCoupons();
				} catch (error) {
					console.error('获取优惠券失败', error);
					uni.showToast({
						title: '获取优惠券失败',
						icon: 'none'
					});
				}
			},
			async fetchUnavailableCoupons() {
				if (!this.getCurrentUserId()) return;
				try {
					const res = await request({
						url: uni.$baseUrl + '/api/user/all_coupons', // 不再需要 user_id
						method: 'GET'
					});
					if (res.data.code === 0) {
						const all = res.data.data;
						const availableIds = this.availableCoupons.map(c => c.id);
						this.unavailableCoupons = all.filter(c => !availableIds.includes(c.id)).map(c => ({
							...c,
							unavailableReason: this.getUnavailableReason(c)
						}));
					}
				} catch (error) {
					console.error('获取不可用优惠券失败', error);
				}
			},
			getUnavailableReason(coupon) {
				if (coupon.expire < new Date().toISOString().slice(0, 10)) return '已过期';
				if (this.totalAmount < coupon.min_amount) return `满${coupon.min_amount}元可用`;
				if (coupon.type !== 'all' && coupon.type !== 'unlimited' && coupon.type !== this.category) {
					return `仅限${this.getCategoryName(coupon.type)}使用`;
				}
				return '不可用';
			},
			getCategoryName(type) {
				const map = {
					rod: '鱼竿',
					bait: '鱼饵',
					accessory: '配件'
				};
				return map[type] || type;
			},
			selectCoupon(coupon) {
				if (this.selectedId === coupon.id) {
					this.selectedId = null;
					this.selectedDiscount = 0;
					this.selectedCoupon = null;
				} else {
					this.selectedId = coupon.id;
					this.selectedDiscount = coupon.value;
					this.selectedCoupon = coupon;
				}
			},
			confirmSelect() {
				uni.$emit('couponSelected', this.selectedCoupon ? {
					...this.selectedCoupon
				} : null);
				uni.navigateBack();
			},
			getCurrentUserId() {
				let userInfo = this.$store.state.vuex_user_info || uni.getStorageSync('vuex_user_info');
				return userInfo?.id || null;
			}
		}
	}
</script>

<style lang="scss" scoped>
	.coupon-select-page {
		background-color: #f5f5f5;
		min-height: 100vh;
		padding-bottom: 120rpx;
	}

	/* Tab 栏样式 */
	.tabs {
		display: flex;
		background: #fff;
		padding: 20rpx 0;
		border-bottom: 1rpx solid #eee;

		.tab-item {
			flex: 1;
			text-align: center;
			font-size: 28rpx;
			color: #666;
			padding-bottom: 16rpx;

			&.active {
				color: #5d7291;
				font-weight: bold;
				border-bottom: 4rpx solid #5d7291;
			}
		}
	}

	/* 优惠券列表容器 */
	.coupon-list {
		padding: 20rpx;
		box-sizing: border-box;
	}

	/* 优惠券卡片（与“优惠券中心”样式一致） */
	.coupon-card {
		background: linear-gradient(135deg, #ff9800, #ff5722);
		border-radius: 20rpx;
		margin-bottom: 30rpx;
		position: relative;
		overflow: hidden;
		box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.15);
		transition: all 0.2s;

		/* 卡片背景图（可选） */
		.card-bg {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			opacity: 0.1;
		}

		/* 卡片内容区域 */
		.card-content {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 40rpx 30rpx;
			position: relative;
			z-index: 2;

			.card-left {
				.value {
					font-size: 56rpx;
					font-weight: bold;
					color: #fff;
					display: block;
				}

				.condition {
					font-size: 28rpx;
					color: rgba(255, 255, 255, 0.9);
					margin-top: 16rpx;
					display: block;
				}
			}

			.card-right {
				display: flex;
				flex-direction: column;
				align-items: flex-end;

				.expire {
					font-size: 24rpx;
					color: rgba(255, 255, 255, 0.8);
					margin-bottom: 20rpx;
				}

				.radio-icon {
					width: 40rpx;
				}

				.unavailable-reason {
					font-size: 24rpx;
					color: rgba(255, 255, 255, 0.9);
					background: rgba(0, 0, 0, 0.3);
					padding: 6rpx 12rpx;
					border-radius: 30rpx;
					margin-top: 10rpx;
				}
			}
		}

		/* 选中状态样式 */
		&.selected {
			border: 2rpx solid #fff;
			box-shadow: 0 0 0 4rpx #5d7291;
		}

		/* 不可用状态样式 */
		&.disabled {
			opacity: 0.6;
			filter: grayscale(0.1);

			.unavailable-reason {
				background: rgba(0, 0, 0, 0.5);
			}
		}
	}

	.empty-tip {
		text-align: center;
		font-size: 28rpx;
		color: #999;
		padding: 100rpx 0;
	}

	/* 底部固定栏 */
	.footer-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: #fff;
		padding: 20rpx 30rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);

		.discount-info {
			font-size: 36rpx;
			color: #666;

			.discount-price {
				color: #f38b11;
				font-size: 36rpx;
				font-weight: bold;
				margin-left: 16rpx;
			}
		}

		.confirm-btn {
			background: #f38b11;
			color: #fff;
			margin-left: 200rpx;
			border-radius: 60rpx;
			height: 70rpx;
			width: 230rpx;
			line-height: 70rpx;
			padding: 0 40rpx;
			font-size: 28rpx;
			border: none;
		}
	}
</style>