<template>
	<view class="product-list">
		<u-navbar title="我的商品" :bgColor="'#5d7291'" :title-color="'#fff'" :back-text="'返回'"></u-navbar>

		<view class="filter-bar">
			<view class="filter-tabs">
				<view v-for="tab in statusTabs" :key="tab.value" class="tab"
					:class="{ active: currentStatus === tab.value }" @click="changeStatus(tab.value)">
					{{ tab.label }}
				</view>
			</view>
		</view>

		<scroll-view scroll-y style="height: calc(100vh - 200rpx);" @scrolltolower="loadMore">
			<view class="product-card" v-for="item in productList" :key="item.id">
				<u-image width="160rpx" height="160rpx" :src="getImageUrl(item.pic_url)" border-radius="12"></u-image>
				<view class="info">
					<view class="name">{{ item.name }}</view>
					<view class="price">¥{{ item.price }}</view>
					<view class="stock">库存：{{ item.stock }}</view>
				</view>
				<view class="actions">
					<view class="btn edit" @click="editProduct(item)">编辑</view>
					<view class="btn status" :class="{ off: item.status !== 1 }" @click="toggleStatus(item)">
						{{ item.status === 1 ? '下架' : '上架' }}
					</view>
					<view class="btn delete" @click="deleteProduct(item)">删除</view>
				</view>
			</view>

			<u-loadmore :status="loadStatus" @loadmore="loadMore" />
			<u-empty v-if="productList.length === 0 && !loading" mode="list" text="暂无商品" />
		</scroll-view>
	</view>
</template>

<script>
	import request from '@/common/request.js';

	export default {
		data() {
			return {
				baseUrl: uni.$baseUrl,
				statusTabs: [{
						label: '全部',
						value: null
					},
					{
						label: '上架',
						value: 1
					},
					{
						label: '下架',
						value: 0
					}
				],
				currentStatus: null,
				productList: [],
				page: 1,
				pageSize: 10,
				total: 0,
				loadStatus: 'loadmore',
				loading: false
			}
		},
		onShow() {
			this.refreshList()
		},
		methods: {
			getImageUrl(url) {
				if (!url) return ''
				if (url.startsWith('http') || url.startsWith('data:')) return url
				return this.baseUrl + url
			},
			refreshList() {
				this.page = 1
				this.productList = []
				this.fetchProducts()
			},
			async fetchProducts() {
				if (this.loading) return;
				this.loading = true;
				try {
					const res = await request({
						url: '/api/merchant/products',
						data: {
							page: this.page,
							pageSize: this.pageSize,
							status: this.currentStatus
						}
					});
					if (res.data.code === 0) {
						const newList = res.data.data.list;
						this.productList = this.page === 1 ? newList : [...this.productList, ...newList];
						this.total = res.data.data.total;
						this.loadStatus = this.productList.length >= this.total ? 'nomore' : 'loadmore';
					}
				} catch (error) {
					console.error(error);
				} finally {
					this.loading = false;
				}
			},
			loadMore() {
				if (this.loadStatus === 'nomore' || this.loading) return
				this.page++
				this.fetchProducts()
			},
			changeStatus(val) {
				this.currentStatus = val
				this.refreshList()
			},
			async toggleStatus(item) {
				const newStatus = item.status === 1 ? 0 : 1;
				try {
					const res = await request({
						url: `/api/merchant/products/${item.id}/status`,
						method: 'PATCH',
						data: {
							status: newStatus
						}
					});
					if (res.data.code === 0) {
						item.status = newStatus;
						uni.showToast({
							title: '状态已更新',
							icon: 'success'
						});
					} else {
						uni.showToast({
							title: res.data.message,
							icon: 'none'
						});
					}
				} catch (error) {
					uni.showToast({
						title: '操作失败',
						icon: 'none'
					});
				}
			},
			editProduct(item) {
				uni.navigateTo({
					url: `/pages/merchant/productEdit?id=${item.id}`
				})
			},
			async deleteProduct(item) {
				uni.showModal({
					title: '提示',
					content: '确定删除该商品吗？',
					success: async (modalRes) => {
						if (modalRes.confirm) {
							try {
								const res = await request({
									url: `/api/merchant/products/${item.id}`,
									method: 'DELETE'
								});
								if (res.data.code === 0) {
									this.productList = this.productList.filter(p => p.id !== item.id);
									this.total--;
									uni.showToast({
										title: '删除成功',
										icon: 'success'
									});
								} else {
									uni.showToast({
										title: res.data.message,
										icon: 'none'
									});
								}
							} catch (error) {
								uni.showToast({
									title: '删除失败',
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
	.product-list {
		background-color: #f5f5f5;
		min-height: 100vh;
	}

	.filter-bar {
		background: #fff;
		padding: 20rpx 30rpx;
		border-bottom: 1rpx solid #eee;
		margin-bottom: 20rpx;

		.filter-tabs {
			display: flex;
			gap: 40rpx;

			.tab {
				font-size: 28rpx;
				color: #666;
				padding-bottom: 10rpx;
				position: relative;

				&.active {
					color: #5d7291;
					font-weight: bold;

					&::after {
						content: '';
						position: absolute;
						bottom: 0;
						left: 0;
						width: 100%;
						height: 4rpx;
						background: #5d7291;
						border-radius: 2rpx;
					}
				}
			}
		}
	}

	.product-card {
		background: #fff;
		margin: 0 30rpx 20rpx;
		padding: 20rpx;
		border-radius: 20rpx;
		display: flex;
		align-items: center;
		gap: 20rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);

		.info {
			flex: 1;

			.name {
				font-size: 30rpx;
				font-weight: 500;
				margin-bottom: 8rpx;
				color: #333;
			}

			.price {
				font-size: 28rpx;
				color: #f38b11;
				font-weight: bold;
				margin-bottom: 8rpx;
			}

			.stock {
				font-size: 24rpx;
				color: #999;
			}
		}

		.actions {
			display: flex;
			flex-direction: column;
			gap: 16rpx;

			.btn {
				font-size: 24rpx;
				padding: 8rpx 20rpx;
				border-radius: 30rpx;
				text-align: center;
				background: #f5f5f5;
				color: #666;
				transition: all 0.2s;

				&:active {
					opacity: 0.7;
				}

				&.edit {
					background: #eef2f9;
					color: #5d7291;
				}

				&.status {
					background: #fff3e8;
					color: #f38b11;

					&.off {
						background: #e8f0fe;
						color: #5d7291;
					}
				}

				&.delete {
					background: #ffefef;
					color: #e54d42;
				}
			}
		}
	}
</style>