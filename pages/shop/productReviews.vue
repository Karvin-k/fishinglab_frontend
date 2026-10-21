<template>
	<view class="reviews-page">
		<!-- 导航栏（固定顶部） -->
		<u-navbar :title="productName + ' 评价'" :bgColor="'#5d7291'" :title-color="'#fff'" :back-text="'返回'"></u-navbar>

		<!-- 可滚动的内容区：将统计、筛选、列表全部包裹在内，实现整体滚动 -->
		<scroll-view scroll-y class="scroll-container" :refresher-enabled="true" :refresher-triggered="refreshing"
			@refresherrefresh="onRefresh" @scrolltolower="loadMore">

			<!-- 统计卡片（评价总数、平均分、星级分布） -->
			<view class="stats-card" v-if="stats.total > 0">
				<view class="score">
					<text class="avg">{{ stats.avg_rating }}</text>
					<text class="unit">分</text>
				</view>
				<view class="stars">
					<u-icon v-for="i in 5" :key="i" :name="i <= Math.round(stats.avg_rating) ? 'star-fill' : 'star'"
						size="32" color="#f38b11"></u-icon>
				</view>
				<text class="total">{{ stats.total }}条评价</text>

				<!-- 各星级数量及进度条（若后端返回 star_counts 字段） -->
				<view class="star-distribution" v-if="stats.star_counts">
					<view v-for="star in [5,4,3,2,1]" :key="star" class="star-row">
						<text class="star-label">{{ star }}星</text>
						<view class="progress-bar">
							<view class="progress"
								:style="{ width: (stats.star_counts[star] / stats.total * 100) + '%' }">
							</view>
						</view>
						<text class="count">{{ stats.star_counts[star] }}</text>
					</view>
				</view>
			</view>

			<!-- 排序筛选栏：最新 / 高分优先 / 低分优先 -->
			<view class="filter-bar">
				<view class="filter-item" :class="{ active: currentSort === 'latest' }" @click="switchSort('latest')">最新
				</view>
				<view class="filter-item" :class="{ active: currentSort === 'rating_high' }"
					@click="switchSort('rating_high')">高分优先</view>
				<view class="filter-item" :class="{ active: currentSort === 'rating_low' }"
					@click="switchSort('rating_low')">低分优先</view>
			</view>

			<!-- 星级筛选栏：全部 / 5/4星评价 / 3星及以下 -->
			<view class="rating-filter">
				<view class="rating-chip" :class="{ active: currentRating === 'all' }" @click="switchRating('all')">全部
				</view>
				<view class="rating-chip" :class="{ active: currentRating === 'high' }" @click="switchRating('high')">
					5/4星评价
				</view>
				<view class="rating-chip" :class="{ active: currentRating === 'below3' }"
					@click="switchRating('below3')">
					3星及以下</view>
			</view>

			<!-- 评价列表 -->
			<view class="review-list">
				<view v-for="review in reviewList" :key="review.id" class="review-card">
					<!-- 用户信息行 -->
					<view class="user-info">
						<u-image :src="getImageUrl(review.user_avatar)" width="70rpx" height="70rpx" shape="circle" />
						<view class="user-detail">
							<text class="name">{{ review.user_name }}</text>
							<text class="time">{{ review.created_at }}</text>
						</view>
						<!-- 评分星星 -->
						<view class="stars">
							<u-icon v-for="i in 5" :key="i" :name="i <= review.rating ? 'star-fill' : 'star'" size="28"
								:color="i <= review.rating ? '#f38b11' : '#ddd'"></u-icon>
						</view>
					</view>
					<!-- 评价文字内容 -->
					<view class="content">{{ review.content }}</view>
					<!-- 评价图片（若有） -->
					<view class="images" v-if="review.images && review.images.length">
						<image v-for="(img, idx) in review.images" :key="idx" :src="getImageUrl(img)" mode="aspectFill"
							@click="previewImage(review.images, idx)"></image>
					</view>
				</view>
			</view>

			<!-- 底部加载状态提示 -->
			<view v-if="loading && reviewList.length === 0" class="loading">加载中...</view>
			<view v-if="!loading && reviewList.length === 0" class="empty">暂无评价</view>
			<view v-if="!hasMore && reviewList.length > 0" class="no-more">没有更多了</view>
		</scroll-view>
	</view>
