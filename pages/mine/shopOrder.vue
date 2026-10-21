<template>
	<view class="wrap">
		<u-navbar title="我的订单" :bgColor="'#5d7291'" :title-color="'#fff'" :back-text="'返回'"></u-navbar>

		<view class="tabs">
			<view v-for="tab in tabs" :key="tab.value" class="tab-item" :class="{ active: currentTab === tab.value }"
				@click="switchTab(tab.value)">
				{{ tab.label }}
			</view>
		</view>

		<!-- 评价统计卡片（合并商品+服务评价统计） -->
		<view v-if="currentTab === 'comment'" class="review-stats-card">
			<view class="stats-header">
				<text class="total">累计评价 {{ reviewStats.total }} 条</text>
				<text class="avg">综合评分 {{ reviewStats.avg_rating }} 分</text>
			</view>
			<view class="star-distribution" v-if="reviewStats.total > 0">
				<view v-for="star in [5,4,3,2,1]" :key="star" class="star-row">
					<text class="star-label">{{ star }}星</text>
					<view class="progress-bar">
						<view class="progress"
							:style="{ width: (reviewStats.star_counts[star] / reviewStats.total * 100) + '%' }"></view>
					</view>
					<text class="count">{{ reviewStats.star_counts[star] }}</text>
				</view>
			</view>
		</view>

		<!-- 评价列表（支持商品和服务混合展示） -->
		<view v-if="currentTab === 'comment'" class="review-list">
			<!-- 列表容器，绑定滚动到底部事件和下拉刷新事件（需在 scroll-view 上绑定） -->
			<scroll-view scroll-y class="review-scroll" @scrolltolower="loadMoreReviews"
				@refresherrefresh="onRefreshReviews" refresher-enabled="true" :refresher-triggered="refreshing">
				<view v-for="review in reviewList" :key="review.id" class="review-item">
					<view class="review-header">
						<!-- 根据 item_type 显示不同图标/图片 -->
						<u-image
							:src="getImageUrl(review.item_type === 'product' ? review.product_image : review.service_image)"
							width="100rpx" height="100rpx" border-radius="12rpx" />
						<view class="product-info">
							<text
								class="name">{{ review.item_type === 'product' ? review.product_name : review.service_name }}</text>
							<text class="order-num">订单号：{{ review.order_number }}</text>
							<!-- 服务评价额外显示预约信息 -->
							<text v-if="review.item_type === 'service' && review.service_date" class="service-booking">
								预约：{{ review.service_date }} {{ review.service_time_slot || '' }}
								人数：{{ review.participant_count }}
							</text>
						</view>
					</view>
					<view class="review-content">
						<u-rate v-model="review.rating" disabled :size="28" />
						<text class="text">{{ review.content }}</text>
						<view class="images" v-if="review.images && review.images.length">
							<image v-for="(img, idx) in review.images" :key="idx" :src="getImageUrl(img)"
								mode="aspectFill" />
						</view>
						<text class="time">{{ review.created_at }}</text>
					</view>
				</view>
				<u-loadmore :status="reviewLoadStatus" />
				<u-empty v-if="reviewList.length === 0 && !reviewLoading" mode="comment" text="暂无评价" />
			</scroll-view>
		</view>

		<view v-if="currentTab !== 'comment'" class="order-list">
			<view v-for="order in orderList" :key="order.id" class="order-item">
				<!-- 订单头部 -->
				<view class="order-header" @click="viewDetail(order)">
					<text class="order-number">订单号：{{ order.order_number }}</text>
					<text class="order-status">{{ getStatusText(order) }}</text>
				</view>

				<!-- 倒计时显示 -->
				<view class="expire-timer" v-if="order.order_status === 0 && order.countdownText">
					剩余支付时间：{{ order.countdownText }}
				</view>

				<!-- 订单商品列表 -->
				<view class="order-content">
					<view v-for="(item, idx) in order.items" :key="idx" class="product-item">
						<u-image :src="getImageUrl(item.product_image) || '/static/images/default-service.png'"
							width="120" height="120" border-radius="8"></u-image>
						<view class="product-info">
							<view class="product-name">
								{{ item.product_name }}
								<text v-if="item.item_type === 'service'" class="type"
									:class="{'type-regular': item.service_type === 'regular', 'type-competition': item.service_type === 'competition'}">
									{{ item.service_type === 'regular' ? '服务' : (item.service_type === 'competition' ? '比赛' : '服务') }}
								</text>
							</view>
							<view class="product-spec" v-if="item.product_attributes && item.product_attributes.length">
								规格：{{ item.product_attributes.join(' + ') }}
							</view>
							<view class="product-price">¥{{ item.unit_price }} x {{ item.quantity }}</view>
						</view>
						<!-- 评价按钮：仅已完成订单显示 -->
						<button v-if="order.order_status === 2 && !item.reviewed && item.merchant_id !== currentUserId"
							class="comment-item-btn" @click.stop="goToComment(order, item)">评价</button>
						<button v-if="order.order_status === 2 && item.reviewed" class="comment-item-btn disabled"
							disabled>已评价</button>
					</view>
				</view>

				<!-- 服务订单额外信息 -->
				<view v-if="order.service_date" class="service-info">
					<view class="info-row">
						<image src="/static/icons/calendar.png" class="info-icon" mode="aspectFit"></image>
						<text>预约日期：{{ order.service_date }}</text>
					</view>
					<view class="info-row" v-if="order.service_time_slot">
						<image src="/static/icons/time.png" class="info-icon" mode="aspectFit"></image>
						<text>场次：{{ order.service_time_slot }}</text>
					</view>
					<view class="info-row">
						<image src="/static/icons/people.png" class="info-icon" mode="aspectFit"></image>
						<text>人数：{{ order.participant_count }}人</text>
					</view>
				</view>


				<!-- 订单底部 -->
				<view class="order-footer">
					<view class="order-total">合计：¥{{ order.total_amount }}</view>
					<view class="order-time">{{ order.created_at }}</view>
				</view>

				<!-- 操作按钮 -->
				<view class="order-actions">
					<!-- 待付款 -->
					<template v-if="order.order_status === 0">
						<button class="pay-btn" @click.stop="payOrder(order)">立即支付</button>
						<button class="cancel-btn" @click.stop="cancelOrder(order)">取消订单</button>
						<button class="detail-btn" @click.stop="viewDetail(order)">查看详情</button>
					</template>
					<!-- 待收货/待使用 -->
					<template v-else-if="order.order_status === 1">
						<!-- 商品订单或混合订单显示确认收货 -->
						<button v-if="order.item_type === 'product' || order.item_type === 'mixed'" class="confirm-btn"
							@click.stop="confirmOrder(order)">确认收货</button>
						<!-- 纯服务订单显示确认使用 -->
						<button v-if="order.item_type === 'service'" class="confirm-btn"
							@click.stop="confirmUse(order)">确认使用</button>
						<button class="rebuy-btn" @click.stop="rebuyOrder(order)">再次购买</button>
						<button class="detail-btn" @click.stop="viewDetail(order)">查看详情</button>
					</template>
					<!-- 已完成 -->
					<template v-else-if="order.order_status === 2">
						<button class="rebuy-btn" @click.stop="rebuyOrder(order)">再次购买</button>
						<button class="detail-btn" @click.stop="viewDetail(order)">查看详情</button>
					</template>
					<!-- 已取消 -->
					<template v-else-if="order.order_status === 3">
						<button class="delete-btn" @click.stop="deleteOrder(order)">删除订单</button>
						<button class="rebuy-btn" @click.stop="rebuyOrder(order)">再次购买</button>
						<button class="detail-btn" @click.stop="viewDetail(order)">查看详情</button>
					</template>
				</view>
			</view>

			<u-empty v-if="orderList.length === 0" mode="order" text="暂无订单" />
		</view>
	</view>
