<template>
	<view class="notifications-page">
		<u-navbar title="消息中心" :bgColor="'#5d7291'" :title-color="'#fff'" :back-text="'返回'">
			<view slot="right" class="navbar-right" @click="markAllRead">
				<text class="read-all-text">一键已读</text>
			</view>
		</u-navbar>

		<view class="tabs">
			<view v-for="tab in tabs" :key="tab.value" class="tab-item" :class="{ active: currentTab === tab.value }"
				@click="switchTab(tab.value)">
				{{ tab.label }}
			</view>
		</view>

		<scroll-view scroll-y class="list-scroll" @scrolltolower="loadMore">
			<view v-for="item in list" :key="item.id" class="notification-item" :class="{ unread: !item.is_read }"
				@click="handleClick(item)">
				<view class="icon">
					<u-icon :name="getIconName(item.type)" size="40" :color="getIconColor(item.type)" />
				</view>
				<view class="content">
					<text class="title">{{ item.title }}</text>
					<text class="desc">{{ item.content }}</text>
					<text class="time">{{ item.created_at }}</text>
				</view>
				<view class="badge" v-if="!item.is_read"></view>
			</view>
			<u-loadmore :status="loadStatus" />
			<view v-if="list.length === 0 && !loading" class="empty">暂无消息</view>
		</scroll-view>

	</view>
</template>

