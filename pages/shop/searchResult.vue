<template>
	<view class="search-result">
		<!-- 顶部搜索栏 -->
		<view class="search-header">
			<view class="back-btn" @click="goBack">
				<u-icon name="arrow-left" size="24" color="#333" />
			</view>
			<view class="search-input-wrapper">
				<input class="search-input" v-model="keyword" placeholder="搜索商品或钓场" confirm-type="search"
					@confirm="handleSearch" />
			</view>
			<view class="search-btn" @click="handleSearch">搜索</view>
		</view>

		<!-- Tab 切换栏 -->
		<view class="tab-bar">
			<view class="tab-item" :class="{ active: activeTab === 'product' }" @click="switchTab('product')">商品</view>
			<view class="tab-item" :class="{ active: activeTab === 'service' }" @click="switchTab('service')">钓场服务
			</view>
		</view>

		<!-- 排序栏（仅对商品 Tab 显示，精简高度） -->
		<view class="sort-bar" v-if="activeTab === 'product'">
			<scroll-view scroll-x class="sort-scroll">
				<view class="sort-wrapper">
					<view class="sort-item" :class="{ active: sortType === 'comprehensive' }"
						@click="setSort('comprehensive')">综合</view>
					<view class="sort-item" :class="{ active: sortType === 'sales' }" @click="setSort('sales')">销量
					</view>
					<view class="sort-item" :class="{ active: sortType === 'price_asc' }" @click="setSort('price_asc')">
						价格升序</view>
					<view class="sort-item" :class="{ active: sortType === 'price_desc' }"
						@click="setSort('price_desc')">价格降序</view>
					<view class="sort-item" :class="{ active: sortType === 'new' }" @click="setSort('new')">新品</view>
					<view class="layout-switch" @click="toggleLayout">
						<u-icon :name="layoutType === 'grid' ? 'grid' : 'list'" size="28" color="#666" />
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 滚动内容区域，绑定 scroll-top 实现回顶 -->
		<scroll-view scroll-y class="scroll-view" :scroll-top="scrollTopValue" @scroll="onScroll"
			@scrolltolower="loadMore" :style="{ height: scrollHeight + 'px' }">
			<!-- 商品列表 -->
			<view v-if="activeTab === 'product'">
				<view v-if="layoutType === 'grid'" class="product-grid">
					<view class="product-card" v-for="item in productList" :key="item.id" @click="goDetail(item)">
						<image style="width:100%; height:300rpx" mode="aspectFill" :src="getImageUrl(item.pic_url)">
						</image>
						<view class="info">
							<text class="title">{{ item.name }}</text>
							<text class="price">¥{{ item.price }}</text>
						</view>
					</view>
				</view>
				<view v-else class="product-list">
					<view class="product-item" v-for="item in productList" :key="item.id" @click="goDetail(item)">
						<image class="product-img" :src="getImageUrl(item.pic_url)" mode="aspectFill"></image>
						<view class="product-info">
							<text class="title">{{ item.name }}</text>
							<text class="price">¥{{ item.price }}</text>
							<text class="sales">月销 {{ item.sales || 0 }} 件</text>
						</view>
					</view>
				</view>
				<u-loadmore :status="productLoadStatus" />
				<view v-if="productList.length === 0 && !productLoading" class="empty-tip">暂无相关商品</view>
			</view>

			<!-- 钓场服务列表 -->
			<view v-else>
				<view class="service-list">
					<view class="service-card" v-for="item in serviceList" :key="item.id"
						@click="goServiceDetail(item)">
						<image class="service-img" :src="getImageUrl(item.cover_image || item.pic_url)"
							mode="aspectFill"></image>
						<view class="service-info">
							<text class="service-name">{{ item.name }}</text>
							<view class="service-tags">
								<text class="tag">{{ item.service_type === 'regular' ? '开钓服务' : '比赛服务' }}</text>
								<text v-if="item.is_end" class="tag end">已结束</text>
							</view>
							<text class="service-desc">{{ item.details || item.desc || '' }}</text>
							<view class="service-footer">
								<text
									class="price">¥{{ item.price }}{{ item.service_type === 'regular' ? '/天' : '/人' }}</text>
								<text class="book-btn"
									@click.stop="bookService(item)">{{ item.service_type === 'regular' ? '立即预约' : '报名参赛' }}</text>
							</view>
						</view>
					</view>
				</view>
				<u-loadmore :status="serviceLoadStatus" />
				<view v-if="serviceList.length === 0 && !serviceLoading" class="empty-tip">暂无相关钓场服务</view>
			</view>

			<view class="bottom-placeholder"></view>
		</scroll-view>

		<!-- 回到顶部悬浮按钮 -->
		<view class="go-top" v-show="showGoTop" @click="scrollToTop">
			<u-icon name="arrow-up" size="28" color="#fff"></u-icon>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				keyword: '', // 搜索关键词
				merchantId: null, // 商家ID（店铺内搜索时使用）
				activeTab: 'product', // 当前标签：product / service

				// 商品相关
				productList: [],
				productPage: 1,
				productTotal: 0,
				productLoadStatus: 'loadmore',
				productLoading: false,
				sortType: 'comprehensive', // 排序类型
				layoutType: 'grid', // 布局：grid / list

				// 钓场服务相关
				serviceList: [],
				servicePage: 1,
				serviceTotal: 0,
				serviceLoadStatus: 'loadmore',
				serviceLoading: false,

				scrollHeight: 0, // 滚动区域高度
				scrollTopValue: 0, // 用于控制滚动位置
				showGoTop: false, // 是否显示回到顶部按钮
			}
		},
		onLoad(options) {
			if (options.keyword) {
				this.keyword = decodeURIComponent(options.keyword)
			}
			if (options.merchantId) {
				this.merchantId = parseInt(options.merchantId)
			}
			this.calcScrollHeight()
			this.searchProducts() // 初始加载商品
			this.searchServices() // 初始加载服务
		},
		onReady() {
			this.calcScrollHeight()
		},
		methods: {
			// 图片地址补全
			getImageUrl(url) {
				if (!url) return ''
				if (url.startsWith('http') || url.startsWith('data:')) return url
				return uni.$imgUrl(url);},

			// 计算滚动区域高度
			calcScrollHeight() {
				const systemInfo = uni.getSystemInfoSync()
				const windowHeight = systemInfo.windowHeight
				const query = uni.createSelectorQuery().in(this)
				query.select('.search-header').boundingClientRect()
				query.select('.tab-bar').boundingClientRect()
				query.select('.sort-bar').boundingClientRect()
				query.exec((res) => {
					const headerHeight = (res[0] && res[0].height) || 100
					const tabHeight = (res[1] && res[1].height) || 80
					const sortHeight = (res[2] && res[2].height) || (this.activeTab === 'product' ? 80 : 0)
					this.scrollHeight = windowHeight - headerHeight - tabHeight - sortHeight - 10
					if (this.scrollHeight < 0) this.scrollHeight = 0
				})
			},

			// 滚动事件监听（用于显示/隐藏回到顶部按钮）
			onScroll(e) {
				const scrollTop = e.detail.scrollTop
				// 滚动超过 500px 显示按钮
				this.showGoTop = scrollTop > 500
				// 可选：更新 scrollTopValue 用于记录，但不影响业务
				this.scrollTopValue = scrollTop
			},

			// 回到顶部
			scrollToTop() {
				this.scrollTopValue = 0
			},

			// 切换 Tab
			switchTab(tab) {
				this.activeTab = tab
				this.calcScrollHeight() // 重新计算高度
				// 回到顶部
				this.scrollToTop()
			},

			// 商品搜索（支持分页）
			async searchProducts(isLoadMore = false) {
				if (this.productLoading) return
				if (!isLoadMore) {
					this.productLoading = true
					this.productLoadStatus = 'loading'
				} else {
					if (this.productLoadStatus === 'nomore') return
					this.productLoadStatus = 'loading'
				}
				const page = isLoadMore ? this.productPage : 1
				try {
					const res = await uni.request({
						url: uni.$baseUrl + '/api/products/search',
						data: {
							keyword: this.keyword,
							merchantId: this.merchantId || undefined,
							sort: this.sortType,
							page: page,
							pageSize: 10
						}
					})
					const result = res[1].data
					if (result.code === 0) {
						const newList = result.data.list
						if (isLoadMore) {
							this.productList = [...this.productList, ...newList]
						} else {
							this.productList = newList
						}
						this.productTotal = result.data.total
						this.productLoadStatus = this.productList.length >= this.productTotal ? 'nomore' : 'loadmore'
						if (isLoadMore) this.productPage++
						else this.productPage = 2
					} else {
						this.productLoadStatus = 'loadmore'
					}
				} catch (error) {
					console.error('商品搜索失败', error)
					this.productLoadStatus = 'loadmore'
				} finally {
					if (!isLoadMore) this.productLoading = false
				}
			},

			// 钓场服务搜索
			async searchServices(isLoadMore = false) {
				if (this.serviceLoading) return
				if (!isLoadMore) {
					this.serviceLoading = true
					this.serviceLoadStatus = 'loading'
				} else {
					if (this.serviceLoadStatus === 'nomore') return
					this.serviceLoadStatus = 'loading'
				}
				const page = isLoadMore ? this.servicePage : 1
				try {
					const res = await uni.request({
						url: uni.$baseUrl + '/api/fishing/services/search',
						data: {
							keyword: this.keyword,
							page: page,
							pageSize: 10
						}
					})
					const result = res[1].data
					if (result.code === 0) {
						const newList = result.data.list || result.data
						if (isLoadMore) {
							this.serviceList = [...this.serviceList, ...newList]
						} else {
							this.serviceList = newList
						}
						this.serviceTotal = result.data.total || 0
						this.serviceLoadStatus = this.serviceList.length >= this.serviceTotal ? 'nomore' : 'loadmore'
						if (isLoadMore) this.servicePage++
						else this.servicePage = 2
					} else {
						this.serviceLoadStatus = 'loadmore'
					}
				} catch (error) {
					console.error('钓场服务搜索失败', error)
					this.serviceLoadStatus = 'loadmore'
				} finally {
					if (!isLoadMore) this.serviceLoading = false
				}
			},

			// 刷新搜索（重置分页）
			handleSearch() {
				if (!this.keyword.trim()) {
					uni.showToast({
						title: '请输入搜索词',
						icon: 'none'
					})
					return
				}
				this.productPage = 1
				this.servicePage = 1
				this.productList = []
				this.serviceList = []
				this.searchProducts()
				this.searchServices()
			},

			// 设置排序（仅商品使用）
			setSort(type) {
				this.sortType = type
				this.productPage = 1
				this.productList = []
				this.searchProducts()
			},

			// 切换布局
			toggleLayout() {
				this.layoutType = this.layoutType === 'grid' ? 'list' : 'grid'
			},

			// 加载更多
			loadMore() {
				if (this.activeTab === 'product') {
					if (this.productLoadStatus === 'nomore') return
					this.searchProducts(true)
				} else {
					if (this.serviceLoadStatus === 'nomore') return
					this.searchServices(true)
				}
			},

			// 跳转商品详情
			goDetail(item) {
				const productJson = encodeURIComponent(JSON.stringify(item))
				uni.navigateTo({
					url: `/pages/shop/detail?product=${productJson}`
				})
			},

			// 跳转钓场服务详情
			goServiceDetail(item) {
				uni.navigateTo({
					url: `/pages/shop/pond-detail?id=${item.id}`
				})
			},

			// 预约/报名
			bookService(item) {
				uni.navigateTo({
					url: `/pages/shop/pond-detail?id=${item.id}`
				})
			},

			// 返回上一页
			goBack() {
				uni.navigateBack()
			},
		},
		watch: {
			activeTab() {
				this.$nextTick(() => {
					this.calcScrollHeight()
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	page,
	.search-result {
		width: 100%;
		overflow-x: hidden;
	}

	.search-result {
		background-color: #f5f5f5;
		height: 100vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	/* 顶部搜索栏 */
	.search-header {
		display: flex;
		align-items: center;
		padding: 20rpx 30rpx;
		background: #fff;
		border-bottom: 1rpx solid #eee;
		box-sizing: border-box;

		.back-btn {
			margin-right: 20rpx;
			width: 60rpx;
			height: 60rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
		}

		.search-input-wrapper {
			flex: 1;
			background-color: #f5f5f5;
			border-radius: 60rpx;
			padding: 0 24rpx;
			height: 70rpx;
			display: flex;
			align-items: center;

			.search-input {
				flex: 1;
				font-size: 28rpx;
				color: #333;
			}
		}

		.search-btn {
			background-color: #f38b11;
			color: #fff;
			border-radius: 60rpx;
			padding: 0 30rpx;
			height: 70rpx;
			line-height: 70rpx;
			text-align: center;
			font-size: 28rpx;
			margin-left: 20rpx;
			font-weight: 500;
			flex-shrink: 0;
		}
	}

	/* Tab 栏 */
	.tab-bar {
		display: flex;
		background: #fff;
		border-bottom: 1rpx solid #eee;

		.tab-item {
			flex: 1;
			text-align: center;
			padding: 20rpx 0;
			font-size: 28rpx;
			color: #666;
			position: relative;

			&.active {
				color: #5d7291;
				font-weight: bold;

				&::after {
					content: '';
					position: absolute;
					bottom: 0;
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

	/* 排序栏 - 精简高度，横向滚动 */
	.sort-bar {
		background: #fff;
		border-bottom: 1rpx solid #eee;

		.sort-scroll {
			white-space: nowrap;

			.sort-wrapper {
				display: inline-flex;
				align-items: center;
				padding: 12rpx 30rpx;
				gap: 56rpx;

				.sort-item {
					font-size: 26rpx;
					color: #666;
					padding: 8rpx 0;

					&.active {
						color: #5d7291;
						font-weight: bold;
					}
				}

				.layout-switch {
					margin-left: 12rpx;
					flex-shrink: 0;
				}
			}
		}
	}

	/* 滚动区域 */
	.scroll-view {
		flex: 1;
		width: 100%;
		box-sizing: border-box;
	}

	/* 商品网格 */
	.product-grid {
		display: flex;
		flex-wrap: wrap;
		padding: 20rpx;
		gap: 20rpx;
		padding-bottom: 60rpx;

		.product-card {
			width: calc(50% - 10rpx);
			background: #fff;
			border-radius: 16rpx;
			overflow: hidden;

			.info {
				padding: 20rpx;

				.title {
					font-size: 28rpx;
					font-weight: 500;
					display: block;
					margin-bottom: 10rpx;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}

				.price {
					color: #f38b11;
					font-size: 32rpx;
					font-weight: bold;
				}
			}
		}
	}

	/* 商品列表模式 */
	.product-list {
		padding: 20rpx;
		padding-bottom: 60rpx;

		.product-item {
			background: #fff;
			border-radius: 16rpx;
			margin-bottom: 20rpx;
			padding: 20rpx;
			display: flex;
			gap: 20rpx;

			.product-img {
				width: 200rpx;
				height: 200rpx;
				border-radius: 12rpx;
				flex-shrink: 0;
			}

			.product-info {
				flex: 1;

				.title {
					font-size: 28rpx;
					font-weight: 500;
					display: block;
					margin-bottom: 12rpx;
				}

				.price {
					color: #f38b11;
					font-size: 32rpx;
					font-weight: bold;
					display: block;
					margin-bottom: 8rpx;
				}

				.sales {
					font-size: 24rpx;
					color: #999;
				}
			}
		}
	}

	/* 钓场服务列表 */
	.service-list {
		padding: 20rpx;

		.service-card {
			background: #fff;
			border-radius: 24rpx;
			margin-bottom: 30rpx;
			display: flex;
			overflow: hidden;
			box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);

			.service-img {
				width: 200rpx;
				height: 200rpx;
				flex-shrink: 0;
			}

			.service-info {
				flex: 1;
				padding: 20rpx;

				.service-name {
					font-size: 32rpx;
					font-weight: bold;
					display: block;
					margin-bottom: 10rpx;
				}

				.service-tags {
					display: flex;
					gap: 12rpx;
					margin-bottom: 12rpx;

					.tag {
						font-size: 22rpx;
						background: #f0f0f0;
						padding: 4rpx 16rpx;
						border-radius: 20rpx;
						color: #666;

						&.end {
							background: #fdd;
							color: #e54d42;
						}
					}
				}

				.service-desc {
					font-size: 26rpx;
					color: #999;
					margin-bottom: 16rpx;
					display: -webkit-box;
					-webkit-box-orient: vertical;
					-webkit-line-clamp: 2;
					overflow: hidden;
				}

				.service-footer {
					display: flex;
					justify-content: space-between;
					align-items: center;

					.price {
						color: #f38b11;
						font-size: 32rpx;
						font-weight: bold;
					}

					.book-btn {
						background: #5d7291;
						color: #fff;
						padding: 8rpx 24rpx;
						border-radius: 30rpx;
						font-size: 26rpx;
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

	.bottom-placeholder {
		height: 40rpx;
		width: 100%;
	}

	/* 回到顶部按钮 */
	.go-top {
		position: fixed;
		bottom: 120rpx;
		right: 30rpx;
		width: 80rpx;
		height: 80rpx;
		background-color: #5d7291;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
		z-index: 99;
		transition: all 0.3s;

		&:active {
			transform: scale(0.9);
			background-color: #4a5a7a;
		}
	}
</style>