<template>
	<view class="wrap">
		<!-- 搜索框和分类选项卡合并区域 -->
		<view class="search-tabs-container">
			<view class="search-header">
				<view v-if="isSearching" class="back-btn" @click="cancelSearch">
					<u-icon name="arrow-left" size="32" color="#fff"></u-icon>
				</view>
				<view class="search-box" :class="{'with-back': isSearching}" @click="goToSearchPage">
					<view class="fake-search">
						<u-icon name="search" size="18" color="#999" />
						<text class="placeholder">搜索鱼竿、鱼饵...</text>
					</view>
				</view>
			</view>

			<view class="tabs-box" @click="handleTabClick">
				<u-tabs-swiper activeColor="#5d7291" :is-scroll="false" inactive-color="#1a1b1d" :list="tabs"
					:current="current" @change="changeTab" :bar-width="138" :item-width="150" gutter="20"
					swiperWidth="750"></u-tabs-swiper>
			</view>

			<!-- 钓场服务筛选栏（仅在当前 tab 为钓场服务时显示） -->
			<view class="pond-filter" v-if="current === 3">
				<view class="filter-tabs">
					<view v-for="option in filterOptions" :key="option.value" class="filter-tab"
						:class="{ active: serviceFilter === option.value }" @click="changeServiceFilter(option.value)">
						{{ option.label }}
					</view>
				</view>
			</view>
		</view>

		<!-- 商品内容区 -->
		<swiper class="swiper-box" :current="current" @animationfinish="animationfinish" v-if="!isSearching"
			:key="swiperKey">
			<swiper-item v-for="(tab, tabIndex) in tabs" :key="tabIndex" class="swiper-item">
				<scroll-view scroll-y style="height: 100%;" @scrolltolower="reachBottom(tabIndex)" @scroll="onScroll"
					:scroll-top="scrollTopValue" refresher-enabled="true" :refresher-triggered="refreshing[tabIndex]"
					@refresherrefresh="onRefresh(tabIndex)">
					<view class="page-box">
						<u-loadmore v-if="loading[tabIndex]" status="loading" bgColor="#f2f2f2" />

						<!-- 商品列表（鱼竿、鱼饵、配件） -->
						<view v-if="tabIndex < 3 && !loading[tabIndex]" class="product-list">
							<view class="product-card" v-for="item in goodsList[tabIndex]" :key="item.id"
								@click="goDetail(item)">
								<u-image width="100%" height="300rpx" :src="getImageUrl(item.pic_url)" border-radius="8"
									mode="aspectFill"></u-image>
								<view class="info">
									<text class="title u-line-1">{{ item.name }}</text>
									<view class="meta">
										<text class="price">¥{{ item.price }}起</text>
										<u-tag v-if="item.hot" text="热销" type="error" size="mini" shape="circle" />
									</view>
									<view class="tags">
										<u-tag v-for="(tag, tagIndex) in item.tags" :key="tagIndex" :text="tag"
											type="info" size="mini" shape="circle" bg-color="#5d7291" color="#fff" />
									</view>
								</view>
								<view class="cart-btn">
									<u-icon name="shopping-cart" size="28" color="#f38b11"
										@click.stop="addToCart(item)"></u-icon>
								</view>
							</view>
							<u-empty v-if="goodsList[tabIndex].length === 0" mode="list"
								icon="https://cdn.uviewui.com/uview/empty/list.png"></u-empty>
						</view>

						<!-- 钓场服务列表 -->
						<view v-else-if="!loading[tabIndex]" class="pond-list" :key="refreshKey">
							<view class="pond-card" v-for="pond in filteredPondServices" :key="pond.id"
								@click="goPondDetail(pond)">
								<u-image height="240rpx" :src="getImageUrl(pond.pic_url)" radius="8"
									mode="aspectFill"></u-image>
								<view class="info">
									<text class="title">{{ pond.name }}</text>
									<view class="service-tag">
										<u-tag :text="pond.service_type === 'regular' ? '开钓服务' : '比赛服务'" type="primary"
											size="mini" shape="circle" />
										<u-tag v-if="pond.is_end" text="已结束" type="error" size="mini" shape="circle" />
									</view>
									<text class="desc u-line-2">{{ pond.desc }}</text>
									<view class="tags">
										<u-tag v-for="(tag, tagIndex) in pond.tags" :key="tagIndex" :text="tag"
											type="info" size="mini" shape="circle" bg-color="#5d7291" color="#fff" />
									</view>
									<view class="footer">
										<text
											class="price">¥{{ pond.price }}{{ pond.service_type === 'regular' ? '/天' : '/人' }}</text>
										<u-tag :text="pond.service_type === 'regular' ? '立即预约' : '报名参赛'"
											:type="pond.is_end ? 'default' : 'warning'" :disabled="pond.is_end"
											shape="circle" @click.stop="bookPond(pond)" />
									</view>
								</view>
							</view>
							<u-empty v-if="filteredPondServices.length === 0" mode="list" :text="emptyText"
								icon="https://cdn.uviewui.com/uview/empty/list.png"></u-empty>
						</view>

						<u-loadmore v-if="!loading[tabIndex] && goodsList[tabIndex].length > 0"
							:status="loadStatus[tabIndex]" bgColor="#f2f2f2" :margin-top="20" :margin-bottom="20" />
					</view>
				</scroll-view>
			</swiper-item>
		</swiper>

		<!-- 废弃的搜索区域 -->
		<scroll-view scroll-y style="height: calc(100vh - 200rpx);" v-if="isSearching">
			<view class="search-results"></view>
		</scroll-view>

		<!-- 回到顶部按钮（自定义图片） -->
		<image v-show="showGoTop" class="go-top" src="/static/icons/go-top.png" mode="widthFix" @click="scrollToTop">
		</image>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				baseUrl: uni.$baseUrl,
				allPondServices: [],
				serviceFilter: 'all',
				filterOptions: [{
						label: '全部',
						value: 'all'
					},
					{
						label: '开钓服务',
						value: 'regular'
					},
					{
						label: '比赛服务',
						value: 'competition'
					}
				],
				keyword: '',
				current: 0,
				tabs: [{
						name: '鱼竿'
					},
					{
						name: '鱼饵'
					},
					{
						name: '配件'
					},
					{
						name: '钓场服务'
					}
				],
				goodsList: [
					[],
					[],
					[],
					[]
				],
				loadStatus: ['loadmore', 'loadmore', 'loadmore', 'loadmore'],
				loading: [true, true, true, true],
				pagination: [{
						page: 1,
						pageSize: 10,
						total: 0
					},
					{
						page: 1,
						pageSize: 10,
						total: 0
					},
					{
						page: 1,
						pageSize: 10,
						total: 0
					},
					{
						page: 1,
						pageSize: 5,
						total: 0
					}
				],
				cartCount: 0,
				allGoods: [],
				categoryGoods: {
					rod: [],
					bait: [],
					accessory: []
				},
				categoryMap: {
					0: "rod",
					1: "bait",
					2: "accessory"
				},
				isSearching: false,
				searchResults: [],
				pondResults: [],
				forceSwiperChange: false,
				swiperKey: 0,
				showGoTop: false,
				scrollTopValue: 0.01, // 初始值设为0.01，避免为0时失效
				oldScrollTop: 0,
				refreshing: [false, false, false, false], // 分别对应4个Tab的刷新状态
				refreshKey: 0,     // 钓场服务列表刷新标识
			}
		},
		computed: {
			filteredPondServices() {
				if (this.serviceFilter === 'all') return this.goodsList[3];
				return this.goodsList[3].filter(pond => pond.service_type === this.serviceFilter);
			},
			emptyText() {
				if (this.serviceFilter === 'all') return '暂无钓场服务';
				else if (this.serviceFilter === 'regular') return '暂无开钓服务';
				else return '暂无比赛服务';
			}
		},
		onLoad(options) {
			uni.$on('switchShopTab', this.handleSwitchTab);
			this.getGoodsList(this.current);
		},
		onUnload() {
			uni.$off('switchShopTab', this.handleSwitchTab);
		},
		methods: {
			goToSearchPage() {
				uni.navigateTo({
					url: '/pages/shop/searchPage?source=shop'
				});
			},
			getImageUrl(url) {
				if (!url) return '';
				if (url.startsWith('http') || url.startsWith('data:')) return url;
				return uni.$imgUrl(url);
			},
			changeServiceFilter(filterType) {
				this.serviceFilter = filterType;
			},
			handleSwitchTab(tabIndex) {
				if (tabIndex >= 0 && tabIndex < this.tabs.length) {
					this.current = tabIndex;
					this.forceSwiperChange = true;
					this.$nextTick(() => {
						this.forceSwiperChange = false;
					});
					if (this.goodsList[tabIndex].length === 0) this.getGoodsList(tabIndex);
				}
			},
			async getGoodsList(tabIndex, isLoadMore = false, isRefresh = false) {
				// 如果不是加载更多 且 不是下拉刷新，才显示全屏加载中（首次加载或切换tab）
				if (!isLoadMore && !isRefresh) {
					this.loading[tabIndex] = true;
				}
				if (isLoadMore) this.loadStatus[tabIndex] = 'loading';

				try {
					let url = '',
						params = {},
						responseData = [];
					if (tabIndex === 3) {
						url = uni.$baseUrl + '/api/fishing/services';
						const pageInfo = this.pagination[tabIndex];
						params = {
							page: pageInfo.page,
							pageSize: pageInfo.pageSize
						};
					} else {
						url = uni.$baseUrl + '/api/fishing';
						const categories = ['rod', 'bait', 'accessory'];
						const pageInfo = this.pagination[tabIndex];
						params = {
							category: categories[tabIndex],
							page: pageInfo.page,
							pageSize: pageInfo.pageSize
						};
					}
					const [error, response] = await uni.request({
						url,
						method: 'GET',
						data: params,
						header: {
							'Content-Type': 'application/json'
						}
					});
					if (error) throw error;
					const res = response.data;
					if (res.code === 200 || res.code === 0) {
						if (tabIndex === 3) {
							responseData = (res.data || []).map(item => ({
								id: item.id,
								name: item.name,
								price: item.price,
								pic_url: item.cover_image,
								desc: item.details,
								service_type: item.service_type,
								address: item.address,
								tags: typeof item.tags === 'string' ? JSON.parse(item.tags) : (item.tags ||
									[]),
								is_end: item.is_end || false
							}));
							if (!isLoadMore) this.allPondServices = responseData;
						} else {
							responseData = res.data || res.list || [];
							const categories = ['rod', 'bait', 'accessory'];
							const currentCategory = categories[tabIndex];
							responseData = responseData.filter(item => item.category === currentCategory);
						}
						const hasMoreData = responseData.length === this.pagination[tabIndex].pageSize;
						this.loadStatus[tabIndex] = hasMoreData ? 'loadmore' : 'nomore';
						if (isLoadMore) {
							this.goodsList[tabIndex] = [...this.goodsList[tabIndex], ...responseData];
						} else {
							this.$set(this.goodsList, tabIndex, responseData);
						}
						if (responseData.length > 0 && !isLoadMore && !isRefresh) {
						    this.pagination[tabIndex].page++;
						} else if (responseData.length === 0) {
							this.loadStatus[tabIndex] = 'nomore';
						}
					} else {
						uni.showToast({
							title: `加载失败: ${res.msg || res.message}`,
							icon: 'none'
						});
						this.loadStatus[tabIndex] = 'loadmore';
					}
				} catch (error) {
					console.error('API请求失败:', error);
					uni.showToast({
						title: '网络请求失败',
						icon: 'none'
					});
					this.loadStatus[tabIndex] = 'loadmore';
					if (tabIndex < 3) {
						this.goodsList[tabIndex] = [{
								id: 1,
								name: '碳素超轻鱼竿',
								pic_url: 'https://via.placeholder.com/300',
								price: 199.00,
								hot: true,
								tags: ['轻便', '高强度']
							},
							{
								id: 2,
								name: '专业矶钓竿',
								pic_url: 'https://via.placeholder.com/300',
								price: 299.00,
								tags: ['耐用', '远投']
							}
						];
						this.loading[tabIndex] = false;
						this.loadStatus[tabIndex] = 'nomore';
					}
				} finally {
					this.loading[tabIndex] = false;
					if (tabIndex === this.current && !isRefresh) {
						this.swiperKey++;
					}
				}
			},
			reachBottom(tabIndex) {
				if (this.loadStatus[tabIndex] === 'loadmore') this.getGoodsList(tabIndex, true);
			},
			changeTab(index) {
				this.current = index;
				uni.pageScrollTo({
					scrollTop: 0,
					duration: 300
				});
				if (this.goodsList[index].length === 0) this.getGoodsList(index);
			},
			animationfinish({
				detail: {
					current
				}
			}) {
				this.current = current;
				if (this.goodsList[current].length === 0) this.getGoodsList(current);
			},
			goDetail(item) {
				const productJson = encodeURIComponent(JSON.stringify(item));
				uni.navigateTo({
					url: `/pages/shop/detail?product=${productJson}`
				});
			},
			goPondDetail(pond) {
				uni.navigateTo({
					url: `/pages/shop/pond-detail?id=${pond.id}`
				});
			},
			addToCart(item) {
				this.cartCount++;
				uni.showToast({
					title: '已加入购物车',
					icon: 'success'
				});
			},
			bookPond(pond) {
				const pondJson = encodeURIComponent(JSON.stringify(pond));
				uni.navigateTo({
					url: `/pages/pond/booking?pond=${pondJson}`
				});
			},
			handleTabClick() {
				if (this.isSearching) this.cancelSearch();
			},
			cancelSearch() {
				this.isSearching = false;
				this.searchResults = [];
				this.pondResults = [];
				this.keyword = '';
			},
			// 监听滚动，记录位置并控制按钮显示隐藏
			onScroll(e) {
				const scrollTop = e.detail.scrollTop;
				this.showGoTop = scrollTop > 500; // 滑动超过500px时显示“回到顶部”按钮，阈值可自行调整
				// 记录滚动位置，用于回顶时的过渡效果
				this.oldScrollTop = scrollTop;
			},

			// 点击回到顶部
			scrollToTop() {
				// 先生成一个随机小数作为临时值
				this.scrollTopValue = 0.00001 + Math.random();
				// 在下一帧恢复值为目标滚动位置 0.01，并添加动画过渡
				this.$nextTick(() => {
					this.scrollTopValue = 0.01;
				});
			},
			// 下拉刷新
			async onRefresh(tabIndex) {
			    if (this.refreshing[tabIndex]) return;
			    this.$set(this.refreshing, tabIndex, true);
			    
			    // 重置分页和列表
			    this.pagination[tabIndex].page = 1;
			    this.goodsList[tabIndex] = [];
			    if (tabIndex === 3) {
			        this.allPondServices = [];
			        // 增加刷新标识，强制重建 DOM
			        this.refreshKey++;
			    }
			    
			    // 重新加载数据（isRefresh = true）
			    await this.getGoodsList(tabIndex, false, true);
			    
			    // 对于钓场服务，再触发一次计算属性的依赖更新
			    if (tabIndex === 3) {
			        // 临时改变 serviceFilter 再改回来，触发 computed 重新计算
			        const oldFilter = this.serviceFilter;
			        this.serviceFilter = 'temp';
			        this.$nextTick(() => {
			            this.serviceFilter = oldFilter;
			            // 结束刷新动画
			            setTimeout(() => {
			                this.$set(this.refreshing, tabIndex, false);
			            }, 200);
			        });
			    } else {
			        setTimeout(() => {
			            this.$set(this.refreshing, tabIndex, false);
			        }, 200);
			    }
			}
		},
	}
