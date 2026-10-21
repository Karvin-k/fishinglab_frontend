<template>
	<view class="ref-search-page">
		<!-- 导航栏 -->
		<u-navbar title="引用内容" :bgColor="'#5d7291'" :title-color="'#fff'" :back-text="'返回'" />

		<!-- 分类切换栏 -->
		<view class="category-tabs">
			<view class="tab-item" :class="{ active: activeType === 'product' }" @click="activeType = 'product'">
				商品
			</view>
			<view class="tab-item" :class="{ active: activeType === 'service' }" @click="activeType = 'service'">
				钓场
			</view>
		</view>

		<!-- 搜索框 -->
		<view class="search-box">
			<u-icon name="search" size="18" color="#999" />
			<input class="search-input" v-model="keyword" placeholder="搜索名称" confirm-type="search" @confirm="search" />
		</view>

		<!-- 结果列表 -->
		<scroll-view scroll-y class="result-list" v-if="!loading">
			<view v-for="item in list" :key="item.id" class="result-card"
				:class="{ selected: selectedItem && selectedItem.id === item.id }" @click="selectItem(item)">
				<image class="cover" :src="getImageUrl(item.pic_url || item.cover_image)" mode="aspectFill" />
				<view class="info">
					<text class="name">{{ item.name }}</text>
					<view class="meta">
						<text class="price">¥{{ item.price }}</text>
						<text class="type" :class="{'type-regular': item.service_type === 'regular', 'type-competition': item.service_type === 'competition'}">
						    {{ item.service_type === 'regular' ? '开钓服务' : (item.service_type === 'competition' ? '比赛服务' : '') }}
						</text>
					</view>
					<view v-if="item.desc || item.details" class="desc u-line-2">{{ item.desc || item.details }}</view>
				</view>
			</view>
			<view v-if="list.length === 0 && !loading" class="empty">
				<u-empty mode="search" text="暂无相关结果" />
			</view>
			<view v-if="hasMore && list.length > 0" class="load-more" @click="loadMore">
				加载更多
			</view>
			<view v-else-if="!hasMore && list.length > 0" class="no-more">
				没有更多了
			</view>
		</scroll-view>
		<view v-if="loading" class="loading">
			<u-loading mode="circle" size="40" />
		</view>

		<view class="confirm-btn-wrapper" v-if="selectedItem">
			<button class="confirm-btn" @click="confirmSelect">确认引用</button>
		</view>
	</view>
</template>

<script>
	import request from '@/common/request.js';

	export default {
		data() {
			return {
				activeType: 'product', // 'product' 或 'service'
				keyword: '',
				list: [],
				page: 1,
				pageSize: 10,
				hasMore: true,
				loading: false,
				selectedItem: null,
			};
		},
		mounted() {
			this.search();
		},
		methods: {
			getImageUrl(url) {
				if (!url) return '';
				if (url.startsWith('http') || url.startsWith('data:')) return url;
				return uni.$imgUrl(url);
			},
			async search(reset = true) {
				if (reset) {
					this.page = 1;
					this.list = [];
					this.hasMore = true;
				}
				if (this.loading) return;
				this.loading = true;
				try {
					let url, data;
					if (this.activeType === 'product') {
						url = '/api/products/search';
						data = {
							keyword: this.keyword,
							page: this.page,
							pageSize: this.pageSize
						};
					} else {
						url = '/api/fishing/services/search';
						data = {
							keyword: this.keyword,
							page: this.page,
							pageSize: this.pageSize
						};
					}
					const res = await request({
						url,
						method: 'GET',
						data
					});
					if (res.data.code === 0) {
						const newList = res.data.data.list || res.data.data;
						if (reset) {
							this.list = newList;
						} else {
							this.list = [...this.list, ...newList];
						}
						this.hasMore = newList.length === this.pageSize;
						if (this.hasMore) this.page++;
					} else {
						uni.showToast({
							title: res.data.message || '搜索失败',
							icon: 'none'
						});
					}
				} catch (err) {
					console.error(err);
					uni.showToast({
						title: '网络错误',
						icon: 'none'
					});
				} finally {
					this.loading = false;
				}
			},
			loadMore() {
				if (this.hasMore && !this.loading) {
					this.search(false);
				}
			},
			// 只记录选中状态，不立即返回
			selectItem(item) {
				this.selectedItem = item;
			},
			// 确认引用方法
			confirmSelect() {
			    if (!this.selectedItem) return;
			    const refData = {
			        type: this.activeType,
			        id: this.selectedItem.id,
			        name: this.selectedItem.name,
			        price: this.selectedItem.price,
			        image: this.selectedItem.pic_url || this.selectedItem.cover_image,
			        service_type: this.selectedItem.service_type,
			    };
			    // 使用全局事件传递数据
			    uni.$emit('refSelected', refData);
			    uni.navigateBack();
			}
		},
		watch: {
			activeType() {
				this.search();
			},
			keyword(val) {
				// 防抖（可选）
				if (this.timer) clearTimeout(this.timer);
				this.timer = setTimeout(() => {
					this.search();
				}, 300);
			},
		},
	};