<script>
	import request from '@/common/request.js';

	export default {
		data() {
			return {
				tabs: [{
						label: '全部',
						value: 'all'
					},
					{
						label: '互动',
						value: 'interaction'
					},
					{
						label: '订单',
						value: 'order'
					},
					{
						label: '系统',
						value: 'system'
					}
				],
				currentTab: 'all',
				list: [],
				page: 1,
				pageSize: 20,
				total: 0,
				loadStatus: 'loadmore',
				loading: false,
				hasUnread: false
			}
		},
		onLoad() {
			this.loadNotifications();
		},
		methods: {
			getCurrentUserId() {
				let userInfo = this.$store.state.vuex_user_info || uni.getStorageSync('vuex_user_info');
				return userInfo?.id || null;
			},
			getIconName(type) {
				const map = {
					like: 'heart',
					comment: 'chat',
					reply: 'chat',
					follow: 'plus',
					order: 'order',
					system: 'bell',
					pond: 'map'
				};
				return map[type] || 'bell';
			},
			getIconColor(type) {
				const map = {
					like: '#f38b11',
					comment: '#5d7291',
					reply: '#5d7291',
					follow: '#52c41a',
					order: '#f38b11',
					system: '#999',
					pond: '#5d7291'
				};
				return map[type] || '#999';
			},
			async loadNotifications(reset = false) {
				if (this.loading) return;
				if (reset) {
					this.page = 1;
					this.list = [];
				}
				this.loading = true;
				this.loadStatus = 'loading';
				try {
					const res = await request({
						url: `/api/notifications?type=${this.currentTab}&page=${this.page}&page_size=${this.pageSize}`,
						method: 'GET'
					});
					if (res.data.code === 0) {
						const newList = res.data.data.list;
						if (reset) {
							this.list = newList;
						} else {
							this.list = [...this.list, ...newList];
						}
						this.total = res.data.data.total;
						this.hasUnread = this.list.some(item => !item.is_read);
						this.loadStatus = this.list.length >= this.total ? 'nomore' : 'loadmore';
						this.page++;
					} else {
						this.loadStatus = 'loadmore';
					}
				} catch (error) {
					console.error('加载通知失败', error);
					this.loadStatus = 'loadmore';
				} finally {
					this.loading = false;
				}
			},
			loadMore() {
				if (this.loadStatus === 'nomore' || this.loading) return;
				this.loadNotifications();
			},
			switchTab(tab) {
				this.currentTab = tab;
				this.loadNotifications(true);
			},
			async markAllRead() {
				try {
					const res = await request({
						url: '/api/notifications/read',
						method: 'POST',
						data: {
							all: true
						}
					});
					if (res.data.code === 0) {
						this.list.forEach(item => item.is_read = 1);
						this.hasUnread = false;
						uni.showToast({
							title: '已全部标为已读',
							icon: 'success'
						});
						// 更新 tabBar 角标
						uni.removeTabBarBadge({
							index: 4
						});
						// 触发 mine.vue 刷新未读数量
						const pages = getCurrentPages();
						const prevPage = pages[pages.length - 2];
						if (prevPage && prevPage.$vm && prevPage.$vm.loadUnreadCount) {
							prevPage.$vm.loadUnreadCount();
						}
					} else {
						uni.showToast({
							title: res.data.message || '操作失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('标记已读失败', error);
					uni.showToast({
						title: '网络错误',
						icon: 'none'
					});
				}
			},
			async markSingleRead(item) {
				if (item.is_read) return;
				try {
					const res = await request({
						url: '/api/notifications/read',
						method: 'POST',
						data: {
							ids: [item.id]
						}
					});
					if (res.data.code === 0) {
						item.is_read = 1;
						this.hasUnread = this.list.some(i => !i.is_read);
						// 更新未读总数
						const newUnreadCount = this.list.filter(i => !i.is_read).length;
						if (newUnreadCount === 0) {
							uni.removeTabBarBadge({
								index: 4
							});
						} else {
							uni.setTabBarBadge({
								index: 4,
								text: newUnreadCount > 99 ? '99+' : newUnreadCount.toString()
							});
						}
					} else {
						uni.showToast({
							title: res.data.message || '操作失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('标记单条已读失败', error);
					uni.showToast({
						title: '网络错误',
						icon: 'none'
					});
				}
			},
			async handleClick(item) {
				if (!item.is_read) {
					await this.markSingleRead(item);
				}
				// 跳转逻辑
				if (item.related_type === 'post') {
					uni.navigateTo({
						url: `/pages/social/postDetail?postId=${item.related_id}`
					});
				} else if (item.related_type === 'order') {
					uni.navigateTo({
						url: `/pages/shop/orderDetail?orderId=${item.related_id}`
					});
				} else if (item.related_type === 'user') {
					uni.navigateTo({
						url: `/pages/social/userPosts?userId=${item.related_id}`
					});
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.notifications-page {
		background-color: #f8f8f8;
		min-height: 100vh;
	}

	.tabs {
		background: #fff;
		display: flex;
		padding: 0;
		margin-bottom: 20rpx;
		position: sticky;
		top: 0;
		z-index: 10;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.02);

		.tab-item {
			flex: 1;
			text-align: center;
			font-size: 28rpx;
			color: #666;
			padding: 24rpx 0;
			position: relative;
			transition: all 0.2s ease;

			&.active {
				color: #5d7291;
				font-weight: 600;

				// 添加渐变下划线，更现代
				&::after {
					content: '';
					position: absolute;
					bottom: 8rpx;
					left: 50%;
					transform: translateX(-50%);
					width: 48rpx;
					height: 6rpx;
					background: linear-gradient(90deg, #5d7291, #8bb3d1);
					border-radius: 6rpx;
				}
			}

			// 点击反馈（轻微背景变灰）
			&:active {
				background-color: rgba(93, 114, 145, 0.08);
			}
		}
	}

	.list-scroll {
		height: calc(100vh - 88rpx - 100rpx);
	}

	.notification-item {
		display: flex;
		align-items: center;
		background: #fff;
		margin: 20rpx;
		padding: 24rpx;
		border-radius: 20rpx;
		position: relative;

		&.unread {
			background: #fef9f0;
		}

		.icon {
			margin-right: 20rpx;
		}

		.content {
			flex: 1;

			.title {
				font-size: 30rpx;
				font-weight: bold;
				display: block;
				margin-bottom: 8rpx;
			}

			.desc {
				font-size: 26rpx;
				color: #666;
				display: block;
				margin-bottom: 8rpx;
			}

			.time {
				font-size: 24rpx;
				color: #999;
			}
		}

		.badge {
			position: absolute;
			top: 24rpx;
			right: 24rpx;
			width: 16rpx;
			height: 16rpx;
			background: #f38b11;
			border-radius: 50%;
		}
	}

	.empty {
		text-align: center;
		padding: 100rpx 0;
		color: #999;
		font-size: 28rpx;
	}

	.navbar-right {
		padding: 0 20rpx;
		background: #5d7291;
		border-radius: 20rpx;
		margin-right: 20rpx;

		.read-all-text {
			font-size: 28rpx;
			color: #fff;
		}
	}
</style>