</template>

<script>
	import request from '@/common/request.js'; // 引入统一请求封装

	export default {
		data() {
			return {
				tabs: [{
						label: '全部',
						value: null
					},
					{
						label: '待付款',
						value: 0
					},
					{
						label: '待收货',
						value: 1
					},
					{
						label: '已完成',
						value: 2
					},
					{
						label: '已取消',
						value: 3
					},
					{
						label: '评价',
						value: 'comment'
					}
				],
				currentTab: null,
				orderList: [],
				reviewList: [],
				reviewStats: {
					total: 0,
					avg_rating: 0,
					star_counts: {
						1: 0,
						2: 0,
						3: 0,
						4: 0,
						5: 0
					}
				},
				// 分页相关（商品评价和服务评价独立分页）
				productReviewList: [],
				serviceReviewList: [],
				productReviewPage: 1,
				serviceReviewPage: 1,
				productTotal: 0,
				serviceTotal: 0,
				reviewLoading: false,
				hasMoreReviews: true,
				currentUserId: null,
				refreshing: false,
				reviewLoadStatus: 'loadmore',
				countdownIntervals: {}, // 存储每个订单的定时器，key 为订单 id
			}
		},
		onShow() {
			this.currentUserId = this.getCurrentUserId();
			if (this.currentTab === 'comment') {
				this.loadReviewStats();
				this.loadReviews();
			} else {
				this.loadOrders();
			}
		},
		onUnload() {
			Object.values(this.countdownIntervals).forEach(interval => clearInterval(interval));
		},
		methods: {
			getImageUrl(url) {
				if (!url) return '';
				if (url.startsWith('http') || url.startsWith('data:')) return url;
				return uni.$imgUrl(url);
			},

			// 获取当前登录用户ID（仅用于显示或判断，不再作为请求参数）
			getCurrentUserId() {
				let userInfo = this.$store.state.vuex_user_info || uni.getStorageSync('vuex_user_info');
				return userInfo?.id || null;
			},

			// 订单相关
			async loadOrders() {
				if (!this.currentUserId) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					return;
				}
				try {
					let url = '/api/orders';
					if (this.currentTab !== null && this.currentTab !== 'comment') {
						url += `?status=${this.currentTab}`;
					}
					const res = await request({
						url,
						method: 'GET'
					});
					if (res.data.code === 0) {
						this.orderList = res.data.data;
						// 清除所有旧定时器
						Object.values(this.countdownIntervals).forEach(interval => clearInterval(interval));
						this.countdownIntervals = {};
						// 为待付款订单启动倒计时
						this.orderList.forEach(order => {
							// 确保状态是数字类型
							const status = Number(order.order_status);
							if (status === 0 && order.expire_time) {
								this.startCountdown(order);
							}
						});
					} else {
						uni.showToast({
							title: res.data.message || '获取订单失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('获取订单失败', error);
					uni.showToast({
						title: '获取订单失败',
						icon: 'none'
					});
				}
			},
			// 启动单个订单的倒计时
			startCountdown(order) {
				console.log('startCountdown', order.id, order.expire_time, new Date(order.expire_time).getTime());

				if (this.countdownIntervals[order.id]) return;
				const expireTime = new Date(order.expire_time).getTime();
				const updateTimer = () => {
					const now = Date.now();
					let diff = expireTime - now;
					if (diff <= 0) {
						// 倒计时结束，自动取消订单
						this.cancelOrderAfterExpire(order);
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
					this.$set(order, 'countdownText', text);
				};
				updateTimer();
				const interval = setInterval(updateTimer, 1000);
				this.$set(this.countdownIntervals, order.id, interval);
			},

			// 清除指定订单的倒计时
			clearCountdown(orderId) {
				if (this.countdownIntervals[orderId]) {
					clearInterval(this.countdownIntervals[orderId]);
					delete this.countdownIntervals[orderId];
				}
			},

			// 倒计时结束自动取消订单
			async cancelOrderAfterExpire(order) {
				this.clearCountdown(order.id);
				uni.showLoading({
					title: '订单已超时，取消中...'
				});
				try {
					const res = await request({
						url: `/api/orders/${order.id}/cancel`,
						method: 'POST',
						data: {}
					});
					if (res.data.code === 0) {
						uni.showToast({
							title: '订单已取消',
							icon: 'success'
						});
						this.loadOrders(); // 刷新订单列表
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

			async payOrder(order) {
				uni.showLoading({
					title: '支付中...'
				});
				try {
					const res = await request({
						url: `/api/orders/${order.id}/pay`,
						method: 'POST',
						data: {} // 后端从 token 获取 user_id
					});
					if (res.data.code === 0) {
						uni.showToast({
							title: '支付成功',
							icon: 'success'
						});
						this.loadOrders(); // 刷新订单列表
					} else {
						uni.showToast({
							title: res.data.message || '支付失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('支付失败', error);
					uni.showToast({
						title: '支付失败，请重试',
						icon: 'none'
					});
				} finally {
					uni.hideLoading();
				}
			},

			async confirmOrder(order) {
				try {
					const res = await request({
						url: `/api/orders/${order.id}/confirm`,
						method: 'POST',
						data: {}
					});
					if (res.data.code === 0) {
						uni.showToast({
							title: '确认收货成功',
							icon: 'success'
						});
						this.loadOrders();
					} else {
						uni.showToast({
							title: res.data.message || '确认收货失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('确认收货失败', error);
					uni.showToast({
						title: '网络错误',
						icon: 'none'
					});
				}
			},

			async cancelOrder(order) {
				uni.showModal({
					title: '提示',
					content: '确定取消该订单吗？',
					success: async (modalRes) => {
						if (modalRes.confirm) {
							try {
								const res = await request({
									url: `/api/orders/${order.id}/cancel`,
									method: 'POST',
									data: {}
								});
								if (res.data.code === 0) {
									this.clearCountdown(order.id); // 清除计时器
									uni.showToast({
										title: '订单已取消',
										icon: 'success'
									});
									this.loadOrders(); // 刷新列表
								} else {
									uni.showToast({
										title: res.data.message || '取消失败',
										icon: 'none'
									});
								}
							} catch (error) {
								console.error('取消失败', error);
								uni.showToast({
									title: '网络错误',
									icon: 'none'
								});
							}
						}
					}
				});
			},

			async deleteOrder(order) {
				uni.showModal({
					title: '提示',
					content: '确定删除该订单吗？删除后不可恢复。',
					success: async (modalRes) => {
						if (modalRes.confirm) {
							try {
								const res = await request({
									url: `/api/orders/${order.id}/delete`,
									method: 'DELETE',
									data: {}
								});
								if (res.data.code === 0) {
									uni.showToast({
										title: '删除成功',
										icon: 'success'
									});
									this.orderList = this.orderList.filter(o => o.id !== order.id);
								} else {
									uni.showToast({
										title: res.data.message || '删除失败',
										icon: 'none'
									});
								}
							} catch (error) {
								console.error('删除订单失败', error);
								uni.showToast({
									title: '删除失败',
									icon: 'none'
								});
							}
						}
					}
				});
			},

			async confirmUse(order) {
				try {
					const res = await request({
						url: `/api/orders/${order.id}/confirm_use`,
						method: 'POST',
						data: {}
					});
					if (res.data.code === 0) {
						uni.showToast({
							title: '确认使用成功',
							icon: 'success'
						});
						this.loadOrders();
					} else {
						uni.showToast({
							title: res.data.message || '确认使用失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('确认使用失败', error);
					uni.showToast({
						title: '网络错误',
						icon: 'none'
					});
				}
			},

			// ========== 评价相关 ==========
			async loadReviews(reset = false) {
				if (this.reviewLoading) return;
				if (reset) {
					this.productReviewPage = 1;
					this.serviceReviewPage = 1;
					this.productReviewList = [];
					this.serviceReviewList = [];
					this.productTotal = 0;
					this.serviceTotal = 0;
					this.reviewList = [];
					this.hasMoreReviews = true;
				}
				this.reviewLoading = true;

				// 并行请求商品和服务评价
				const productPromise = (this.productTotal === 0 || this.productReviewList.length < this.productTotal) ?
					request({
						url: `/api/user/reviews?page=${this.productReviewPage}&page_size=10`,
						method: 'GET'
					}) :
					null;
				const servicePromise = (this.serviceTotal === 0 || this.serviceReviewList.length < this.serviceTotal) ?
					request({
						url: `/api/user/service_reviews?page=${this.serviceReviewPage}&page_size=10`,
						method: 'GET'
					}) :
					null;

				const [productRes, serviceRes] = await Promise.all([productPromise, servicePromise].filter(p => p));

				if (productRes && productRes.data.code === 0) {
					const newList = productRes.data.data.list.map(item => ({
						...item,
						item_type: 'product'
					}));
					if (reset) {
						this.productReviewList = newList;
					} else {
						this.productReviewList = [...this.productReviewList, ...newList];
					}
					this.productTotal = productRes.data.data.total;
					this.productReviewPage++;
				}
				if (serviceRes && serviceRes.data.code === 0) {
					const newList = serviceRes.data.data.list.map(item => ({
						...item,
						item_type: 'service'
					}));
					if (reset) {
						this.serviceReviewList = newList;
					} else {
						this.serviceReviewList = [...this.serviceReviewList, ...newList];
					}
					this.serviceTotal = serviceRes.data.data.total;
					this.serviceReviewPage++;
				}

				// 合并并按时间排序
				let merged = [...this.productReviewList, ...this.serviceReviewList];
				merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
				this.reviewList = merged;
				this.hasMoreReviews = (this.productReviewList.length < this.productTotal) || (this.serviceReviewList
					.length < this.serviceTotal);
				this.reviewLoading = false;
				this.reviewLoadStatus = this.hasMoreReviews ? 'loadmore' : 'nomore';
				this.refreshing = false;
			},

			async loadReviewStats() {
				try {
					const productStatsRes = await request({
						url: '/api/user/reviews/stats',
						method: 'GET'
					});
					const serviceStatsRes = await request({
						url: '/api/user/service_reviews/stats',
						method: 'GET'
					});
					const productStats = productStatsRes.data.data;
					const serviceStats = serviceStatsRes.data.data;
					const total = productStats.total + serviceStats.total;
					let avg_rating = 0;
					if (total > 0) {
						const productWeighted = productStats.avg_rating * productStats.total;
						const serviceWeighted = serviceStats.avg_rating * serviceStats.total;
						avg_rating = (productWeighted + serviceWeighted) / total;
						avg_rating = Math.round(avg_rating * 10) / 10;
					}
					const star_counts = {
						1: 0,
						2: 0,
						3: 0,
						4: 0,
						5: 0
					};
					for (let i = 1; i <= 5; i++) {
						star_counts[i] = (productStats.star_counts?.[i] || 0) + (serviceStats.star_counts?.[i] || 0);
					}
					this.reviewStats = {
						total,
						avg_rating,
						star_counts
					};
				} catch (error) {
					console.error('加载评价统计失败', error);
				}
			},

			// ========== 辅助方法 ==========
			getStatusText(order) {
				if (order.item_type === 'service') {
					const map = {
						0: '待付款',
						1: '待使用',
						2: '已完成',
						3: '已取消'
					};
					return map[order.order_status] || '未知';
				} else {
					const map = {
						0: '待付款',
						1: '待收货',
						2: '已完成',
						3: '已取消'
					};
					return map[order.order_status] || '未知';
				}
			},

			switchTab(status) {
				this.currentTab = status;
				if (status === 'comment') {
					this.orderList = [];
					this.productReviewPage = 1;
					this.serviceReviewPage = 1;
					this.productReviewList = [];
					this.serviceReviewList = [];
					this.reviewList = [];
					this.loadReviewStats();
					this.loadReviews(true);
				} else {
					this.reviewList = [];
					this.loadOrders();
				}
			},

			rebuyOrder(order) {
				if (!order.items || order.items.length === 0) {
					uni.showToast({
						title: '无商品/服务可购买',
						icon: 'none'
					});
					return;
				}
				const firstItem = order.items[0];
				if (order.item_type === 'service') {
					if (firstItem.service_id) {
						uni.navigateTo({
							url: `/pages/shop/pond-detail?id=${firstItem.service_id}`
						});
					} else {
						uni.showToast({
							title: '服务不存在',
							icon: 'none'
						});
					}
				} else {
					if (firstItem.product_id) {
						uni.navigateTo({
							url: `/pages/shop/detail?id=${firstItem.product_id}`
						});
					} else {
						uni.showToast({
							title: '商品不存在',
							icon: 'none'
						});
					}
				}
			},

			viewDetail(order) {
				uni.navigateTo({
					url: `/pages/shop/orderDetail?orderId=${order.id}`
				});
			},
			loadMoreReviews() {
				if (this.hasMoreReviews && !this.reviewLoading) {
					this.loadReviews();
				}
			},
			onRefreshReviews() {
				this.refreshing = true;
				this.loadReviews(true);
			},
			goToComment(order, item) {
				if (!item.id) {
					uni.showToast({
						title: '参数错误，无法评价',
						icon: 'none'
					});
					return;
				}
				if (item.item_type === 'service') {
					uni.navigateTo({
						url: `/pages/mine/serviceComment?orderId=${order.id}&orderItemId=${item.id}&serviceId=${item.service_id}`
					});
				} else {
					uni.navigateTo({
						url: `/pages/mine/comment?orderId=${order.id}&orderItemId=${item.id}&productId=${item.product_id}`
					});
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	/* 样式保持不变，仅按钮宽度统一 */
	.wrap {
		background-color: #f5f5f5;
		min-height: 100vh;
		// padding: 0 20rpx 20rpx 20rpx;
	}

	.tabs {
		background: #fff;
		display: flex;
		padding: 0;
		margin-bottom: 20rpx;
		position: sticky;
		top: 0;
		z-index: 10;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.02);

		.tab-item {
			flex: 1;
			text-align: center;
			font-size: 28rpx;
			color: #666;
			padding: 24rpx 0;
			position: relative;
			transition: all 0.2s ease;

			&.active {
				color: #5d7291;
				font-weight: 600;

				// 添加渐变下划线，更现代
				&::after {
					content: '';
					position: absolute;
					bottom: 8rpx;
					left: 50%;
					transform: translateX(-50%);
					width: 48rpx;
					height: 6rpx;
					background: linear-gradient(90deg, #5d7291, #8bb3d1);
					border-radius: 6rpx;
				}
			}

			// 点击反馈（轻微背景变灰）
			&:active {
				background-color: rgba(93, 114, 145, 0.08);
			}
		}
	}

	.service-info {
		border-radius: 60rpx;
		padding: 16rpx;
		font-size: 26rpx;
		font-weight: 500;
		color: #666;
		display: flex;
		flex-direction: column;
		flex-wrap: wrap;
		gap: 20rpx;
	}

	.order-list .order-item {
		background: #fff;
		border-radius: 24rpx;
		margin: 20rpx 10rpx 40rpx 10rpx;
		padding: 30rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
	}

	.order-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 20rpx;
		border-bottom: 1rpx solid #f0f0f0;

		.order-number {
			font-size: 28rpx;
			color: #666;
		}

		.order-status {
			font-size: 28rpx;
			font-weight: 500;
			color: #f38b11;
		}
	}

	.order-content {
		padding: 20rpx 0;

		.product-item {
			display: flex;
			margin-bottom: 20rpx;

			&:last-child {
				margin-bottom: 0;
			}

			.product-info {
				flex: 1;
				margin-left: 20rpx;

				.product-name {
					font-size: 30rpx;
					font-weight: 500;
					color: #333;
					margin-bottom: 8rpx;
				}

				.product-spec {
					font-size: 24rpx;
					color: #999;
					margin-bottom: 8rpx;
				}

				.product-price {
					font-size: 28rpx;
					color: #f38b11;
					font-weight: bold;
				}
			}
		}
	}

	.order-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 20rpx;
		border-top: 1rpx solid #f0f0f0;

		.order-total {
			font-size: 32rpx;
			color: #f38b11;
			font-weight: bold;
		}

		.order-time {
			font-size: 24rpx;
			color: #999;
		}
	}

	.order-actions {
		display: flex;
		justify-content: flex-end;
		gap: 20rpx;
		margin-top: 20rpx;

		button {
			min-width: 160rpx; // 固定最小宽度
			padding: 12rpx 0;
			text-align: center;
			border-radius: 60rpx;
			font-size: 26rpx;
			border: none;
			margin: 0;
			white-space: nowrap;
		}

		.pay-btn {
			background: #f38b11;
			color: #fff;
		}

		.confirm-btn {
			background: #5d7291;
			color: #fff;
		}

		.comment-btn {
			background: #52c41a;
			color: #fff;
		}

		.cancel-btn {
			background: #f5f5f5;
			color: #666;
		}

		.rebuy-btn {
			background: #5d7291;
			color: #fff;
		}

		.detail-btn {
			background: #e8e8e8;
			color: #333;
		}

		.delete-btn {
			background: #f5f5f5;
			color: #e74c3c;
			border: 1rpx solid #e74c3c;
		}
	}

	.review-stats-card {
		background: #fff;
		// border-radius: 24rpx;
		// margin: 20rpx;
		padding: 30rpx;

		.stats-header {
			display: flex;
			justify-content: space-between;
			margin-bottom: 30rpx;

			.total {
				font-size: 32rpx;
				font-weight: bold;
			}

			.avg {
				font-size: 28rpx;
				color: #f38b11;
			}
		}

		.star-distribution {
			.star-row {
				display: flex;
				align-items: center;
				margin-bottom: 20rpx;

				.star-label {
					width: 60rpx;
					font-size: 26rpx;
				}

				.progress-bar {
					flex: 1;
					height: 16rpx;
					background: #eee;
					border-radius: 8rpx;
					margin: 0 20rpx;
					overflow: hidden;

					.progress {
						height: 100%;
						background: #f38b11;
						border-radius: 8rpx;
					}
				}

				.count {
					width: 60rpx;
					text-align: right;
					font-size: 26rpx;
					color: #666;
				}
			}
		}
	}

	.review-list {
		// padding: 0 20rpx;

		.review-item {
			background: #fff;
			// border-radius: 24rpx;
			padding: 30rpx;
			margin: 20rpx 0;

			.review-header {
				display: flex;
				margin-bottom: 20rpx;

				.product-info {
					flex: 1;
					margin-left: 20rpx;

					.name {
						font-size: 30rpx;
						font-weight: 500;
						display: block;
						margin-bottom: 8rpx;
					}

					.order-num {
						font-size: 24rpx;
						color: #999;
					}
				}
			}

			.review-content {
				.text {
					font-size: 28rpx;
					color: #333;
					margin: 16rpx 0;
					display: block;
				}

				.images {
					display: flex;
					flex-wrap: wrap;
					gap: 16rpx;
					margin: 16rpx 0;

					image {
						width: 160rpx;
						height: 160rpx;
						border-radius: 12rpx;
					}
				}

				.time {
					font-size: 24rpx;
					color: #999;
					display: block;
					margin-top: 16rpx;
				}
			}
		}
	}

	.comment-item-btn {
		min-width: 160rpx;
		height: 80rpx;
		padding: 8rpx 20rpx;
		background: #52c41a;
		color: #fff;
		border-radius: 60rpx;
		font-size: 26rpx;
		margin-left: 20rpx;
		border: none;
	}

	.comment-item-btn.disabled {
		background: #ccc;
		color: #fff;
		opacity: 0.6;
	}

	.service-tag {
		background: #5d7291;
		color: #fff;
		font-size: 20rpx;
		padding: 4rpx 12rpx;
		border-radius: 30rpx;
		margin-left: 12rpx;
		display: inline-block;
		vertical-align: middle;
	}

	.service-info {
		.info-row {
			display: flex;
			align-items: center;
			margin-bottom: 12rpx;

			.info-icon {
				width: 32rpx;
				height: 32rpx;
				margin-right: 12rpx;
			}
		}
	}

	/* 服务类型标签（开钓/比赛） */
	.type {
		font-size: 24rpx;
		padding: 4rpx 16rpx;
		border-radius: 30rpx;
		display: inline-block;
		margin-left: 12rpx;
		vertical-align: middle;
	}

	.type-regular {
		background-color: #5d7291;
		color: #fff;
	}

	.type-competition {
		background-color: #f38b11;
		color: #fff;
	}

	/* 评价列表滚动容器高度 */
	.review-scroll {
		height: calc(100vh - 88rpx - 100rpx);
	}

	/* 服务评价预约信息小字 */
	.service-booking {
		display: block;
		font-size: 24rpx;
		color: #999;
		margin-top: 8rpx;
	}

	/* 倒计时样式 */
	.expire-timer {
		background: #fff3e8;
		color: #f38b11;
		font-size: 26rpx;
		// text-align: right;
		padding: 12rpx 20rpx;
		border-radius: 30rpx;
		display: inline-block;
		margin: 10rpx 0;
		font-weight: 500;
	}
</style>