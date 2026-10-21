<template>
	<view class="feed-container">
		<!-- 顶部分类栏 -->
		<view class="tabs-bar">
			<view v-for="tab in tabs" :key="tab.value" class="tab-item" :class="{ active: currentTab === tab.value }"
				@click="switchTab(tab.value)">
				{{ tab.label }}
			</view>
		</view>

		<!-- 我的专属：个人资料卡片 -->
		<view v-if="currentTab === 'mine'" class="profile-card">
		    <view class="profile-row">
		        <u-image :src="getImageUrl(userAvatar)" width="100rpx" height="100rpx" shape="circle" class="avatar" />
		        <view class="profile-info">
		            <view class="info-top">
		                <text class="nickname">{{ userNickname }}</text>
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
		            <view v-if="isMerchant" class="merchant-entry" @click="goToMyShop">
		                <image src="/static/icons/shop.png" mode="aspectFit" class="shop-icon"></image>
		                <text>我的店铺</text>
		            </view>
		        </view>
		    </view>
		</view>

		<!-- 钓鱼成绩卡片 -->
		<view v-if="currentTab === 'mine'" class="stats-card">
			<view class="card-header">
				<text class="card-title">钓鱼成绩</text>
				<text class="card-subtitle">我的垂钓历程</text>
			</view>
			<view class="stats-grid">
				<view class="stat-item" v-for="stat in fishingStats" :key="stat.key">
					<text class="stat-value">{{ stat.value }}</text>
					<text class="stat-label">{{ stat.label }}</text>
					<text class="stat-desc">{{ stat.desc }}</text>
				</view>
			</view>
		</view>

		<!-- 我的动态标题 -->
		<view v-if="currentTab === 'mine'" class="section-title">
			<text>我的动态</text>
		</view>

		<!-- 动态列表 -->
		<scroll-view scroll-y class="feed-list" :refresher-enabled="true" :refresher-triggered="refreshing"
			@refresherrefresh="onRefresh" @scrolltolower="loadMore">
			<view v-if="loading && posts.length === 0" class="loading">加载中...</view>
			<view v-else-if="!loading && posts.length === 0" class="empty">
				<text v-if="currentTab === 'follow'">暂无关注的人，去寻找喜欢的用户吧～</text>
				<text v-else-if="currentTab === 'mine'">暂无动态，快去发布第一条吧～</text>
				<text v-else>暂无动态，快来发布第一条吧～</text>
			</view>
			<view v-else>
				<view v-for="post in posts" :key="post.id" class="post-card">
					<!-- 用户信息行 -->
					<view class="user-row">
						<view @click="goToUserPosts(post.user_id)">
							<u-image :src="getImageUrl(post.user_avatar)" width="80rpx" height="80rpx" shape="circle" />
						</view>
						<view class="user-info" @click="goToUserPosts(post.user_id)">
							<text class="user-name">{{ post.user_name }}</text>
							<text class="post-time">{{ post.created_at }}</text>
						</view>
						<!-- 关注/取消关注按钮 -->
						<view v-if="currentTab !== 'mine' && post.user_id !== currentUserId" class="follow-btn"
							:class="{ followed: post.is_following }" @click.stop="toggleFollow(post)">
							<text>{{ post.is_following ? '已关注' : '关注' }}</text>
						</view>
						<view v-if="currentTab === 'mine' && post.user_id === currentUserId" class="delete-btn"
							@click.stop="deletePost(post.id)">
							<u-icon name="trash" size="32" color="#ccc" />
						</view>
					</view>

					<!-- 动态内容 -->
					<view class="post-content" @click="goToPostDetail(post.id)">
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

					<!-- 互动栏 -->
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

		<!-- 悬浮发布按钮 -->
		<view class="fab" @click="goToPublish">
			<u-icon name="plus" size="40" color="#fff" />
		</view>

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
								<view style="display: flex; align-items: center; gap: 12rpx;">
									<text class="name">{{ comment.user_name }}</text>
									<text v-if="comment.user_id === currentPost.user_id" class="author-badge">作者</text>
								</view>
								<text class="time">{{ comment.created_at }}</text>
							</view>
							<text class="text">{{ comment.content }}</text>
							<!-- 回复列表 -->
							<view v-if="comment.replies && comment.replies.length" class="replies">
								<view v-for="reply in comment.replies" :key="reply.id" class="reply-item">
									<view style="display: flex; align-items: center; gap: 8rpx; flex-wrap: wrap;">
										<text class="reply-name">{{ reply.user_name }}</text>
										<text v-if="reply.user_id === currentPost.user_id"
											class="author-badge small">作者</text>
										<text v-if="reply.reply_to_user_name" class="reply-to">回复
											@{{ reply.reply_to_user_name }}：</text>
									</view>
									<text class="reply-text">{{ reply.content }}</text>
								</view>
							</view>
							<view class="reply-btn"
								@click="prepareReply(comment.id, comment.user_id, comment.user_name)">回复</view>
						</view>
					</view>
				</scroll-view>
				<view class="comment-input">
					<u-input ref="commentInput" v-model="commentContent"
						:placeholder="replyTarget ? `回复 @${replyTarget.replyToUserName}：` : '写评论...'" border
						@confirm="submitComment" />
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
				tabs: [{
						label: '最新',
						value: 'latest'
					},
					{
						label: '热门',
						value: 'hot'
					},
					{
						label: '关注',
						value: 'follow'
					},
					{
						label: '我的',
						value: 'mine'
					}
				],
				currentTab: 'latest',
				posts: [],
				page: 1,
				pageSize: 10,
				hasMore: true,
				loading: false,
				refreshing: false,
				currentUserId: null,
				myProfile: null,
				followStats: {
					follow_count: 0,
					fans_count: 0
				},
				fishingStats: [],
				showCommentPopup: false,
				currentPost: null,
				comments: [],
				commentContent: '',
				replyTarget: null,
				userAvatar: '',
				userNickname: '',
				isMerchant: false,
			}
		},
		computed: {
			baseUrl() {
				return uni.$baseUrl;
			}
		},
		onLoad() {
			this.currentUserId = this.getCurrentUserId();
			this.loadMyProfile();
			this.loadPosts();
		},
		methods: {
			getImageUrl(url) {
				if (!url) return '';
				if (url.startsWith('http') || url.startsWith('data:')) return url;
				return this.baseUrl + url;
			},
			goToMyShop() {
			    if (this.currentUserId) {
			        uni.navigateTo({
			            url: `/pages/shop/merchantShop?merchantId=${this.currentUserId}`
			        });
			    }
			},
			getCurrentUserId() {
				let userInfo = this.$store.state.vuex_user_info || uni.getStorageSync('vuex_user_info');
				return userInfo?.id || null;
			},
			async loadUserStats() {
				if (!this.currentUserId) return;
				try {
					const res = await request({
						url: '/api/user/info',
						method: 'GET'
					});
					if (res.data.code === 0) {
						const user = res.data.data;
						this.userNickname = user.nickname;
						this.userAvatar = user.avatar || '/static/images/user-avatar.jpg';
						this.isMerchant = (user.role === 'merchant');
						this.fishingStats = [{
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
						url: `/api/user/follow/stats?user_id=${this.currentUserId}`,
						method: 'GET'
					});
					if (followRes.data.code === 0) this.followStats = followRes.data.data;
				} catch (e) {
					console.error('获取用户信息失败', e);
				}
			},
			async loadMyProfile() {
				if (!this.currentUserId) return;
				try {
					const res = await request({
						url: '/api/user/info',
						method: 'GET'
					});
					if (res.data.code === 0) {
						const user = res.data.data;
						this.myProfile = {
							avatar: user.avatar,
							nickname: user.nickname
						};
						this.fishingStats = [{
								key: 'fish_count',
								value: user.fish_count,
								label: '总鱼获'
							},
							{
								key: 'fishing_count',
								value: user.fishing_count,
								label: '出钓次数'
							},
							{
								key: 'over_hundred_count',
								value: user.over_hundred_count,
								label: '过百'
							},
							{
								key: 'champion_count',
								value: user.champion_count,
								label: '坑冠'
							}
						];
					}
					await this.loadFollowStats();
				} catch (e) {
					console.error('获取用户信息失败', e);
				}
			},
			async loadFollowStats() {
				const res = await request({
					url: `/api/user/follow/stats?user_id=${this.currentUserId}`,
					method: 'GET'
				});
				if (res.data.code === 0) this.followStats = res.data.data;
			},
			switchTab(tabValue) {
				this.currentTab = tabValue;
				this.page = 1;
				this.posts = [];
				this.hasMore = true;
				this.loadPosts();
				if (tabValue === 'mine') this.loadUserStats();
			},
			async loadPosts(reset = false) {
				if (this.loading) return;
				if (reset) {
					this.page = 1;
					this.posts = [];
					this.hasMore = true;
				}
				this.loading = true;
				let url = `/api/posts?type=${this.currentTab}&page=${this.page}&page_size=${this.pageSize}`;
				// 注意：如果是“我的”或“关注”列表，后端会根据 token 自动识别当前用户，无需传 user_id
				try {
					const res = await request({
						url,
						method: 'GET'
					});
					if (res.data.code === 0) {
						let newList = res.data.data.list;
						if (this.currentTab === 'follow' && this.currentUserId) {
							newList.forEach(post => post.is_following = true);
						}
						if (this.page === 1) this.posts = newList;
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
				if (!this.currentUserId) {
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
			async toggleFollow(post) {
				if (!this.currentUserId) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					return;
				}
				const isFollowing = post.is_following;
				const action = isFollowing ? '取消关注' : '关注';
				uni.showModal({
					title: '提示',
					content: `确定${action}该用户吗？`,
					success: async (modalRes) => {
						if (modalRes.confirm) {
							const url = isFollowing ? '/api/user/unfollow' : '/api/user/follow';
							try {
								const res = await request({
									url,
									method: 'POST',
									data: {
										followed_id: post.user_id
									} // 只传 followed_id
								});
								if (res.data.code === 0) {
									this.posts.forEach(p => {
										if (p.user_id === post.user_id) p.is_following = !
											isFollowing;
									});
									uni.showToast({
										title: `${action}成功`,
										icon: 'success'
									});
								} else {
									uni.showToast({
										title: res.data.message || `${action}失败`,
										icon: 'none'
									});
								}
							} catch (e) {
								uni.showToast({
									title: `${action}失败`,
									icon: 'none'
								});
							}
						}
					}
				});
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
									this.posts = this.posts.filter(p => p.id !== postId);
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
			prepareReply(commentId, userId, userName) {
				this.replyTarget = {
					commentId,
					replyToUserId: userId,
					replyToUserName: userName
				};
				this.commentContent = '';
				this.$nextTick(() => {
					if (this.$refs.commentInput) this.$refs.commentInput.focus();
				});
				uni.showToast({
					title: `回复 ${userName}`,
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
						const targetPost = this.posts.find(p => p.id === this.currentPost.id);
						if (targetPost) targetPost.comment_count = this.currentPost.comment_count;
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
			goToPublish() {
				if (!this.currentUserId) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					return;
				}
				uni.navigateTo({
					url: '/pages/social/publish'
				});
			},
			goToUserPosts(userId) {
				uni.navigateTo({
					url: `/pages/social/userPosts?userId=${userId}`
				});
			},
			goToPostDetail(postId) {
				uni.navigateTo({
					url: `/pages/social/postDetail?postId=${postId}`
				});
			}
		}
	}
</script>

<style lang="scss" scoped>
	.feed-container {
		background-color: #f8f8f8;
		min-height: 100vh;
		padding-bottom: 100rpx;
		box-sizing: border-box;
		overflow-x: hidden;
	}

	/* 顶部分类栏 */
	.tabs-bar {
		display: flex;
		background: #fff;
		padding: 20rpx 0;
		position: sticky;
		top: 0;
		z-index: 10;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.02);

		.tab-item {
			flex: 1;
			text-align: center;
			font-size: 32rpx;
			color: #666;
			padding: 20rpx 0;
			position: relative;
			transition: all 0.2s;

			&.active {
				color: #5d7291;
				font-weight: 600;

				&::after {
					content: '';
					position: absolute;
					bottom: 0;
					left: 50%;
					transform: translateX(-50%);
					width: 60rpx;
					height: 6rpx;
					background: #5d7291;
					border-radius: 3rpx;
				}
			}
		}
	}

	/* 个人资料卡片 */
	.profile-card {
		background: #fff;
		margin-top: 20rpx;
		padding: 30rpx;
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

	/* 钓鱼成绩卡片 */
	.stats-card {
		background: #fff;
		padding: 30rpx;

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

	/* 我的动态小标题 */
	.section-title {
		margin: 20rpx 20rpx 10rpx;
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		padding-left: 16rpx;
		border-left: 8rpx solid #5d7291;
	}

	/* 动态列表 */
	.feed-list {
		height: calc(100vh - 120rpx);
		padding: 0 20rpx;
		box-sizing: border-box;
	}

	.post-card {
		background: #fff;
		border-radius: 24rpx;
		padding: 30rpx;
		margin: 20rpx 0;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
		word-break: break-word;
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

		.follow-btn {
			padding: 8rpx 24rpx;
			border-radius: 60rpx;
			font-size: 26rpx;
			background: #f38b11;
			color: #fff;
			transition: all 0.2s;

			&:active {
				transform: scale(0.96);
			}

			&.followed {
				background: #ccc;
				color: #666;
			}
		}

		.delete-btn {
			padding: 8rpx 24rpx;
			border-radius: 60rpx;
			font-size: 26rpx;
			background: #f5f5f5;
			color: #666;
		}

		.delete-btn {
			background: none;
			padding: 0;
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
				background: #f0f0f0;
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

	.fab {
		position: fixed;
		bottom: 120rpx;
		right: 40rpx;
		width: 100rpx;
		height: 100rpx;
		border-radius: 50%;
		background: #f38b11;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4rpx 16rpx rgba(243, 139, 17, 0.4);
		z-index: 20;
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

	.author-badge {
		background: #f38b11;
		color: #fff;
		font-size: 20rpx;
		padding: 4rpx 12rpx;
		border-radius: 30rpx;
		margin-left: 8rpx;
		vertical-align: middle;
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