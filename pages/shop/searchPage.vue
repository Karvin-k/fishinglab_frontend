<template>
	<view class="search-page">
		<!-- 自定义头部 -->
		<view class="search-header">
			<view class="back-btn" @click="goBack">
				<u-icon name="arrow-left" size="24" color="#333" />
			</view>
			<view class="search-input-wrapper">
				<input class="search-input" v-model="keyword" placeholder="搜索商品" confirm-type="search"
					@confirm="doSearch" />
			</view>
			<view class="search-btn" @click="doSearch">搜索</view>
		</view>

		<!-- 滚动内容区域（动态高度） -->
		<scroll-view scroll-y class="content-scroll" :style="{ height: scrollHeight + 'px' }">
			<!-- 搜索历史 -->
			<view class="history-section" v-if="searchHistory.length > 0">
				<view class="section-header">
					<text class="section-title">搜索历史</text>
					<text class="clear-all" @click="clearAllHistory">清空全部</text>
				</view>
				<view class="history-list">
					<view class="history-item" v-for="(item, index) in searchHistory" :key="index">
						<text class="history-keyword" @click="searchKeyword(item)">{{ item }}</text>
						<view @click.stop="deleteHistoryItem(index)">
							<u-icon name="close" size="16" color="#999" />
						</view>
					</view>
				</view>
			</view>

			<!-- 热门搜索 -->
			<view class="hot-section">
				<view class="section-header">
					<text class="section-title">热门搜索</text>
				</view>
				<view class="hot-list">
					<view class="hot-item" v-for="(item, index) in hotKeywords" :key="index"
						@click="searchKeyword(item)">
						{{ item }}
					</view>
				</view>
			</view>

			<!-- 热门推荐商品 -->
			<view class="recommend-section" v-if="hotProducts.length > 0">
				<view class="section-header">
					<text class="section-title">热门推荐</text>
				</view>
				<view class="product-grid">
					<view class="product-card" v-for="item in hotProducts" :key="item.id" @click="goDetail(item)">
						<!-- <u-image width="100%" height="300rpx" :src="getImageUrl(item.pic_url)" mode="aspectFill" ></u-image> -->
						<image style="width:100%; height:300rpx" mode="aspectFill" :src="getImageUrl(item.pic_url)">
						</image>
						<view class="info">
							<text class="title">{{ item.name }}</text>
							<text class="price">¥{{ item.price }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 底部占位 -->
			<view class="bottom-placeholder"></view>
		</scroll-view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				keyword: '',
				searchHistory: [],
				merchantId: null,
				source: 'shop',
				hotKeywords: ['鱼竿', '鱼饵', '钓箱', '鱼线', '鱼钩', '浮漂', '抄网', '钓鱼椅'],
				hotProducts: [],
				scrollHeight: 0,
			}
		},
		onLoad(options) {
			if (options.merchantId) {
				this.merchantId = options.merchantId
				this.source = 'merchant'
			} else if (options.source) {
				this.source = options.source
			}
			this.loadSearchHistory()
			this.fetchHotProducts()
			this.calcScrollHeight()
		},
		onReady() {
			this.calcScrollHeight()
		},
		methods: {
			getImageUrl(url) {
				if (!url) return ''
				if (url.startsWith('http') || url.startsWith('data:')) return url
				return uni.$imgUrl(url);},
			getCurrentUserId() {
				let userInfo = this.$store.state.vuex_user_info || uni.getStorageSync('vuex_user_info')
				return userInfo?.id || null
			},
			getStorageKey() {
			    const userId = this.getCurrentUserId();
			    const base = `shop_search_history_${userId || 'guest'}`;
			    if (this.merchantId) {
			        return `${base}_merchant_${this.merchantId}`;
			    }
			    return base;
			},
			loadSearchHistory() {
				const key = this.getStorageKey()
				const history = uni.getStorageSync(key) || []
				this.searchHistory = history
			},
			saveSearchHistory() {
				const key = this.getStorageKey()
				uni.setStorageSync(key, this.searchHistory)
			},
			addToHistory(keyword) {
				if (!keyword) return
				let history = [...this.searchHistory]
				history = history.filter(item => item !== keyword)
				history.unshift(keyword)
				if (history.length > 10) history.pop()
				this.searchHistory = history
				this.saveSearchHistory()
			},
			deleteHistoryItem(index) {
				this.searchHistory.splice(index, 1)
				this.saveSearchHistory()
			},
			clearAllHistory() {
				uni.showModal({
					title: '提示',
					content: '确定清空所有搜索历史吗？',
					success: (res) => {
						if (res.confirm) {
							this.searchHistory = []
							this.saveSearchHistory()
						}
					}
				})
			},
			searchKeyword(keyword) {
				this.keyword = keyword
				this.doSearch()
			},
			doSearch() {
				if (!this.keyword.trim()) {
					uni.showToast({
						title: '请输入搜索词',
						icon: 'none'
					})
					return
				}
				this.addToHistory(this.keyword.trim())
				let url = `/pages/shop/searchResult?keyword=${encodeURIComponent(this.keyword)}`
				if (this.merchantId) {
					url += `&merchantId=${this.merchantId}`
				}
				uni.navigateTo({
					url
				})
			},
			goBack() {
				uni.navigateBack()
			},
			goDetail(item) {
				const productJson = encodeURIComponent(JSON.stringify(item))
				uni.navigateTo({
					url: `/pages/shop/detail?product=${productJson}`
				})
			},
			async fetchHotProducts() {
				try {
					let url = uni.$baseUrl + '/api/products/hot'
					if (this.merchantId) {
						url += `?merchantId=${this.merchantId}`
					}
					const res = await uni.request({
						url,
						method: 'GET'
					})
					if (res[1].data.code === 0) {
						this.hotProducts = res[1].data.data
					} else {
						console.error('获取热门商品失败', res[1].data.message)
					}
				} catch (error) {
					console.error('请求热门商品失败', error)
				}
			},
			calcScrollHeight() {
				const systemInfo = uni.getSystemInfoSync()
				const windowHeight = systemInfo.windowHeight
				const query = uni.createSelectorQuery().in(this)
				query.select('.search-header').boundingClientRect()
				query.exec((res) => {
					const headerHeight = (res[0] && res[0].height) || 120
					this.scrollHeight = windowHeight - headerHeight - 20
					if (this.scrollHeight < 0) this.scrollHeight = 0
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	page,
	.search-page {
		width: 100%;
		overflow-x: hidden;
	}

	.search-page {
		background-color: #fff;
		height: 100vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	/* 自定义头部 */
	.search-header {
		display: flex;
		align-items: center;
		padding: 20rpx 30rpx;
		background-color: #fff;
		border-bottom: 1rpx solid #f0f0f0;
		box-sizing: border-box;

		.back-btn {
			margin-right: 20rpx;
			width: 60rpx;
			height: 60rpx;
			display: flex;
			align-items: center;
			justify-content: center;
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
		}
	}

	/* 滚动区域（动态高度） */
	.content-scroll {
		flex: 1;
		padding: 0 30rpx;
		width: 100%;
		box-sizing: border-box;
	}

	/* 通用区块头部 */
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin: 30rpx 0 20rpx;

		.section-title {
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
		}

		.clear-all {
			font-size: 26rpx;
			color: #999;
		}
	}

	/* 搜索历史 */
	.history-list {
		display: flex;
		flex-wrap: wrap;
		gap: 20rpx;

		.history-item {
			display: flex;
			align-items: center;
			background: #f5f5f5;
			padding: 12rpx 24rpx;
			border-radius: 60rpx;
			max-width: calc(50% - 20rpx);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;

			.history-keyword {
				font-size: 28rpx;
				color: #333;
				margin-right: 16rpx;
			}
		}
	}

	/* 热门搜索 */
	.hot-list {
		display: flex;
		flex-wrap: wrap;
		gap: 20rpx;

		.hot-item {
			background: #f5f5f5;
			padding: 12rpx 24rpx;
			border-radius: 60rpx;
			font-size: 28rpx;
			color: #666;
			max-width: calc(50% - 20rpx);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}

	/* 热门推荐商品网格 */
	.recommend-section {
		margin-top: 20rpx;
		margin-bottom: 40rpx;
	}

	.product-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 20rpx;

		.product-card {
			width: calc(50% - 10rpx);
			background: #fff;
			border-radius: 16rpx;
			overflow: hidden;
			box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
			box-sizing: border-box;

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

	/* 底部占位 */
	.bottom-placeholder {
		height: 40rpx;
		width: 100%;
	}
</style>