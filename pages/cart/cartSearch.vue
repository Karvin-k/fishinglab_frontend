<template>
	<view class="cart-search-page">
		<!-- 头部搜索栏 -->
		<view class="search-header">
			<view class="back-btn" @click="goBack">
				<u-icon name="arrow-left" size="24" color="#333" />
			</view>
			<view class="search-input-wrapper">
				<input class="search-input" v-model="keyword" placeholder="搜索购物车中的商品" confirm-type="search"
					@confirm="doSearch" />
			</view>
			<view class="search-btn" @click="doSearch">搜索</view>
		</view>

		<!-- 滚动内容 -->
		<scroll-view scroll-y class="content-scroll">
			<!-- 搜索历史 -->
			<view class="history-section" v-if="searchHistory.length > 0">
				<view class="section-header">
					<text class="section-title">搜索历史</text>
					<text class="clear-all" @click="clearAllHistory">清空全部</text>
				</view>
				<view class="history-list">
					<view class="history-item" v-for="(item, index) in searchHistory" :key="index">
						<text class="history-keyword" @click="searchKeyword(item)">{{ item }}</text>
						<u-icon name="close" size="16" color="#999" @click="deleteHistoryItem(index, $event)" />
					</view>
				</view>
			</view>

			<!-- 猜你想找（基于购物车商品提取的关键词） -->
			<view class="guess-section" v-if="guessKeywords.length > 0">
				<view class="section-header">
					<text class="section-title">猜你想找</text>
				</view>
				<view class="guess-list">
					<view class="guess-item" v-for="(item, index) in guessKeywords" :key="index"
						@click="searchKeyword(item)">
						{{ item }}
					</view>
				</view>
			</view>

			<view class="bottom-placeholder"></view>
		</scroll-view>
	</view>
</template>

<script>
	import request from '@/common/request.js';
	export default {
		data() {
			return {
				keyword: '',
				searchHistory: [],
				cartList: [], // 购物车数据
				guessKeywords: [] // 推荐关键词
			}
		},
		onLoad() {
			this.loadSearchHistory()
			this.loadCartData()
		},
		methods: {
			getCurrentUserId() {
				let userInfo = this.$store.state.vuex_user_info || uni.getStorageSync('vuex_user_info')
				return userInfo?.id || null
			},
			// 加载购物车数据（用于生成推荐关键词）
			async loadCartData() {
				if (!this.getCurrentUserId()) return;
				try {
					const res = await request({
						url: uni.$baseUrl + '/api/cart/list',
						method: 'GET'
					});
					if (res.data.code === 0) {
						this.cartList = res.data.data;
						this.generateGuessKeywords();
					}
				} catch (e) {
					console.error('加载购物车失败', e);
				}
			},
			// 根据购物车商品生成猜你想找（提取商品名称中的常见词）
			generateGuessKeywords() {
				const words = new Set()
				this.cartList.forEach(item => {
					// 兼容商品和服务：优先取 product_name，否则取 service_name
					const name = item.product_name || item.service_name || ''
					if (!name) return
					// 简单分词（按空格、中英文混合）
					const parts = name.split(/[\s\u4e00-\u9fa5]+/).filter(p => p.length > 1)
					parts.forEach(part => words.add(part))
					// 也添加原名称（可能太长，但前几个字符）
					if (name.length > 4) words.add(name.slice(0, 4))
				})
				this.guessKeywords = Array.from(words).slice(0, 8)
			},
			getStorageKey() {
				const userId = this.getCurrentUserId()
				return `cart_search_history_${userId || 'guest'}`
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
			deleteHistoryItem(index, event) {
				if (event && typeof event.stopPropagation === 'function') {
					event.stopPropagation()
				}
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
				uni.navigateTo({
					url: `/pages/cart/cartSearchResult?keyword=${encodeURIComponent(this.keyword)}`
				})
			},
			goBack() {
				uni.navigateBack()
			}
		}
	}
</script>

<style lang="scss" scoped>
	page,
	.cart-search-page {
		width: 100%;
		overflow-x: hidden;
	}

	.content-scroll {
		width: 100%;
		box-sizing: border-box;

		.history-list,
		.guess-list {
			flex-wrap: wrap;
			width: 100%;

			.history-item,
			.guess-item {
				max-width: calc(50% - 20rpx);
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
		}
	}

	.cart-search-page {
		background-color: #fff;
		height: 100vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.search-header {
		display: flex;
		align-items: center;
		padding: 20rpx 30rpx;
		background-color: #fff;
		border-bottom: 1rpx solid #f0f0f0;

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
		}
	}

	.content-scroll {
		flex: 1;
		padding: 0 30rpx;
	}

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

	.history-list,
	.guess-list {
		display: flex;
		flex-wrap: wrap;
		gap: 20rpx;
	}

	.history-item,
	.guess-item {
		background: #f5f5f5;
		padding: 12rpx 24rpx;
		border-radius: 60rpx;
		font-size: 28rpx;
		color: #333;
		display: flex;
		align-items: center;

		.history-keyword {
			margin-right: 16rpx;
		}
	}

	.guess-item {
		background: #f0f0f0;
		color: #5d7291;
	}

	.bottom-placeholder {
		height: 40rpx;
	}
</style>