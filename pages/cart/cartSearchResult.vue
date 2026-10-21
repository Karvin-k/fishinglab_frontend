<template>
	<view class="result-page">
		<!-- 头部（可复用搜索栏） -->
		<view class="result-header">
			<view class="back-btn" @click="goBack">
				<u-icon name="arrow-left" size="24" color="#333" />
			</view>
			<view class="search-input-wrapper">
				<input class="search-input" v-model="keyword" placeholder="搜索购物车中的商品" confirm-type="search"
					@confirm="doSearch" />
			</view>
			<view class="search-btn" @click="doSearch">搜索</view>
		</view>

		<!-- 搜索结果列表 -->
		<scroll-view scroll-y class="result-list" v-if="filteredItems.length > 0">
			<view class="result-item" v-for="item in filteredItems" :key="item.id" @click="goToDetail(item)">
				<u-image :src="getImageUrl(item.product_image || item.service_image)" width="160rpx" height="160rpx"
					border-radius="12" class="item-img" />
				<view class="item-info">
					<text class="item-name">{{ item.product_name || item.service_name }}</text>
					<!-- 商品规格（仅商品有） -->
					<text
						v-if="item.item_type === 'product' && item.selected_attributes && item.selected_attributes.length"
						class="item-spec">
						规格：{{ item.selected_attributes.join(' + ') }}
					</text>
					<!-- 服务预约信息（仅服务有） -->
					<text v-if="item.item_type === 'service'" class="item-spec">
						预约：{{ item.service_date }} {{ item.service_time_slot }} 人数：{{ item.participant_count }}
					</text>
					<text class="item-price">¥{{ item.price }}</text>
					<text class="item-quantity">数量：{{ item.quantity }}</text>
				</view>
			</view>
		</scroll-view>

		<view v-else-if="!loading" class="empty">
			<u-empty mode="search" text="未找到相关商品" />
		</view>
		<view v-if="loading" class="loading">加载中...</view>
	</view>
</template>

<script>
	import request from '@/common/request.js';
	export default {
		data() {
			return {
				keyword: '',
				cartList: [],
				loading: true
			}
		},
		computed: {
			filteredItems() {
				if (!this.keyword) return []
				const kw = this.keyword.toLowerCase()
				return this.cartList.filter(item => {
					const name = (item.product_name || item.service_name || '').toLowerCase()
					return name.includes(kw)
				})
			}
		},
		onLoad(options) {
			if (options.keyword) {
				this.keyword = decodeURIComponent(options.keyword)
			}
			this.loadCartData()
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
			async loadCartData() {
			    const userId = this.getCurrentUserId();
			    if (!userId) {
			        this.cartList = [];
			        this.loading = false;
			        return;
			    }
			    try {
			        const res = await request({
			            url: uni.$baseUrl + '/api/cart/list',
			            method: 'GET'
			        });
			        // 注意：request 返回的是 { data, statusCode, ... }
			        if (res.data.code === 0) {
			            this.cartList = res.data.data.map(item => {
			                let attrs = item.selected_attributes;
			                if (typeof attrs === 'string') {
			                    try { attrs = JSON.parse(attrs); } catch(e) { attrs = []; }
			                }
			                if (!Array.isArray(attrs)) attrs = [];
			                return { ...item, selected_attributes: attrs };
			            });
			        }
			    } catch (e) {
			        console.error('加载购物车失败', e);
			    } finally {
			        this.loading = false;
			    }
			},
			doSearch() {
				if (!this.keyword.trim()) return
				// 刷新当前页面（重新加载购物车并过滤）
				this.loadCartData()
			},
			goBack() {
				uni.navigateBack()
			},
			goToDetail(item) {
				if (item.item_type === 'service') {
					uni.navigateTo({
						url: `/pages/shop/pond-detail?id=${item.service_id}`
					})
				} else {
					uni.navigateTo({
						url: `/pages/shop/detail?id=${item.product_id}`
					})
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	page,
	.result-page {
		width: 100%;
		overflow-x: hidden;
		background-color: #f8f8f8;
		height: 100vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.result-list {
		width: 100%;

		.result-item {
			width: 94%;
			box-sizing: border-box;
		}
	}


	.result-header {
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

	.result-list {
		flex: 1;
		padding: 20rpx;
	}

	.result-item {
		background: #fff;
		border-radius: 20rpx;
		padding: 24rpx;
		margin-bottom: 20rpx;
		display: flex;
		align-items: center;

		.item-img {
			margin-right: 20rpx;
		}

		.item-info {
			flex: 1;

			.item-name {
				font-size: 30rpx;
				font-weight: bold;
				display: block;
				margin-bottom: 8rpx;
			}

			.item-spec {
				font-size: 24rpx;
				color: #999;
				margin-bottom: 8rpx;
				display: block;
			}

			.item-price {
				font-size: 32rpx;
				color: #f38b11;
				font-weight: bold;
			}

			.item-quantity {
				font-size: 24rpx;
				color: #666;
				margin-top: 8rpx;
				display: block;
			}
		}
	}

	.empty,
	.loading {
		text-align: center;
		padding-top: 200rpx;
	}
</style>