</template>

<script>
	import request from '@/common/request.js';

	export default {
		data() {
			return {
				productId: null, // 商品ID
				productName: '', // 商品名称（用于导航栏）
				reviewList: [], // 评价列表
				stats: { // 统计数据
					total: 0,
					avg_rating: 0,
					star_counts: null
				},
				currentSort: 'latest', // 排序方式：latest / rating_high / rating_low
				currentRating: 'all', // 星级筛选：all / high / below3
				page: 1,
				pageSize: 10,
				hasMore: true,
				loading: false,
				refreshing: false
			}
		},
		onLoad(options) {
			if (options.productId) {
				this.productId = options.productId;
				this.productName = decodeURIComponent(options.productName || '商品');
				this.loadReviews(true); // 重置并加载第一页
				this.loadStats(); // 加载统计数据
			} else {
				uni.showToast({
					title: '参数错误',
					icon: 'none'
				});
				setTimeout(() => uni.navigateBack(), 1500);
			}
		},
		methods: {
			getImageUrl(url) {
				if (!url) return '';
				if (url.startsWith('http') || url.startsWith('data:')) return url;
				return uni.$imgUrl(url);
			},
			// 加载评价统计（公开接口，无需 token）
			async loadStats() {
				try {
					const res = await request({
						url: `/api/products/${this.productId}/reviews/stats`,
						method: 'GET'
					});
					if (res.data.code === 0) this.stats = res.data.data;
				} catch (error) {
					console.error('加载统计失败', error);
				}
			},
			// 加载评价列表（公开接口，无需 token）
			async loadReviews(reset = false) {
				if (this.loading) return;
				if (reset) {
					this.page = 1;
					this.reviewList = [];
					this.hasMore = true;
				}
				this.loading = true;
				// 映射前端筛选参数到后端可识别的值
				let ratingParam = 'all';
				if (this.currentRating === 'high') ratingParam = 'high';
				else if (this.currentRating === 'below3') ratingParam = 'below3';
				try {
					const res = await request({
						url: `/api/products/${this.productId}/reviews?page=${this.page}&page_size=${this.pageSize}&sort=${this.currentSort}&rating=${ratingParam}`,
						method: 'GET'
					});
					if (res.data.code === 0) {
						const newList = res.data.data.list;
						if (reset) {
							this.reviewList = newList;
						} else {
							this.reviewList = [...this.reviewList, ...newList];
						}
						this.hasMore = this.reviewList.length < res.data.data.total;
					} else {
						uni.showToast({
							title: res.data.message || '加载失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('加载评价失败', error);
					uni.showToast({
						title: '网络错误',
						icon: 'none'
					});
				} finally {
					this.loading = false;
					this.refreshing = false;
				}
			},
			// 切换排序
			switchSort(sort) {
				if (this.currentSort === sort) return;
				this.currentSort = sort;
				this.loadReviews(true);
			},
			// 切换星级筛选
			switchRating(rating) {
				if (this.currentRating === rating) return;
				this.currentRating = rating;
				this.loadReviews(true);
			},
			// 下拉刷新
			onRefresh() {
				this.refreshing = true;
				this.loadReviews(true);
			},
			// 上拉加载更多
			loadMore() {
				if (this.hasMore && !this.loading) {
					this.page++;
					this.loadReviews();
				}
			},
			// 预览图片
			previewImage(images, idx) {
				const urls = images.map(img => this.getImageUrl(img));
				uni.previewImage({
					current: urls[idx],
					urls
				});
			}
		}
	}
</script>

<style lang="scss" scoped>
	.reviews-page {
		background-color: #f8f8f8;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	/* 可滚动容器：占满剩余高度，并允许滚动 */
	.scroll-container {
		flex: 1;
		/* 重要：让 scroll-view 自动填充除导航栏外的空间 */
	}

	/* 统计卡片样式 */
	.stats-card {
		background: #fff;
		padding: 30rpx;
		text-align: center;
		margin-bottom: 20rpx;

		.score {
			display: inline-flex;
			align-items: baseline;

			.avg {
				font-size: 64rpx;
				font-weight: bold;
				color: #f38b11;
			}

			.unit {
				font-size: 28rpx;
				color: #999;
				margin-left: 8rpx;
			}
		}

		.stars {
			margin: 16rpx 0;
		}

		.total {
			font-size: 26rpx;
			color: #666;
		}
	}

	/* 星级分布进度条 */
	.star-distribution {
		margin-top: 30rpx;

		.star-row {
			display: flex;
			align-items: center;
			margin-bottom: 16rpx;

			.star-label {
				width: 60rpx;
				font-size: 26rpx;
			}

			.progress-bar {
				flex: 1;
				height: 12rpx;
				background: #eee;
				border-radius: 6rpx;
				margin: 0 16rpx;
				overflow: hidden;

				.progress {
					height: 100%;
					background: #f38b11;
					border-radius: 6rpx;
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

	/* 排序筛选栏 */
	.filter-bar {
		display: flex;
		background: #fff;
		padding: 20rpx 30rpx;
		gap: 40rpx;
		border-bottom: 1rpx solid #eee;

		.filter-item {
			font-size: 28rpx;
			color: #666;
			position: relative;
			transition: all 0.2s;

			&.active {
				color: #5d7291;
				font-weight: bold;

				&::after {
					content: '';
					position: absolute;
					bottom: -20rpx;
					left: 50%;
					transform: translateX(-50%);
					width: 40rpx;
					height: 4rpx;
					background: #5d7291;
					border-radius: 2rpx;
				}
			}
		}
	}

	/* 星级筛选标签栏 */
	.rating-filter {
		display: flex;
		flex-wrap: wrap;
		background: #fff;
		padding: 20rpx 30rpx;
		gap: 20rpx;
		margin-bottom: 20rpx;

		.rating-chip {
			padding: 12rpx 24rpx;
			background: #f5f5f5;
			border-radius: 60rpx;
			font-size: 26rpx;
			color: #666;
			transition: all 0.2s;

			&.active {
				background: #5d7291;
				color: #fff;
			}
		}
	}

	/* 评价列表容器 */
	.review-list {
		padding: 0 20rpx;
	}

	/* 单个评价卡片 */
	.review-card {
		background: #fff;
		border-radius: 24rpx;
		padding: 30rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03);

		.user-info {
			display: flex;
			align-items: center;
			margin-bottom: 20rpx;

			.user-detail {
				flex: 1;
				margin-left: 20rpx;

				.name {
					font-size: 30rpx;
					font-weight: bold;
					display: block;
					color: #1a1a1a;
				}

				.time {
					font-size: 24rpx;
					color: #999;
					margin-top: 4rpx;
				}
			}

			.stars {
				display: flex;
				gap: 8rpx;
			}
		}

		.content {
			font-size: 28rpx;
			color: #333;
			line-height: 1.5;
			margin-bottom: 20rpx;
			word-break: break-word;
		}

		.images {
			display: flex;
			flex-wrap: wrap;
			gap: 16rpx;

			image {
				width: 180rpx;
				height: 180rpx;
				border-radius: 12rpx;
				background-color: #f5f5f5;
			}
		}
	}

	/* 底部状态文字 */
	.loading,
	.empty,
	.no-more {
		text-align: center;
		padding: 40rpx;
		font-size: 28rpx;
		color: #999;
	}
</style>