</script>

<style lang="scss" scoped>
	.ref-search-page {
		background-color: #f8f8f8;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	/* 分类切换栏 */
	.category-tabs {
		display: flex;
		background: #fff;
		padding: 20rpx 0;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.02);

		.tab-item {
			flex: 1;
			text-align: center;
			font-size: 30rpx;
			color: #666;
			padding: 16rpx 0;
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

	/* 搜索框 */
	.search-box {
		display: flex;
		align-items: center;
		background: #fff;
		margin: 0 30rpx 20rpx;
		padding: 16rpx 24rpx;
		border-radius: 60rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);

		.search-input {
			flex: 1;
			font-size: 28rpx;
			margin-left: 16rpx;
		}
	}

	/* 结果列表 */
	.result-list {
		flex: 1;
		padding: 0 30rpx;
	}

	.result-card {
		display: flex;
		background: #fff;
		border-radius: 24rpx;
		width: 690rpx;
		padding: 24rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);
		transition: all 0.2s;

		&:active {
			transform: scale(0.98);
		}

		.cover {
			width: 160rpx;
			height: 160rpx;
			border-radius: 16rpx;
			margin-right: 24rpx;
			flex-shrink: 0;
			background: #f0f0f0;
		}

		.info {
			flex: 1;

			.name {
				font-size: 30rpx;
				font-weight: bold;
				color: #1a1a1a;
				display: block;
				margin-bottom: 8rpx;
			}

			.meta {
				display: flex;
				align-items: baseline;
				gap: 20rpx;
				margin-bottom: 12rpx;

				.price {
					color: #f38b11;
					font-size: 32rpx;
					font-weight: bold;
				}
			}

			.desc {
				font-size: 26rpx;
				color: #666;
				line-height: 1.4;
			}
		}
	}

	.loading,
	.empty,
	.load-more,
	.no-more {
		text-align: center;
		padding: 40rpx;
		font-size: 28rpx;
		color: #999;
	}

	.load-more {
		color: #5d7291;
	}

	.result-card.selected {
		border: 2rpx solid #5d7291;
		background: #f0f4f9;
	}

	/* 底部确认按钮样式 */
	.confirm-btn-wrapper {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: #fff;
		padding: 20rpx 30rpx;
		border-top: 1rpx solid #eee;

		.confirm-btn {
			background: #f38b11;
			color: #fff;
			border-radius: 60rpx;
			height: 80rpx;
			line-height: 80rpx;
			font-size: 32rpx;
			border: none;
		}
	}
	
	.type {
	    font-size: 24rpx;
	    padding: 4rpx 16rpx;
	    border-radius: 30rpx;
	    display: inline-block;
	}
	
	.type-regular {
	    background-color: #5d7291;
	    color: #fff;
	}
	
	.type-competition {
	    background-color: #f38b11;
	    color: #fff;
	}
</style>