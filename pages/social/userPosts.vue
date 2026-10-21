<template>
	<view class="user-posts-container">
		<u-navbar :title="userName + '的动态'" :bgColor="'#5d7291'" :title-color="'#fff'" :back-text="'返回'"></u-navbar>

		<!-- 个人资料卡片 -->
		<view class="profile-card">
		    <view class="profile-row">
		        <u-image :src="getImageUrl(userAvatar)" width="100rpx" height="100rpx" shape="circle" class="avatar" />
		        <view class="profile-info">
		            <view class="info-top">
		                <text class="nickname">{{ userName }}</text>
		                <view class="stats-row">
		                    <view class="stat-badge">
		                        <text class="stat-num">{{ followStats.follow_count }}</text>
		                        <text class="stat-label">关注</text>
		                    </view>
		                    <view class="stat-badge">
		                        <text class="stat-num">{{ followStats.fans_count }}</text>
		                        <text class="stat-label">粉丝</text>
		                    </view>
		                </view>
		            </view>
		            <view v-if="userIsMerchant" class="merchant-entry" @click="goToMerchantShop(userId)">
		                <image src="/static/icons/shop.png" mode="aspectFit" class="shop-icon"></image>
		                <text>商家店铺</text>
		            </view>
		        </view>
		    </view>
		</view>

		<!-- 钓鱼成绩卡片 -->
		<view class="stats-card">
			<view class="card-header">
				<text class="card-title">{{ userName }}的钓鱼成绩</text>
				<text class="card-subtitle">垂钓历程</text>
			</view>
			<view class="stats-grid">
				<view class="stat-item" v-for="stat in userStats" :key="stat.key">
					<text class="stat-value">{{ stat.value }}</text>
					<text class="stat-label">{{ stat.label }}</text>
					<text class="stat-desc">{{ stat.desc }}</text>
				</view>
			</view>
		</view>

		<!-- 动态标题 -->
		<view class="section-title">
			<text>{{ userName }}的动态</text>
		</view>

		<!-- 动态列表 -->
		<scroll-view scroll-y class="feed-list" :refresher-enabled="true" :refresher-triggered="refreshing"
			@refresherrefresh="onRefresh" @scrolltolower="loadMore">
			<view v-if="loading && posts.length === 0" class="loading">加载中...</view>
			<view v-else-if="!loading && posts.length === 0" class="empty">暂无动态</view>
			<view v-else>
				<view v-for="post in posts" :key="post.id" class="post-card">
					<!-- 用户信息行（无关注/删除按钮） -->
					<view class="user-row">
						<view @click="goToUserPosts(post.user_id)">
							<u-image :src="getImageUrl(post.user_avatar)" width="80rpx" height="80rpx" shape="circle" />
						</view>
						<view class="user-info" @click="goToUserPosts(post.user_id)">
							<text class="user-name">{{ post.user_name }}</text>
							<text class="post-time">{{ post.created_at }}</text>
						</view>
					</view>

					<view class="post-content">
						<text class="content-text">{{ post.content }}</text>
						<view v-if="post.tags && post.tags.length" class="tags">
							<text v-for="tag in post.tags" :key="tag" class="tag">#{{ tag }}#</text>
						</view>
						<view v-if="post.location" class="location">
							<u-icon name="map" size="24" color="#999" />
							<text>{{ post.location }}</text>
						</view>
						<view v-if="post.images && post.images.length" class="images-grid"
							:class="'grid-' + post.images.length">
							<image v-for="(img, idx) in post.images" :key="idx" :src="getImageUrl(img)"
								mode="aspectFill" @click="previewImage(post.images, idx)"></image>
						</view>
					</view>

					<view class="action-bar">
						<view class="action-item" @click="toggleLike(post)">
							<u-icon :name="post.liked ? 'heart-fill' : 'heart'" size="36"
								:color="post.liked ? '#f38b11' : '#999'" />
							<text>{{ post.like_count }}</text>
						</view>
						<view class="action-item" @click="openCommentPanel(post)">
							<u-icon name="chat" size="36" color="#999" />
							<text>{{ post.comment_count }}</text>
						</view>
						<view class="action-item" @click="sharePost(post)">
							<u-icon name="share" size="36" color="#999" />
							<text>分享</text>
						</view>
					</view>
				</view>
			</view>
			<view v-if="hasMore && posts.length > 0" class="load-more">加载更多...</view>
			<view v-if="!hasMore && posts.length > 0" class="no-more">没有更多了</view>
		</scroll-view>

		<!-- 评论弹窗 -->
		<u-popup v-model="showCommentPopup" mode="bottom" border-radius="20" height="70vh">
			<view class="comment-popup">
				<view class="popup-header">
					<text>评论列表</text>
					<u-icon name="close" size="32" @click="showCommentPopup = false" />
				</view>
				<scroll-view scroll-y class="comment-list" :style="{ height: '50vh' }">
					<view v-for="comment in comments" :key="comment.id" class="comment-item">
						<u-image :src="getImageUrl(comment.user_avatar)" width="60rpx" height="60rpx" shape="circle" />
						<view class="comment-content">
							<view class="comment-user">
								<text class="name">{{ comment.user_name }}</text>
								<text class="time">{{ comment.created_at }}</text>
							</view>
							<text class="text">{{ comment.content }}</text>
							<view v-if="comment.replies && comment.replies.length" class="replies">
								<view v-for="reply in comment.replies" :key="reply.id" class="reply-item">
									<text class="reply-name">{{ reply.user_name }}</text>
									<text v-if="reply.reply_to_user_name" class="reply-to">回复
										@{{ reply.reply_to_user_name }}：</text>
									<text class="reply-text">{{ reply.content }}</text>
								</view>
							</view>
							<view class="reply-btn" @click="showReplyInput(comment)">回复</view>
						</view>
					</view>
				</scroll-view>
				<view class="comment-input">
					<u-input v-model="commentContent" placeholder="写评论..." border />
					<button @click="submitComment" size="mini" type="primary">发送</button>
				</view>
			</view>
		</u-popup>
	</view>
