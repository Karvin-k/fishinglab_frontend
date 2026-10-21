<template>
	<view class="detail-container">
		<!-- 自定义导航栏 -->
		<view class="custom-navbar">
			<view class="navbar-left" @click="goBack">
				<u-icon name="arrow-left" size="24" color="#fff" />
			</view>
			<view class="navbar-title">订单详情</view>
			<view class="navbar-right"></view>
		</view>

		<scroll-view scroll-y class="scroll-content" v-if="!loading && order">
			<!-- 顶部状态卡片（增加订单类型标识） -->
			<view class="status-section">
				<view class="status-icon">
					<u-icon :name="statusIcon" size="48" :color="statusColor" />
				</view>
				<view class="status-text">
					<text class="main-status">订单状态：{{ statusText }}</text>
					<view v-if="order.order_status === 0 && countdownText" class="expire-timer">
						剩余支付时间：{{ countdownText }}
					</view>
					<text class="order-type-label">{{ orderTypeLabel }} — </text>
					<text class="sub-status"> {{ statusHint }}</text>
				</view>
			</view>

			<!-- 商品收货信息（仅当包含商品时显示） -->
			<view v-if="hasProduct" class="info-section">
				<view class="section-title">
					<u-icon name="map" size="32" color="#5d7291" />
					<text>收货信息</text>
				</view>
				<view v-if="order.address_type === 'delivery'" class="delivery-info">
					<text class="info-line">收货人：{{ order.receiver_name }}</text>
					<text class="info-line">手机号：{{ order.receiver_phone }}</text>
					<text class="info-line">收货地址：{{ order.receiver_address }}</text>
				</view>
				<view v-else-if="order.address_type === 'pickup'" class="pickup-info">
					<view class="info-line" v-if="pondName">鱼塘：{{ pondName }}</view>
					<view class="info-line" v-if="seatName">钓位：{{ seatName }}</view>
					<view class="info-line" v-if="!pondName && !seatName && order.pond_id && order.seat_id">
						自提点信息加载中...
					</view>
					<view class="info-line" v-if="!order.pond_id || !order.seat_id">
						未选择自提点
					</view>
				</view>
			</view>

			<!-- 订单清单 -->
			<view class="goods-section">
				<view class="section-title">
					<u-icon name="shopping-cart" size="32" color="#5d7291" />
					<text>订单清单</text>
				</view>
				<view v-for="(item, idx) in order.items" :key="idx" class="goods-item">
					<u-image class="goods-img"
						:src="getImageUrl(item.product_image) || '/static/images/default-service.png'" width="140rpx"
						height="140rpx" border-radius="16rpx" />
					<view class="goods-info">
						<text class="goods-name">{{ item.product_name }}</text>
						<!-- 商品规格 -->
						<text
							v-if="item.item_type === 'product' && item.product_attributes && item.product_attributes.length"
							class="goods-spec">
							规格：{{ item.product_attributes.join(' + ') }}
						</text>
						<!-- 服务项专属信息：地址、预约日期、场次、人数 -->
						<view v-if="item.item_type === 'service'" class="service-detail-info">
							<text class="service-line" v-if="item.service_date">·预约日期：{{ item.service_date }}</text>
							<text class="service-line"
								v-if="item.service_time_slot">·场次：{{ item.service_time_slot }}</text>
							<text class="service-line">·人数：{{ item.participant_count || item.quantity }}</text>
							<text class="service-line">·服务地址：{{ item.address || '商家未提供地址' }}</text>
						</view>
						<view class="goods-price-row">
							<text class="price">¥{{ item.unit_price }}</text>
							<text class="quantity">x{{ item.quantity }}</text>
							<text class="subtotal">小计：¥{{ (item.unit_price * item.quantity).toFixed(2) }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 订单信息 -->
			<view class="order-section">
				<view class="section-title">
					<u-icon name="order" size="32" color="#5d7291" />
					<text>订单信息</text>
				</view>
				<view class="order-row">
					<text class="label">订单编号：</text>
					<text class="value">{{ order.order_number }}</text>
				</view>
				<view class="order-row">
					<text class="label">创建时间：</text>
					<text class="value">{{ order.created_at }}</text>
				</view>
				<view class="order-row">
					<text class="label">支付方式：</text>
					<text class="value">余额支付</text>
				</view>
				<view class="order-row">
					<text class="label">订单备注：</text>
					<text class="value">{{ order.remark || '无' }}</text>
				</view>
				<view class="order-row total">
					<text class="label">实付金额：</text>
					<text class="value price">¥{{ order.total_amount }}</text>
				</view>
			</view>

			<!-- 底部按钮（仅待付款） -->
			<view class="bottom-actions" v-if="order.order_status === 0">
				<button class="action-btn pay-btn" @click="payOrder">立即支付</button>
				<button class="action-btn cancel-btn" @click="cancelOrder">取消订单</button>
			</view>
		</scroll-view>

		<view v-if="loading" class="loading">
			<u-loading mode="circle" size="40" />
		</view>
		<u-empty v-else-if="!order" mode="order" text="订单不存在" />
	</view>
</template>

<script>
	import request from '@/common/request.js';

	export default {
		data() {
			return {
				orderId: null,
				order: null,
				loading: true,
				pondName: '',
				seatName: '',
				countdownText: '',
				countdownInterval: null
			}
		},
		computed: {
			hasProduct() {
				return this.order && this.order.items && this.order.items.some(item => item.item_type === 'product');
			},
			hasService() {
				return this.order && this.order.items && this.order.items.some(item => item.item_type === 'service');
			},
			orderTypeLabel() {
				if (this.hasProduct && this.hasService) return '混合订单：商品 + 服务';
				if (this.hasProduct) return '仅商品';
				if (this.hasService) return '仅服务';
				return '';
			},
			statusText() {
				if (!this.order) return '';
				if (this.order.item_type === 'service' || (this.hasService && !this.hasProduct)) {
					const map = {
						0: '待付款',
						1: '待使用',
						2: '已完成',
						3: '已取消'
					};
					return map[this.order.order_status] || '未知';
				} else {
					const map = {
						0: '待付款',
						1: '待收货',
						2: '已完成',
						3: '已取消'
					};
					return map[this.order.order_status] || '未知';
				}
			},
			statusIcon() {
				const map = {
					0: 'clock',
					1: 'car',
					2: 'checkmark-circle',
					3: 'close-circle'
				};
				return map[this.order?.order_status] || 'info-circle';
			},
			statusColor() {
				const map = {
					0: '#f38b11',
					1: '#5d7291',
					2: '#52c41a',
					3: '#999'
				};
				return map[this.order?.order_status] || '#999';
			},
			statusHint() {
				if (!this.order) return '';
				if (this.order.order_status === 0) {
					return `订单将于 ${this.order.expire_time || ''} 自动取消`;
				} else if (this.order.order_status === 1) {
					return (this.order.item_type === 'service' || (this.hasService && !this.hasProduct)) ?
						'请按时到达服务地点' : '商品已发出，请留意物流信息';
				} else if (this.order.order_status === 2) {
					return '感谢您的使用，欢迎再次光临';
				} else if (this.order.order_status === 3) {
					return '订单已取消';
				}
				return '';
			}
		},
		onLoad(options) {
			if (options.orderId) {
				this.orderId = options.orderId;
				this.loadOrderDetail();
			} else {
				uni.showToast({
					title: '参数错误',
					icon: 'none'
				});
				setTimeout(() => uni.navigateBack(), 1500);
			}
		},
		onUnload() {
			this.clearCountdown();
		},
		methods: {
			getImageUrl(url) {
				if (!url) return '';
				if (url.startsWith('http') || url.startsWith('data:')) return url;
				return uni.$imgUrl(url);
			},
			goBack() {
				uni.navigateBack();
			},
			async loadOrderDetail() {
				this.loading = true;
				try {
					const res = await request({
						url: `/api/orders/${this.orderId}`,
						method: 'GET'
					});
					if (res.data.code === 0) {
						this.order = res.data.data;
						// 如果是待付款订单且有过期时间，启动倒计时
						if (this.order.order_status === 0 && this.order.expire_time) {
							this.startCountdown();
						}

						if (this.order.address_type === 'pickup' && this.order.pond_id && this.order.seat_id) {
							await this.loadPondAndSeatNames();
						}
					} else {
						uni.showToast({
							title: res.data.message || '获取订单详情失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('加载订单详情失败', error);
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					});
				} finally {
					this.loading = false;
				}
			},
			// 启动倒计时（仅用于详情页）
			startCountdown() {
				if (this.countdownInterval) return;
				const expireTime = new Date(this.order.expire_time).getTime();
				const update = () => {
					const diff = expireTime - Date.now();
					if (diff <= 0) {
						this.cancelOrderAfterExpire();
						return;
					}
					const seconds = Math.floor(diff / 1000);
					const days = Math.floor(seconds / 86400);
					const hours = Math.floor((seconds % 86400) / 3600);
					const minutes = Math.floor((seconds % 3600) / 60);
					const secs = seconds % 60;
					let text = '';
					if (days > 0) text += `${days}天`;
					text +=
						`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
					this.countdownText = text;
				};
				update();
				this.countdownInterval = setInterval(update, 1000);
			},

			// 清除倒计时
			clearCountdown() {
				if (this.countdownInterval) {
					clearInterval(this.countdownInterval);
					this.countdownInterval = null;
				}
			},

			// 倒计时结束自动取消订单
			async cancelOrderAfterExpire() {
				this.clearCountdown();
				uni.showLoading({
					title: '订单已超时，取消中...'
				});
				try {
					const res = await request({
						url: `/api/orders/${this.order.id}/cancel`,
						method: 'POST',
						data: {}
					});
					if (res.data.code === 0) {
						uni.showToast({
							title: '订单已取消',
							icon: 'success'
						});
						setTimeout(() => uni.navigateBack(), 1500);
					} else {
						uni.showToast({
							title: res.data.message || '取消失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('自动取消失败', error);
					uni.showToast({
						title: '网络错误',
						icon: 'none'
					});
				} finally {
					uni.hideLoading();
				}
			},
			async loadPondAndSeatNames() {
				try {
					// 获取鱼塘列表（公开接口，可使用 uni.request 或 request 均可，此处为统一使用 request）
					const pondRes = await request({
						url: '/api/pond/list',
						method: 'GET'
					});
					if (pondRes.data.code === 0) {
						const pond = pondRes.data.data.find(p => p.id === this.order.pond_id);
						if (pond) this.pondName = pond.name;
					}
					if (this.order.seat_id && this.order.pond_id) {
						const seatRes = await request({
							url: `/api/pond/seat?id=${this.order.pond_id}`,
							method: 'GET'
						});
						if (seatRes.data.code === 0) {
							const seat = seatRes.data.data.seats.find(s => s.seat_id === this.order.seat_id);
							if (seat) this.seatName = seat.name;
						}
					}
				} catch (e) {
					console.error('加载自提点信息失败', e);
				}
			},
			async payOrder() {
				uni.showLoading({
					title: '支付中...'
				});
				try {
					const res = await request({
						url: `/api/orders/${this.order.id}/pay`,
						method: 'POST',
						data: {}
					});
					if (res.data.code === 0) {
						uni.showToast({
							title: '支付成功',
							icon: 'success'
						});
						setTimeout(() => uni.navigateBack(), 1500);
					} else {
						uni.showToast({
							title: res.data.message || '支付失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('支付失败', error);
					uni.showToast({
						title: '支付失败',
						icon: 'none'
					});
				} finally {
					uni.hideLoading();
				}
			},
			async cancelOrder() {
				uni.showModal({
					title: '提示',
					content: '确定取消该订单吗？',
					success: async (modalRes) => {
						if (modalRes.confirm) {
							try {
								const res = await request({
									url: `/api/orders/${this.order.id}/cancel`,
									method: 'POST',
									data: {}
								});
								if (res.data.code === 0) {
									uni.showToast({
										title: '订单已取消',
										icon: 'success'
									});
									setTimeout(() => uni.navigateBack(), 1500);
								} else {
									uni.showToast({
										title: res.data.message || '取消失败',
										icon: 'none'
									});
								}
							} catch (error) {
								console.error('取消失败', error);
								uni.showToast({
									title: '取消失败',
									icon: 'none'
								});
							}
						}
					}
				});
			}
		}
	}
</script>

<style lang="scss" scoped>
	.detail-container {
		background-color: #ffffff;
		min-height: 100vh;
		width: 100%;
		overflow-x: hidden;
		box-sizing: border-box;
	}

	/* 服务地址样式 */
	.service-address {
		background-color: #fafafa;
		border-radius: 20rpx;
		padding: 24rpx;

		.info-line {
			font-size: 28rpx;
			color: #333;
			line-height: 1.5;
		}
	}


	.service-detail-info {
		margin-top: 12rpx;
		margin-bottom: 12rpx;

		.service-line {
			display: block;
			font-size: 24rpx;
			color: #666;
			line-height: 1.5;
			margin-bottom: 6rpx;
		}
	}

	.custom-navbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 999;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 30rpx;
		height: 88rpx;
		background-color: #5d7291;

		.navbar-left {
			width: 60rpx;
			height: 100%;
			display: flex;
			align-items: center;
		}

		.navbar-title {
			font-size: 34rpx;
			font-weight: 600;
			color: #fff;
		}

		.navbar-right {
			width: 60rpx;
		}
	}

	.scroll-content {
		margin-top: 88rpx;
		padding: 20rpx 30rpx 120rpx;
		width: 100%;
		overflow-x: hidden;
		box-sizing: border-box;
	}

	.status-section,
	.info-section,
	.goods-section,
	.order-section {
		margin-bottom: 40rpx;
		border-bottom: 1rpx solid #f0f0f0;
		padding-bottom: 30rpx;
		width: 100%;
		box-sizing: border-box;
	}

	.section-title {
		display: flex;
		align-items: center;
		gap: 12rpx;
		font-size: 32rpx;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 24rpx;
	}

	.status-section {
		display: flex;
		align-items: center;
		gap: 24rpx;
		background: linear-gradient(135deg, #f8f8f8, #fff);
		border-radius: 24rpx;
		padding: 30rpx;
		margin-top: 0;

		.status-text {
			flex: 1;

			.main-status {
				font-size: 34rpx;
				font-weight: bold;
				display: block;
				margin-bottom: 8rpx;
			}

			.sub-status {
				font-size: 26rpx;
				color: #999;
				word-break: break-word;
			}
		}
	}

	.delivery-info,
	.pickup-info {
		background-color: #fafafa;
		border-radius: 20rpx;
		padding: 24rpx;
		width: 100%;
		box-sizing: border-box;

		.info-line {
			display: block;
			font-size: 28rpx;
			color: #333;
			margin-bottom: 12rpx;
			line-height: 1.5;
			word-break: break-word;

			&:last-child {
				margin-bottom: 0;
			}
		}
	}

	/* 订单清单卡片 */
	.goods-section {
		.goods-item {
			display: flex;
			background: #fff;
			border-radius: 20rpx;
			box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
			padding: 24rpx;
			margin-bottom: 24rpx;
			transition: all 0.2s;

			&:active {
				transform: scale(0.99);
			}

			.goods-img {
				width: 140rpx;
				height: 140rpx;
				border-radius: 16rpx;
				background-color: #f5f5f5;
				flex-shrink: 0;
				margin-right: 20rpx;
			}

			.goods-info {
				flex: 1;
				display: flex;
				flex-direction: column;
				justify-content: space-between;
				margin-left: 10rpx;

				.goods-name {
					font-size: 30rpx;
					font-weight: 600;
					color: #1a1a1a;
					margin-bottom: 8rpx;
					line-height: 1.4;
				}

				.goods-spec {
					font-size: 24rpx;
					color: #999;
					margin-bottom: 12rpx;
				}

				.service-detail-info {
					margin: 8rpx 0;

					.service-line {
						font-size: 24rpx;
						color: #666;
						line-height: 1.5;
						margin-bottom: 4rpx;
					}
				}

				.goods-price-row {
					display: flex;
					align-items: baseline;
					justify-content: space-between;
					flex-wrap: wrap;
					margin-top: 12rpx;

					.price {
						font-size: 32rpx;
						font-weight: bold;
						color: #f38b11;
					}

					.quantity {
						font-size: 26rpx;
						color: #666;
						margin-left: 16rpx;
					}

					.subtotal {
						font-size: 26rpx;
						color: #f38b11;
						font-weight: 500;
						margin-left: auto;
					}
				}
			}
		}
	}

	.order-row {
		display: flex;
		justify-content: space-between;
		font-size: 28rpx;
		color: #666;
		margin-bottom: 20rpx;
		flex-wrap: wrap;

		&.total {
			margin-top: 16rpx;
			padding-top: 16rpx;
			border-top: 1rpx solid #eee;
			font-weight: 600;

			.price {
				color: #f38b11;
				font-size: 32rpx;
			}
		}

		.label {
			color: #999;
		}

		.value {
			color: #333;
			text-align: right;
			word-break: break-word;
			max-width: 60%;
		}
	}

	.bottom-actions {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: #fff;
		padding: 20rpx 30rpx;
		display: flex;
		gap: 20rpx;
		box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.04);

		.action-btn {
			flex: 1;
			height: 80rpx;
			line-height: 80rpx;
			border-radius: 60rpx;
			font-size: 30rpx;
			font-weight: 500;
			border: none;
			margin: 0;
		}

		.pay-btn {
			background: #f38b11;
			color: #fff;
		}

		.cancel-btn {
			background: #f5f5f5;
			color: #666;
		}
	}

	.loading {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
	}
	
	/* 倒计时样式 */
	.expire-timer {
	  background: #fff3e8;
	  color: #f38b11;
	  font-size: 26rpx;
	  padding: 12rpx 20rpx;
	  border-radius: 30rpx;
	  display: inline-block;
	  margin: 10rpx 0;
	  font-weight: 500;
	}
</style>