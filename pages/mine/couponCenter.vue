<template>
	<view class="coupon-center-page">
		<u-navbar title="优惠券中心" :bgColor="'#5d7291'" :title-color="'#fff'" :back-text="'返回'"></u-navbar>

		<view class="category-tabs">
			<view v-for="tab in tabs" :key="tab.value" class="tab-item" :class="{ active: currentTab === tab.value }"
				@click="switchTab(tab.value)">
				{{ tab.label }}
			</view>
		</view>

		<scroll-view scroll-y class="coupon-list">
			<view v-for="coupon in couponList" :key="coupon.id" class="coupon-card">
				<image class="card-bg" src="/static/images/coupon_bg.png" mode="scaleToFill"></image>
				<view class="card-content">
					<view class="card-left">
						<text class="value">¥{{ coupon.value }}</text>
						<text class="condition">{{ coupon.condition }}</text>
						<text class="type-tag" v-if="coupon.type !== 'all' && coupon.type !== 'unlimited'">
							{{ getCategoryName(coupon.type) }}专用
						</text>
					</view>
					<view class="card-right">
						<text class="expire">有效期至 {{ coupon.expire }}</text>
						<button class="receive-btn" :class="{ disabled: coupon.received }" :disabled="coupon.received"
							@click="receiveCoupon(coupon)">
							{{ coupon.received ? '已领取' : '立即领取' }}
						</button>
					</view>
				</view>
			</view>
			<view v-if="couponList.length === 0" class="empty-tip">暂无优惠券</view>
		</scroll-view>
	</view>
</template>

<script>
	import request from '@/common/request.js';
	export default {
		data() {
			return {
				tabs: [{
						label: '全部',
						value: 'all'
					},
					{
						label: '无门槛',
						value: 'unlimited'
					},
					{
						label: '鱼竿类',
						value: 'rod'
					},
					{
						label: '鱼饵类',
						value: 'bait'
					},
					{
						label: '配件类',
						value: 'accessory'
					}
				],
				currentTab: 'all',
				// 已领优惠券
				couponList: [],
				// 新人优惠券
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
				]
			}
		},
		onLoad() {
			this.fetchCouponList();
		},
		methods: {
			// 获取类型
			getCategoryName(type) {
				const map = {
					rod: '鱼竿',
					bait: '鱼饵',
					accessory: '配件'
				};
				return map[type] || '';
			},

			async fetchCouponList() {
				// 未登录：展示新人优惠券（按分类筛选）
				if (!this.$store.state.isLoginStatus) {
					let newCoupons = [...this.newUserCoupons]; // 假设 newUserCoupons 已定义
					if (this.currentTab !== 'all') {
						newCoupons = newCoupons.filter(c => c.type === this.currentTab);
					}
					this.couponList = newCoupons;
					return;
				}
				// 已登录：从后端获取真实优惠券列表（不需要传 user_id）
				try {
					const res = await request({
						url: `${uni.$baseUrl}/api/coupons/list?category=${this.currentTab}`,
						method: 'GET'
					});
					if (res.data.code === 0) {
						this.couponList = res.data.data;
					} else {
						this.couponList = [];
					}
				} catch (error) {
					console.error('获取优惠券列表失败', error);
					this.couponList = [];
				}
			},

			switchTab(tab) {
				this.currentTab = tab;
				this.fetchCouponList();
			},
			async receiveCoupon(coupon) {
				if (!this.$store.state.isLoginStatus) {
					uni.showModal({
						title: '提示',
						content: '请先登录',
						confirmText: '去登录',
						success: (res) => {
							if (res.confirm) uni.switchTab({
								url: '/pages/mine/mine'
							});
						}
					});
					return;
				}
				if (coupon.received) return;
				try {
					const res = await request({
						url: uni.$baseUrl + '/api/coupons/receive',
						method: 'POST',
						data: {
							coupon_id: coupon.id
						}
					});
					if (res.data.code === 0) {
						uni.showToast({
							title: `领取成功！${coupon.value}元优惠券已到账`,
							icon: 'success'
						});
						coupon.received = true; // 直接更新状态
					} else {
						uni.showToast({
							title: res.data.message || '领取失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('领取优惠券失败', error);
					uni.showToast({
						title: '领取失败',
						icon: 'none'
					});
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.type-tag {
		font-size: 22rpx;
		color: #fff;
		background: rgba(0, 0, 0, 0.2);
		padding: 4rpx 12rpx;
		border-radius: 20rpx;
		margin-top: 8rpx;
		margin-left: 10rpx;
		display: inline-block;
	}

	.coupon-center-page {
		background-color: #fff;
		min-height: 100vh;
	}

	.category-tabs {
		display: flex;
		background: #fff;
		padding: 20rpx 0;
		border-bottom: 1rpx solid #eee;

		.tab-item {
			flex: 1;
			text-align: center;
			font-size: 28rpx;
			color: #666;
			position: relative;

			&.active {
				color: #5d7291;
				font-weight: bold;

				&::after {
					content: '';
					position: absolute;
					bottom: -10rpx;
					left: 50%;
					transform: translateX(-50%);
					width: 60rpx;
					height: 4rpx;
					background: #5d7291;
					border-radius: 2rpx;
				}
			}
		}
	}

	.coupon-list {
		padding: 20rpx;

		.coupon-card {
			background: linear-gradient(135deg, #ff9800, #ff5722);
			border-radius: 20rpx;
			margin-bottom: 30rpx;
			margin-right: 40rpx;
			position: relative;
			overflow: hidden;
			box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.15);

			.card-bg {
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				opacity: 0.1;
			}

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

					.receive-btn {
						background: #fff;
						color: #ff5722;
						border-radius: 60rpx;
						padding: 12rpx 32rpx;
						font-size: 28rpx;
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

		.empty-tip {
			text-align: center;
			font-size: 28rpx;
			color: #999;
			padding: 100rpx 0;
		}
	}
</style>