</template>

<script>
	import request from '@/common/request.js';

	export default {
		data() {
			return {
				userId: null,
				userName: '',
				userAvatar: '',
				followStats: {
					follow_count: 0,
					fans_count: 0
				},
				userStats: [],
				posts: [],
				page: 1,
				pageSize: 10,
				total: 0,
				hasMore: true,
				loading: false,
				refreshing: false,
				showCommentPopup: false,
				currentPost: null,
				comments: [],
				commentContent: '',
				replyTarget: null,
				userIsMerchant: false,
			}
		},
		onLoad(options) {
			if (options.userId) {
				this.userId = options.userId;
				this.loadUserInfo();
				this.loadPosts();
			} else {
				uni.showToast({
					title: '参数错误',
					icon: 'none'
				});
				setTimeout(() => uni.navigateBack(), 1500);
			}
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
			goToUserPosts(userId) {
				if (userId == this.userId) return;
				uni.navigateTo({
					url: `/pages/social/userPosts?userId=${userId}`
				});
			},
			async loadUserInfo() {
				try {
					const res = await request({
						url: `/api/user/info?userId=${this.userId}`,
						method: 'GET'
					});
					if (res.data.code === 0) {
						const user = res.data.data;
						this.userName = user.nickname;
						this.userAvatar = user.avatar || '/static/images/user-avatar.jpg';
						this.userIsMerchant = (user.role === 'merchant'); 
						this.userStats = [{
								key: 'fish_count',
								value: user.fish_count,
								label: '总鱼获',
								desc: '累计钓鱼数量'
							},
							{
								key: 'fishing_count',
								value: user.fishing_count,
								label: '出钓次数',
								desc: '钓鱼活动次数'
							},
							{
								key: 'over_hundred_count',
								value: user.over_hundred_count,
								label: '过百成就',
								desc: '单次过百次数'
							},
							{
								key: 'champion_count',
								value: user.champion_count,
								label: '坑冠荣誉',
								desc: '获得第一名次数'
							}
						];
					}
					const followRes = await request({
						url: `/api/user/follow/stats?user_id=${this.userId}`,
						method: 'GET'
					});
					if (followRes.data.code === 0) this.followStats = followRes.data.data;
				} catch (e) {
					console.error(e);
				}
			},
			async loadPosts(reset = false) {
				if (this.loading) return;
				if (reset) {
					this.page = 1;
					this.posts = [];
					this.hasMore = true;
				}
				this.loading = true;
				try {
					const res = await request({
						url: `/api/posts/user/${this.userId}?page=${this.page}&page_size=${this.pageSize}`,
						method: 'GET'
					});
					if (res.data.code === 0) {
						const newList = res.data.data.list;
						if (reset) this.posts = newList;
						else this.posts = [...this.posts, ...newList];
						this.hasMore = this.posts.length < res.data.data.total;
						this.page++;
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
				if (this.hasMore && !this.loading) this.loadPosts();
			},
			async toggleLike(post) {
				const userId = this.getCurrentUserId();
				if (!userId) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					return;
				}
				const url = post.liked ? `/api/posts/${post.id}/unlike` : `/api/posts/${post.id}/like`;
				try {
					const res = await request({
						url,
						method: 'POST',
						data: {}
					});
					if (res.data.code === 0) {
						post.liked = !post.liked;
						post.like_count = res.data.data.like_count;
					} else {
						uni.showToast({
							title: res.data.message,
							icon: 'none'
						});
					}
				} catch (e) {
					console.error(e);
				}
			},
			previewImage(images, idx) {
				const urls = images.map(img => this.getImageUrl(img));
				uni.previewImage({
					current: urls[idx],
					urls
				});
			},
			sharePost(post) {
				uni.setClipboardData({
					data: `【钓鱼分享】${post.content} —— 来自钓鱼服务平台`,
					success: () => uni.showToast({
						title: '已复制分享内容',
						icon: 'success'
					})
				});
			},
			openCommentPanel(post) {
				this.currentPost = post;
				this.commentContent = '';
				this.replyTarget = null;
				this.showCommentPopup = true;
				this.loadComments(post.id);
			},
			async loadComments(postId) {
				try {
					const res = await request({
						url: `/api/posts/${postId}/comments`,
						method: 'GET'
					});
					if (res.data.code === 0) this.comments = res.data.data.list;
				} catch (e) {
					console.error(e);
				}
			},
			showReplyInput(comment) {
				this.replyTarget = {
					commentId: comment.id,
					replyToUserId: comment.user_id,
					replyToUserName: comment.user_name
				};
				this.commentContent = '';
				uni.showToast({
					title: `回复 ${comment.user_name}`,
					icon: 'none',
					duration: 1000
				});
			},
			async submitComment() {
				if (!this.commentContent.trim()) {
					uni.showToast({
						title: '评论内容不能为空',
						icon: 'none'
					});
					return;
				}
				const data = {
					content: this.commentContent
				};
				if (this.replyTarget) {
					data.parent_id = this.replyTarget.commentId;
					data.reply_to_user_id = this.replyTarget.replyToUserId;
				}
				try {
					const res = await request({
						url: `/api/posts/${this.currentPost.id}/comments`,
						method: 'POST',
						data
					});
					if (res.data.code === 0) {
						await this.loadComments(this.currentPost.id);
						this.commentContent = '';
						this.replyTarget = null;
						this.currentPost.comment_count++;
					} else {
						uni.showToast({
							title: res.data.message,
							icon: 'none'
						});
					}
				} catch (e) {
					console.error(e);
				}
			},
			goToMerchantShop(merchantId) {
			    uni.navigateTo({
			        url: `/pages/shop/merchantShop?merchantId=${merchantId}`
			    });
			}
		}
	}
</script>

<style lang="scss" scoped>
	.user-posts-container {
		background-color: #f8f8f8;
		min-height: 100vh;
	}

	.feed-list {
		height: calc(100vh - 88rpx);
		padding: 0 20rpx;
	}

	.profile-card {
		background: #fff;
		margin: 20rpx;
		padding: 30rpx;
		border-radius: 24rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);

		.profile-row {
			display: flex;
			align-items: center;

			.avatar {
				margin-right: 30rpx;
			}

			.profile-info {
				flex: 1;

				.nickname {
					font-size: 36rpx;
					font-weight: bold;
					display: block;
					margin-bottom: 12rpx;
				}

				.stats-row {
					display: flex;
					gap: 40rpx;

					.stat-badge {
						display: flex;
						flex-direction: column;
						align-items: center;

						.stat-num {
							font-size: 32rpx;
							font-weight: bold;
							color: #333;
						}

						.stat-label {
							font-size: 24rpx;
							color: #999;
						}
					}
				}
			}
		}
	}

	.stats-card {
		background: #fff;
		margin: 20rpx;
		padding: 30rpx;
		border-radius: 24rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);

		.card-header {
			margin-bottom: 30rpx;

			.card-title {
				font-size: 32rpx;
				font-weight: bold;
				display: block;
			}

			.card-subtitle {
				font-size: 24rpx;
				color: #999;
			}
		}

		.stats-grid {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 30rpx;

			.stat-item {
				text-align: center;
				padding: 30rpx 20rpx;
				background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
				border-radius: 16rpx;

				&:nth-child(3),
				&:nth-child(4) {
					background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
				}

				.stat-value {
					font-size: 48rpx;
					font-weight: bold;
					display: block;
				}

				.stat-label {
					font-size: 28rpx;
					color: #666;
					display: block;
				}

				.stat-desc {
					font-size: 22rpx;
					color: #999;
					display: block;
				}
			}
		}
	}

	.section-title {
		margin: 20rpx 20rpx 10rpx;
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		padding-left: 16rpx;
		border-left: 8rpx solid #5d7291;
	}

	.post-card {
		background: #fff;
		border-radius: 24rpx;
		padding: 30rpx;
		margin: 20rpx 45rpx 0 0;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
	}

	.user-row {
		display: flex;
		align-items: center;
		margin-bottom: 20rpx;

		.user-info {
			flex: 1;
			margin-left: 20rpx;

			.user-name {
				font-size: 32rpx;
				font-weight: bold;
				display: block;
			}

			.post-time {
				font-size: 24rpx;
				color: #999;
			}
		}
	}

	.post-content {
		.content-text {
			font-size: 30rpx;
			color: #333;
			line-height: 1.5;
			margin-bottom: 16rpx;
			display: block;
		}

		.tags {
			margin: 16rpx 0;

			.tag {
				font-size: 26rpx;
				color: #5d7291;
				margin-right: 20rpx;
			}
		}

		.location {
			display: flex;
			align-items: center;
			gap: 8rpx;
			margin: 16rpx 0;
			font-size: 26rpx;
			color: #999;
		}

		.images-grid {
			display: flex;
			flex-wrap: wrap;
			gap: 12rpx;
			margin-top: 20rpx;

			image {
				width: calc(33.33% - 8rpx);
				height: 370rpx;
				border-radius: 12rpx;
			}

			&.grid-1 image {
				width: 100%;
			}

			&.grid-2 image {
				width: calc(50% - 6rpx);
			}
		}
	}

	.action-bar {
		display: flex;
		justify-content: space-around;
		margin-top: 30rpx;
		padding-top: 20rpx;
		border-top: 1rpx solid #f0f0f0;

		.action-item {
			display: flex;
			align-items: center;
			gap: 12rpx;
			font-size: 28rpx;
			color: #666;
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

	.comment-popup {
		padding: 30rpx;

		.popup-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding-bottom: 20rpx;
			border-bottom: 1rpx solid #eee;
			font-weight: bold;
		}

		.comment-list {
			padding: 20rpx 0;
		}

		.comment-item {
			display: flex;
			margin-bottom: 30rpx;

			.comment-content {
				flex: 1;
				margin-left: 20rpx;

				.comment-user {
					display: flex;
					align-items: baseline;
					gap: 16rpx;
					margin-bottom: 8rpx;

					.name {
						font-weight: bold;
						font-size: 28rpx;
					}

					.time {
						font-size: 24rpx;
						color: #999;
					}
				}

				.text {
					font-size: 28rpx;
					color: #333;
				}

				.replies {
					background: #f9f9f9;
					border-radius: 12rpx;
					padding: 16rpx;
					margin: 16rpx 0;

					.reply-item {
						font-size: 26rpx;
						margin-bottom: 12rpx;

						.reply-name {
							font-weight: bold;
							color: #5d7291;
						}

						.reply-to {
							color: #999;
						}

						.reply-text {
							color: #333;
						}
					}
				}

				.reply-btn {
					font-size: 24rpx;
					color: #5d7291;
					margin-top: 8rpx;
				}
			}
		}

		.comment-input {
			display: flex;
			gap: 20rpx;
			padding-top: 20rpx;
			border-top: 1rpx solid #eee;

			.u-input {
				flex: 1;
			}

			button {
				width: 140rpx;
				height: 70rpx;
				line-height: 70rpx;
			}
		}
	}
	
	.profile-card {
	    .profile-row {
	        .profile-info {
	            .info-top {
	                display: flex;
	                justify-content: space-between;
	                align-items: center;
	                margin-bottom: 16rpx;
	                .nickname {
	                    font-size: 36rpx;
	                    font-weight: bold;
	                }
	                .stats-row {
	                    display: flex;
	                    gap: 40rpx;
	                    .stat-badge {
	                        text-align: center;
	                        .stat-num {
	                            font-size: 32rpx;
	                            font-weight: bold;
	                        }
	                        .stat-label {
	                            font-size: 24rpx;
	                            color: #999;
	                        }
	                    }
	                }
	            }
	            .merchant-entry {
	                display: flex;
	                align-items: center;
	                gap: 12rpx;
	                background: #f5f5f5;
	                padding: 12rpx 20rpx;
	                border-radius: 60rpx;
	                width: fit-content;
	                .shop-icon {
	                    width: 32rpx;
	                    height: 32rpx;
	                }
	                text {
	                    font-size: 26rpx;
	                    color: #5d7291;
	                }
	            }
	        }
	    }
	}
</style>