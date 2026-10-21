<template>
	<view class="wrap">
		<view class="wrap-in">
			<!-- 轮播图（带边框效果） -->
			<view class="banner-wrapper">
				<view class="banner">
					<swiper class="banner-swiper" :autoplay="true" interval="3000" circular indicator-dots
						style="height: 400rpx;" indicator-color="#999" indicator-active-color="#f38b11">
						<swiper-item v-for="(item, index) in bannerList" :key="index">
							<image class="banner-image" :src="getImageUrl(item.image_url)" mode="aspectFill"
								style="width: 100%; height: 100%;"></image>
						</swiper-item>
					</swiper>
				</view>
			</view>
			<!-- 排行榜 -->
			<view class="rank-list">
				<view class="header">
					<text class="title">排行榜</text>
					<navigator url="/pages/dynamicRank/dynamicRank" class="load-more">更多 > </navigator>
				</view>
				<view class="card">
					<view class="item" v-for="ele in topList" :key='ele.id'>
						<view class="cover">
							<u-image shape="circle" height="132" width="132" :src="ele.avatar"></u-image>
						</view>
						<view class="username">{{ ele.nickname }}</view>
						<view class="total">累计总量：{{ ele.all_weight }}/斤</view>
						<view class="tag">
							<u-image :src="ele.tag" width="59" height="56"></u-image>
						</view>
					</view>
				</view>
			</view>


			<!-- 热门推荐钓场 -->
			<view class="hot-pond" v-if="pondList.length">
				<view class="header">
					<text class="title hot-title">热门推荐钓场</text>
					<view class="load-more" @click="goToShopTab(3)">更多 ></view>
				</view>
				<scroll-view scroll-x class="scroll-x">
					<view class="card-list">
						<view class="card" v-for="item in pondList" :key="item.id" @click="goPondDetail(item)">
							<u-image width="280rpx" height="280rpx" :src="getImageUrl(item.cover_image)"
								border-radius="12" />
							<view class="info">
								<text class="name">{{ item.name }}</text>
								<text
									class="price">¥{{ item.price }}/{{ item.service_type === 'regular' ? '天' : '人' }}</text>
							</view>
						</view>
					</view>
				</scroll-view>
			</view>

			<!-- 热销商品 -->
			<view class="hot-products" v-if="hotProducts.length">
				<view class="header">
					<text class="title hot-title">热销商品</text>
					<view class="load-more" @click="goTo('/pages/shop/shop')">更多 ></view>
				</view>
				<scroll-view scroll-x class="scroll-x">
					<view class="card-list">
						<view class="card" v-for="item in hotProducts" :key="item.id" @click="goGoodsDetail(item)">
							<u-image width="280rpx" height="280rpx" :src="getImageUrl(item.pic_url)"
								border-radius="12" />
							<view class="info">
								<text class="name">{{ item.name }}</text>
								<text class="price">¥{{ item.price }}</text>
								<text class="sales">月销 {{ item.sales || 0 }} 件</text>
							</view>
						</view>
					</view>
				</scroll-view>
			</view>

			<!-- 热门动态 -->
			<view class="hot-posts" v-if="hotPosts.length">
				<view class="header">
					<view style="display: flex; align-items: center;">
						<image src="/static/images/megaphone.png"
							style="width: 40rpx; height: 40rpx; margin-right: 12rpx;"></image>
						<text class="title">热门动态</text>
					</view>
					<view class="load-more" @click="goTo('/pages/social/feed')">更多 ></view>
				</view>
				<view class="post-list">
					<view class="post-item" v-for="item in hotPosts" :key="item.id" @click="goToPostDetail(item.id)">
						<view class="user">
							<u-image width="60rpx" height="60rpx" shape="circle" :src="getImageUrl(item.user_avatar)" />
							<text class="nickname">{{ item.user_name }}</text>
							<text class="time">{{ item.created_at }}</text>
						</view>
						<text class="content">{{ item.content }}</text>
						<view class="stats">
							<view class="stat-item">
								<image src="/static/images/like.png" style="width: 32rpx; height: 32rpx;"
									mode="aspectFill" />
								<text>{{ item.like_count }}</text>
							</view>
							<view class="stat-item">
								<image src="/static/images/comment.png" style="width: 32rpx; height: 32rpx;"
									mode="aspectFill" />
								<text>{{ item.comment_count }}</text>
							</view>
						</view>
					</view>
				</view>
			</view>

			<!-- 近期比赛 -->
			<view class="upcoming-matches" v-if="matchList.length">
				<view class="header">
					<view style="display: flex; align-items: center;">
						<image src="/static/images/calendar.png"
							style="width: 40rpx; height: 40rpx; margin-right: 12rpx;"></image>
						<text class="title">近期比赛</text>
					</view>
					<view class="load-more" @click="goToShopTab(3)">更多 ></view>
				</view>
				<view class="match-list">
					<view class="match-item" v-for="item in matchList" :key="item.id" @click="goPondDetail(item)">
						<u-image width="200rpx" height="200rpx" :src="getImageUrl(item.cover_image)"
							border-radius="12" />
						<view class="info">
							<text class="name">{{ item.name }}</text>
							<text class="time">时间：{{ item.match_time ? item.match_time.substring(0, 10) : '待定' }}</text>
							<text class="location">地点：{{ item.address }}</text>
						</view>
					</view>
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
				bannerList: [],
				pondList: [], // 热门推荐钓场
				hotProducts: [], // 热销商品
				hotPosts: [], // 热门动态
				matchList: [], // 近期比赛
				topList: [], // 排行榜
				currentIndex: 0
			}
		},
		onLoad() {
			this.refreshAllData(); // 首次加载所有数据
		},
		// 页面级下拉刷新（需要 pages.json 中配置 enablePullDownRefresh: true）
		onPullDownRefresh() {
			this.refreshAllData(); // 下拉时刷新全部数据
		},
		methods: {
			getImageUrl(url) {
				if (!url) return '';
				if (url.startsWith('http') || url.startsWith('data:')) return url;
				return uni.$imgUrl(url);
			},
			goTo(url) {
				uni.switchTab({
					url
				});
			},
			goToShopTab(tabIndex) {
				uni.switchTab({
					url: '/pages/shop/shop',
					success: () => {
						uni.$emit('switchShopTab', tabIndex);
					}
				});
			},
			goPondDetail(pond) {
				uni.navigateTo({
					url: `/pages/shop/pond-detail?id=${pond.id}`
				});
			},
			goGoodsDetail(item) {
				uni.navigateTo({
					url: `/pages/shop/detail?id=${item.id}`
				});
			},
			goToPostDetail(postId) {
				uni.navigateTo({
					url: `/pages/social/postDetail?postId=${postId}`
				});
			},
			// 统一刷新所有数据（首次加载和下拉刷新共用）
			async refreshAllData() {
				await Promise.all([
					this.fetchBanners(),
					this.fetchHotPonds(),
					this.fetchHotProducts(),
					this.fetchHotPosts(),
					this.fetchUpcomingMatches(),
					this.fetchRankData()
				]);
				// 停止下拉刷新动画（仅在下拉刷新时有效）
				uni.stopPullDownRefresh();
			},
			async fetchBanners() {
				try {
					const res = await request({
						url: '/api/banners',
						method: 'GET'
					});
					if (res.data.code === 0) this.bannerList = res.data.data;
				} catch (e) {
					console.error('获取banner失败', e);
				}
			},
			// 热门推荐钓场（开钓服务）
			async fetchHotPonds() {
				try {
					const [err, res] = await uni.request({
						url: uni.$baseUrl + '/api/fishing/services',
						method: 'GET'
					});
					if (res.data.code === 0) {
						let services = res.data.data || [];
						this.pondList = services
							.filter(s => s.service_type === 'regular')
							.slice(0, 4);
					}
				} catch (e) {
					console.error('获取热门钓场失败', e);
				}
			},
			// 热销商品
			async fetchHotProducts() {
				try {
					const [err, res] = await uni.request({
						url: uni.$baseUrl + '/api/products/hot',
						method: 'GET'
					});
					if (res.data.code === 0) {
						this.hotProducts = res.data.data.slice(0, 4);
					}
				} catch (e) {
					console.error('获取热销商品失败', e);
				}
			},
			// 热门动态
			async fetchHotPosts() {
				try {
					const [err, res] = await uni.request({
						url: uni.$baseUrl + '/api/posts?type=latest&page=1&page_size=10',
						method: 'GET'
					});
					if (res.data.code === 0) {
						let posts = res.data.data.list || [];
						posts.sort((a, b) => (b.like_count + b.comment_count) - (a.like_count + a.comment_count));
						this.hotPosts = posts.slice(0, 3);
					}
				} catch (e) {
					console.error('获取热门动态失败', e);
				}
			},
			// 近期比赛（未结束）
			async fetchUpcomingMatches() {
				try {
					const [err, res] = await uni.request({
						url: uni.$baseUrl + '/api/fishing/services',
						method: 'GET'
					});
					if (res.data.code === 0) {
						let services = res.data.data || [];
						const now = new Date();
						this.matchList = services
							.filter(s => s.service_type === 'competition' && !s.is_end)
							.sort((a, b) => new Date(a.match_time) - new Date(b.match_time))
							.slice(0, 3);
					}
				} catch (e) {
					console.error('获取近期比赛失败', e);
				}
			},
			// 排行榜
			async fetchRankData() {
				try {
					const [err, res] = await uni.request({
						url: uni.$baseUrl + '/api/user/rank',
						method: 'GET',
						data: {
							limit: 3
						}
					});
					if (res.data.code === 0) {
						this.topList = res.data.data || [];
					} else {
						throw new Error('加载失败');
					}
				} catch (e) {
					console.error('排行榜加载失败', e);
					// 备用数据
					this.topList = [{
							id: 1,
							avatar: '/static/images/avatar1.png',
							nickname: '钓鱼达人',
							all_weight: '128.5',
							tag: '/static/images/jb1.png'
						},
						{
							id: 2,
							avatar: '/static/images/avatar2.jpg',
							nickname: '鱼见愁',
							all_weight: '96.3',
							tag: '/static/images/jb2.png'
						},
						{
							id: 3,
							avatar: '/static/images/avatar3.jpg',
							nickname: '江湖钓手',
							all_weight: '85.7',
							tag: '/static/images/jb3.png'
						}
					];
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.wrap {
		background-color: #f7f7f8;
		min-height: 100vh;
	}

	.wrap-in {
		padding-bottom: 40rpx;
	}

	.banner {
		width: 100%;

		.banner-swiper {
			width: 100%;
		}

		.banner-image {
			width: 100%;
			display: block;
		}
	}


	/* 通用头部 */
	.header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		padding: 20rpx 30rpx 10rpx;

		.title {
			font-size: 34rpx;
			font-weight: bold;
			color: #1a1a1a;
		}

		.load-more {
			font-size: 26rpx;
			color: #5d7291;
		}
	}

	/* 横向滚动卡片 */
	.scroll-x {
		white-space: nowrap;
		padding: 0 20rpx;

		.card-list {
			display: inline-flex;

			.card {
				display: inline-block;
				width: 280rpx;
				background: #fff;
				margin-right: 30rpx;
				border-radius: 20rpx;
				overflow: hidden;
				box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);

				.info {
					padding: 16rpx;

					.name {
						font-size: 28rpx;
						font-weight: 500;
						display: block;
						margin-bottom: 8rpx;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
					}

					.price {
						font-size: 30rpx;
						color: #f38b11;
						font-weight: bold;
					}

					.sales {
						font-size: 24rpx;
						color: #999;
					}
				}
			}
		}
	}

	/* 热门动态列表 */
	.hot-posts {
		background: #fff;
		margin: 20rpx;
		border-radius: 24rpx;

		.post-list {
			padding: 0 30rpx;

			.post-item {
				padding: 20rpx 0;
				border-bottom: 1rpx solid #f0f0f0;

				.user {
					display: flex;
					align-items: center;
					gap: 16rpx;
					margin-bottom: 12rpx;

					.nickname {
						font-size: 28rpx;
						font-weight: 500;
					}

					.time {
						font-size: 24rpx;
						color: #999;
						margin-left: auto;
					}
				}

				.content {
					font-size: 28rpx;
					color: #333;
					line-height: 1.4;
					margin-bottom: 12rpx;
					display: -webkit-box;
					-webkit-box-orient: vertical;
					-webkit-line-clamp: 2;
					overflow: hidden;
				}

				.stats {
					display: flex;
					gap: 30rpx;
					margin-top: 16rpx;

					.stat-item {
						display: flex;
						align-items: center;
						gap: 8rpx;

						image {
							width: 32rpx;
							height: 32rpx;
						}

						text {
							font-size: 26rpx;
							color: #999;
						}
					}
				}
			}
		}
	}

	/* 近期比赛列表 */
	.upcoming-matches {
		background: #fff;
		margin: 20rpx;
		border-radius: 24rpx;

		.match-list {
			padding: 0 30rpx;

			.match-item {
				display: flex;
				padding: 20rpx 0;
				border-bottom: 1rpx solid #f0f0f0;

				.info {
					flex: 1;
					margin-left: 20rpx;

					.name {
						font-size: 30rpx;
						font-weight: bold;
						display: block;
						margin-bottom: 12rpx;
					}

					.time,
					.location {
						font-size: 26rpx;
						color: #666;
						display: block;
						margin-bottom: 8rpx;
					}
				}
			}
		}
	}

	/* 排行榜（原有样式微调） */
	.rank-list {
		background: #fff;
		margin: 20rpx;
		border-radius: 24rpx;
		padding: 20rpx;

		.header {
			padding: 0 0 20rpx;
		}

		.card {
			display: flex;
			justify-content: space-around;

			.item {
				text-align: center;
				position: relative;

				.cover {
					width: 132rpx;
					height: 132rpx;
					margin: 0 auto;
				}

				.username {
					font-size: 28rpx;
					margin-top: 12rpx;
				}

				.total {
					font-size: 24rpx;
					color: #999;
				}

				.tag {
					position: absolute;
					top: -10rpx;
					left: 8%;
					transform: translateX(-50%);
				}
			}
		}
	}

	/* 轮播图容器边框效果 */
	.banner-wrapper {
		padding: 20rpx 30rpx 0;
	}

	.banner {
		background: #fff;
		border-radius: 32rpx;
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.05);
		overflow: hidden;

		.banner-swiper {
			border-radius: 32rpx;
		}
	}

	/* 热门标题高级感样式 */
	.hot-title {
		position: relative;
		padding-left: 16rpx;

		&::before {
			content: '';
			position: absolute;
			left: 0;
			top: 50%;
			transform: translateY(-50%);
			width: 8rpx;
			height: 32rpx;
			background: linear-gradient(180deg, #f38b11, #ffb347);
			border-radius: 4rpx;
		}
	}
</style>