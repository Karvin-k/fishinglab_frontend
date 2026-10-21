<template>
	<view class="my-posts-page">
		<u-navbar title="我的动态" :bgColor="'#5d7291'" :title-color="'#fff'" :back-text="'返回'"></u-navbar>

		<scroll-view scroll-y class="post-list" @scrolltolower="loadMore" :refresher-enabled="true"
			:refresher-triggered="refreshing" @refresherrefresh="onRefresh">
			<view v-for="item in postList" :key="item.id" class="post-card">
				<view class="user-row">
					<u-image :src="getImageUrl(item.user_avatar)" width="70rpx" height="70rpx" shape="circle" />
					<text class="name">{{ item.user_name }}</text>
					<text class="time">{{ item.created_at }}</text>
					<view class="delete-btn" @click.stop="deletePost(item.id)">
						<u-icon name="trash" size="28" color="#999" />
					</view>
				</view>
				<view class="content">{{ item.content }}</view>
				<view class="images" v-if="item.images.length">
					<view v-for="(img, idx) in item.images" :key="idx" class="img-item"
						@click="previewImage(item.images, idx)">
						<image :src="getImageUrl(img)" mode="aspectFill"></image>
					</view>
				</view>
				<view class="stats">
					<text>❤️ {{ item.like_count }}</text>
					<text>💬 {{ item.comment_count }}</text>
				</view>
			</view>

			<view v-if="loading" class="loading">加载中...</view>
			<view v-if="!hasMore && postList.length > 0" class="no-more">没有更多了</view>
			<u-empty v-if="!loading && postList.length === 0" mode="data" text="暂无动态" />
		</scroll-view>
	</view>
</template>

<script>
	import request from '@/common/request.js';

	export default {
		data() {
			return {
				postList: [],
				page: 1,
				pageSize: 10,
				hasMore: true,
				loading: false,
				refreshing: false
			}
		},
		onShow() {
			this.loadPosts(true);
		},
		methods: {
			getImageUrl(url) {
				if (!url) return '';
				if (url.startsWith('http') || url.startsWith('data:')) return url;
				return uni.$imgUrl(url);
			},
			getCurrentUserId() {
				let userInfo = this.$store.state.vuex_user_info || uni.getStorageSync('vuex_user_info');
				return userInfo?.id || null;
			},
			async loadPosts(reset = false) {
				if (this.loading) return;
				if (reset) {
					this.page = 1;
					this.postList = [];
					this.hasMore = true;
				}
				this.loading = true;
				const userId = this.getCurrentUserId();
				if (!userId) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					return;
				}
				try {
					const res = await request({
						url: `/api/posts/user/${userId}?page=${this.page}&page_size=${this.pageSize}`,
						method: 'GET'
					});
					if (res.data.code === 0) {
						const newList = res.data.data.list;
						if (reset) this.postList = newList;
						else this.postList = [...this.postList, ...newList];
						this.hasMore = this.postList.length < (res.data.data.total || 0);
					} else {
						uni.showToast({
							title: res.data.message || '加载失败',
							icon: 'none'
						});
					}
				} catch (e) {
					console.error(e);
				} finally {
					this.loading = false;
					this.refreshing = false;
				}
			},
			onRefresh() {
				this.refreshing = true;
				this.loadPosts(true);
			},
			loadMore() {
				if (this.hasMore && !this.loading) {
					this.page++;
					this.loadPosts();
				}
			},
			async deletePost(postId) {
				uni.showModal({
					title: '提示',
					content: '确定删除这条动态吗？',
					success: async (modalRes) => {
						if (modalRes.confirm) {
							try {
								const res = await request({
									url: `/api/posts/${postId}`,
									method: 'DELETE',
									data: {}
								});
								if (res.data.code === 0) {
									uni.showToast({
										title: '删除成功',
										icon: 'success'
									});
									this.postList = this.postList.filter(item => item.id !== postId);
								} else {
									uni.showToast({
										title: res.data.message || '删除失败',
										icon: 'none'
									});
								}
							} catch (e) {
								uni.showToast({
									title: '删除失败',
									icon: 'none'
								});
							}
						}
					}
				});
			},
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
	.my-posts-page {
		background: #f8f8f8;
		min-height: 100vh;
	}

	.post-list {
		padding: 20rpx;
		height: calc(100vh - 88rpx);
	}

	.post-card {
		background: #fff;
		border-radius: 24rpx;
		padding: 30rpx;
		margin-bottom: 20rpx;

		.user-row {
			display: flex;
			align-items: center;
			margin-bottom: 20rpx;

			.name {
				flex: 1;
				font-size: 30rpx;
				font-weight: bold;
				margin-left: 20rpx;
			}

			.time {
				font-size: 24rpx;
				color: #999;
				margin-right: 20rpx;
			}

			.delete-btn {
				padding: 10rpx;
			}
		}

		.content {
			font-size: 28rpx;
			color: #333;
			margin-bottom: 20rpx;
		}

		.images {
			display: flex;
			flex-wrap: wrap;
			gap: 16rpx;

			.img-item {
				width: calc(33.33% - 12rpx);
				height: 200rpx;

				image {
					width: 100%;
					height: 100%;
					border-radius: 12rpx;
				}
			}
		}

		.stats {
			display: flex;
			gap: 30rpx;
			margin-top: 20rpx;
			padding-top: 20rpx;
			border-top: 1rpx solid #f0f0f0;
			font-size: 26rpx;
			color: #999;
		}
	}

	.loading,
	.no-more {
		text-align: center;
		padding: 30rpx;
		font-size: 28rpx;
		color: #999;
	}
</style>