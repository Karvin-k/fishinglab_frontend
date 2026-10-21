<template>
	<view class="service-list">
		<u-navbar title="钓场服务管理" :bgColor="'#5d7291'" :title-color="'#fff'" :back-text="'返回'"></u-navbar>

		<!-- 筛选栏 -->
		<view class="filter-bar">
			<view class="filter-tabs">
				<view v-for="tab in statusTabs" :key="tab.value" class="tab"
					:class="{ active: currentStatus === tab.value }" @click="changeStatus(tab.value)">
					{{ tab.label }}
				</view>
			</view>
		</view>

		<scroll-view scroll-y style="height: calc(100vh - 200rpx);" @scrolltolower="loadMore">
			<view class="service-card" v-for="item in filteredList" :key="item.id">
				<u-image width="160rpx" height="160rpx" :src="getImageUrl(item.cover_image)"
					border-radius="12"></u-image>
				<view class="info">
					<view class="name">{{ item.name }}</view>
					<view class="price">¥{{ item.price }}</view>
					<view class="type">{{ item.service_type === 'regular' ? '开钓服务' : '比赛服务' }}</view>
				</view>
				<view class="actions">
					<view class="btn edit" @click="editItem(item)">编辑</view>
					<view class="btn status" :class="{ off: item.status !== 1 }" @click="toggleStatus(item)">
						{{ item.status === 1 ? '下架' : '上架' }}
					</view>
					<view class="btn delete" @click="deleteItem(item)">删除</view>
				</view>
			</view>

			<u-loadmore :status="loadStatus" @loadmore="loadMore" />
			<u-empty v-if="filteredList.length === 0 && !loading" mode="list" text="暂无钓场服务" />
		</scroll-view>
	</view>
</template>

<script>
	import request from '@/common/request.js';
	import {
		uploadFile
	} from '@/common/request.js'; // 用于图片上传

	export default {
		data() {
			return {
				statusTabs: [{
						label: '全部',
						value: null
					},
					{
						label: '已发布',
						value: 1
					},
					{
						label: '已下架',
						value: 2
					}
				],
				currentStatus: null,
				list: [],
				page: 1,
				pageSize: 10,
				total: 0,
				loadStatus: 'loadmore',
				loading: false
			}
		},
		computed: {
			filteredList() {
				if (this.currentStatus === null) return this.list;
				return this.list.filter(item => item.status === this.currentStatus);
			}
		},
		onShow() {
			this.loadList(true);
		},
		methods: {
			getImageUrl(url) {
				if (!url) return '';
				if (url.startsWith('http') || url.startsWith('data:')) return url;
				return uni.$imgUrl(url);
			},
			async loadList(reset = false) {
				if (this.loading) return;
				if (reset) {
					this.page = 1;
					this.list = [];
				}
				this.loading = true;
				this.loadStatus = 'loading';
				try {
					const res = await request({
						url: '/api/merchant/fishing_services',
						data: {
							page: this.page,
							pageSize: this.pageSize
						}
					});
					if (res.data.code === 0) {
						const newList = res.data.data.list;
						if (this.page === 1) {
							this.list = newList;
						} else {
							this.list = [...this.list, ...newList];
						}
						this.total = res.data.data.total;
						this.loadStatus = this.list.length >= this.total ? 'nomore' : 'loadmore';
					} else {
						this.loadStatus = 'loadmore';
					}
				} catch (error) {
					console.error('加载失败', error);
					this.loadStatus = 'loadmore';
				} finally {
					this.loading = false;
				}
			},
			loadMore() {
				if (this.loadStatus === 'nomore' || this.loading) return;
				this.page++;
				this.loadList();
			},
			changeStatus(val) {
				this.currentStatus = val;
			},
			editItem(item) {
				uni.navigateTo({
					url: `/pages/merchant/fishingServiceEdit?id=${item.id}`
				});
			},
			async toggleStatus(item) {
				const newStatus = item.status === 1 ? 2 : 1; // 1上架，2下架（根据后端定义）
				try {
					const res = await request({
						url: `/api/merchant/fishing_services/${item.id}/status`,
						method: 'PATCH',
						data: {
							status: newStatus
						}
					});
					if (res.data.code === 0) {
						item.status = newStatus;
						uni.showToast({
							title: newStatus === 1 ? '已上架' : '已下架',
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
			async deleteItem(item) {
				uni.showModal({
					title: '提示',
					content: '确定删除该服务吗？',
					success: async (modalRes) => {
						if (modalRes.confirm) {
							try {
								const res = await request({	
									url: `/api/merchant/fishing_services/${item.id}`,
									method: 'DELETE'
								});
								if (res.data.code === 0) {
									uni.showToast({
										title: '删除成功',
										icon: 'success'
									});
									this.loadList(true);
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
	.service-list {
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

	.service-card {
		background: #fff;
		margin: 0 30rpx 20rpx;
		padding: 20rpx;
		border-radius: 20rpx;
		display: flex;
		align-items: center;
		gap: 20rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
		overflow: hidden;

		.info {
			flex: 1;
			min-width: 0; // 防止文字溢出

			.name {
				font-size: 30rpx;
				font-weight: 500;
				margin-bottom: 8rpx;
				color: #333;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			.price {
				font-size: 28rpx;
				color: #f38b11;
				font-weight: bold;
				margin-bottom: 8rpx;
			}

			.type {
				font-size: 24rpx;
				color: #999;
			}
		}

		.actions {
			display: flex;
			flex-direction: column;
			gap: 16rpx;
			flex-shrink: 0;

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