</script>

<style lang="scss" scoped>
	/* 简约线条风格筛选器 */
	.pond-filter {
		background-color: #fff;
		padding: 0 30rpx 20rpx;

		.filter-tabs {
			display: flex;
			gap: 40rpx;

			.filter-tab {
				font-size: 28rpx;
				color: #666;
				padding: 12rpx 0;
				position: relative;
				transition: all 0.2s;

				&.active {
					color: #5d7291;
					font-weight: bold;

					&::after {
						content: '';
						position: absolute;
						bottom: 0;
						left: 0;
						right: 0;
						height: 4rpx;
						background: #5d7291;
						border-radius: 2rpx;
					}
				}
			}
		}
	}

	/* 服务类型标签 */
	.service-tag {
		// margin: 10rpx 0;
		// display: flex;
		// gap: 10rpx;
		// flex-wrap: wrap;
		margin: 10rpx 0;
		display: flex;
		flex-wrap: wrap;


		::v-deep .u-tag {
			&.u-type-primary {
				background-color: #5d7291 !important;
				color: #fff !important;
			}

			&.u-type-error {
				background-color: #e54d42 !important;
				color: #fff !important;
			}
		}
	}

	.desc {
		font-size: 26rpx;
		color: #666;
		margin: 10rpx 0 20rpx;
		line-height: 1.6;
	}

	.wrap {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: #f7f7f8;
	}

	.search-tabs-container {
		background-color: #fff;
		border-radius: 0 0 30rpx 30rpx;
		box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.08);
		overflow: hidden;
		margin-bottom: 10rpx;
	}

	.search-header {
		display: flex;
		align-items: center;
		padding: 30rpx 30rpx 20rpx;
		background-color: #fff;
		transition: all 0.3s;

		.back-btn {
			width: 60rpx;
			height: 60rpx;
			border-radius: 50%;
			background: rgba(0, 0, 0, 0.05);
			display: flex;
			align-items: center;
			justify-content: center;
			margin-right: 20rpx;
			flex-shrink: 0;
		}

		.search-box {
			flex: 1;

			&.with-back {
				margin-left: 0;
			}
		}
	}

	.fake-search {
		background-color: #f5f7fa;
		border-radius: 60rpx;
		height: 70rpx;
		display: flex;
		align-items: center;
		padding: 0 30rpx;

		.u-icon {
			margin-right: 16rpx;
		}

		.placeholder {
			font-size: 28rpx;
			color: #999;
		}
	}

	.tabs-box {
		background-color: #fff;
		padding: 0 30rpx 5rpx 20rpx;
		position: relative;

		::v-deep .u-tabs-swiper {
			.u-tabs-swiper__wrapper {
				background-color: transparent;

				.u-tab-item {
					background: transparent;
					border-radius: 0;
					margin: 0;
					padding: 0 30rpx;
					color: #666 !important;
					font-weight: normal;
					position: relative;

					&--active {
						color: #5d7291 !important;
						font-weight: bold;

						&::after {
							content: '';
							position: absolute;
							bottom: -10rpx;
							left: 50%;
							transform: translateX(-50%);
							width: 60rpx;
							height: 6rpx;
							background: #5d7291;
							border-radius: 3rpx;
						}
					}
				}
			}

			.u-tabs-swiper__bar {
				display: none;
			}
		}
	}

	.swiper-box {
		flex: 1;
		width: 100%;
		overflow: hidden;

		.swiper-item {
			height: 100%;
		}
	}

	.page-box {
		min-height: 100%;
		padding-bottom: 40rpx;
	}

	.product-list {
		display: flex;
		flex-wrap: wrap;
		padding: 20rpx;
		gap: 20rpx;

		.product-card {
			width: calc(50% - 10rpx);
			background: #fff;
			border-radius: 16rpx;
			overflow: hidden;
			position: relative;
			box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);

			.info {
				padding: 20rpx;

				.title {
					font-size: 28rpx;
					color: #151817;
					font-weight: 500;
					line-height: 1.4;
				}

				.meta {
					display: flex;
					align-items: center;
					margin-top: 10rpx;

					.price {
						color: #f38b11;
						font-size: 32rpx;
						font-weight: bold;
						margin-right: 15rpx;
					}
				}

				.tags {
					margin-top: 10rpx;
					display: flex;
					flex-wrap: wrap;
					gap: 8rpx;
				}
			}

			.cart-btn {
				position: absolute;
				right: 20rpx;
				bottom: 20rpx;
				background: rgba(243, 139, 17, 0.1);
				width: 60rpx;
				height: 60rpx;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				transition: all 0.3s;

				&:active {
					transform: scale(0.9);
					background: rgba(243, 139, 17, 0.2);
				}
			}
		}
	}

	.pond-list {
		padding: 20rpx;

		.pond-card {
			background: #fff;
			border-radius: 16rpx;
			overflow: hidden;
			margin-bottom: 30rpx;
			box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
			transition: all 0.3s;

			&:active {
				transform: translateY(4rpx);
				box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
			}

			.info {
				padding: 28rpx 24rpx;

				.title {
					font-size: 32rpx;
					color: #151817;
					font-weight: 600;
					display: block;
					margin-bottom: 16rpx;
					line-height: 1.4;
				}

				.desc {
					font-size: 26rpx;
					color: #666;
					margin: 16rpx 0 24rpx;
					line-height: 1.6;
				}

				.footer {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-top: 24rpx;
					padding-top: 16rpx;
					border-top: 1rpx solid #f0f0f0;

					.price {
						color: #f38b11;
						font-size: 36rpx;
						font-weight: bold;
					}

					::v-deep .u-tag {
						padding: 0 30rpx;
						height: 60rpx;
						line-height: 60rpx;
						font-size: 28rpx;
					}
				}
			}
		}
	}

	.search-results {
		padding: 0 20rpx 20rpx;

		.section-title {
			font-size: 32rpx;
			font-weight: bold;
			margin: 20rpx 0;
			padding: 10rpx 20rpx;
			background-color: #fff;
			border-radius: 12rpx;
			color: #5d7291;
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
		}
	}

	.pond-list {
		.tags {
			display: flex;
			flex-wrap: wrap;
			margin: 10rpx 0;

			.u-tag {
				margin-right: 10rpx;
				margin-bottom: 10rpx;

				&:last-child {
					margin-right: 0;
				}
			}
		}
	}

	/* 回到顶部按钮 */
	.go-top {
		position: fixed;
		bottom: 120rpx;
		left: 630rpx;
		width: 80rpx;
		height: 80rpx;
		z-index: 99;
		opacity: 0.8;
		transition: all 0.3s;

		&:active {
			transform: scale(0.9);
			opacity: 1;
		}
	}
</style>