<template>
	<view class="post-detail">
		<u-navbar title="动态详情" :bgColor="'#5d7291'" :title-color="'#fff'" :back-text="'返回'"></u-navbar>

		<scroll-view scroll-y class="content-scroll" v-if="post">
			<!-- 图片轮播 -->
			<view v-if="post.images && post.images.length" class="image-swiper">
				<swiper class="swiper" :autoplay="false" circular indicator-dots>
					<swiper-item v-for="(img, idx) in post.images" :key="idx">
						<image :src="getImageUrl(img)" mode="aspectFill" @click="previewImage(idx)"></image>
					</swiper-item>
				</swiper>
			</view>

			<!-- 动态内容 -->
			<view class="post-card">
				<view class="user-row">
					<view @click="goToUserPosts(post.user_id)">
						<u-image :src="getImageUrl(post.user_avatar)" width="80rpx" height="80rpx" shape="circle" />
					</view>
					<view class="user-info">
						<text class="user-name">{{ post.user_name }}</text>
						<text class="post-time">{{ post.created_at }}</text>
					</view>
				</view>

				<text class="content-text">{{ post.content }}</text>

				<view v-if="post.tags && post.tags.length" class="tags">
					<text v-for="tag in post.tags" :key="tag" class="tag">#{{ tag }}#</text>
				</view>

				<view v-if="post.location" class="location">
					<u-icon name="map" size="24" color="#999" />
					<text>{{ post.location }}</text>
				</view>

				<!-- 引用卡片 -->
				<view v-if="post.ref_info" class="ref-card" @click="goToRefDetail">
					<image :src="getImageUrl(post.ref_info.image)" mode="aspectFill" class="ref-image" />
					<view class="ref-info">
						<text class="ref-name">{{ post.ref_info.name }}</text>
						<text class="ref-price">¥{{ post.ref_info.price }}</text>
						<text v-if="post.ref_info.service_type"
							class="ref-type">{{ getServiceTypeText(post.ref_info.service_type) }}</text>
					</view>
					<u-icon name="arrow-right" size="28" color="#999" />
				</view>

			</view>

			<!-- 评论列表 -->
			<view class="comments-section">
				<view class="section-title">评论（{{ post.comment_count }}）</view>
				<view v-for="comment in comments" :key="comment.id" class="comment-item">
					<view @click="goToUserPosts(comment.user_id)">
						<u-image :src="getImageUrl(comment.user_avatar)" width="60rpx" height="60rpx" shape="circle" />
					</view>
					<view class="comment-content">
						<view class="comment-user">
							<text class="name">{{ comment.user_name }}</text>
							<text v-if="comment.user_id === post.user_id" class="author-badge">作者</text>
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
						<view class="reply-btn" @click.stop="setReplyTarget(comment)">回复</view>
					</view>
				</view>
				<view v-if="!loadingComments && comments.length === 0" class="empty-comment">暂无评论，快来抢沙发～</view>
				<view v-if="hasMoreComments" class="load-more" @click="loadMoreComments">加载更多评论</view>
			</view>
		</scroll-view>

		<!-- 底部栏 -->
		<view class="bottom-bar">
			<view class="input-area">
				<u-input v-model="commentContent" :placeholder="placeholder || '写评论...'" border
					@confirm="submitComment" />
			</view>
			<view class="action-area">
				<view class="action-item" @click="toggleLike">
					<u-icon :name="(post && post.liked) ? 'heart-fill' : 'heart'" size="36"
						:color="(post && post.liked) ? '#FF4D4F' : '#666'" />
					<text>{{(post ? post.like_count : 0) || 0 }}</text>
				</view>
				<view class="action-item" @click="collectPost">
					<u-icon name="star" size="36" color="#666" />
					<text>收藏</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import request from '@/common/request.js';

	export default {
		data() {
			return {
				postId: null,
				post: null,
				comments: [],
				commentPage: 1,
				commentPageSize: 10,
				hasMoreComments: true,
				loadingComments: false,
				commentContent: '',
				replyTarget: null,
				placeholder: ''
			}
		},
		onLoad(options) {
			if (options.postId) {
				this.postId = options.postId;
				this.loadPostDetail();
				this.loadComments();
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
			goToRefDetail() {
			    if (!this.post.ref_info) return;
			    if (this.post.ref_info.type === 'product') {
			        uni.navigateTo({ url: `/pages/shop/detail?id=${this.post.ref_info.id}` });
			    } else if (this.post.ref_info.type === 'service') {
			        uni.navigateTo({ url: `/pages/shop/pond-detail?id=${this.post.ref_info.id}` });
			    }
			},
			getServiceTypeText(type) {
				return type === 'regular' ? '开钓服务' : (type === 'competition' ? '比赛服务' : '');
			},
			async loadPostDetail() {
				try {
					const res = await request({
						url: `/api/posts/${this.postId}`,
						method: 'GET'
					});
					if (res.data.code === 0) this.post = res.data.data;
					else {
						uni.showToast({
							title: res.data.message || '加载失败',
							icon: 'none'
						});
						setTimeout(() => uni.navigateBack(), 1500);
					}
				} catch (e) {
					console.error(e);
				}
			},
			async loadComments(reset = false) {
				if (this.loadingComments) return;
				if (reset) {
					this.commentPage = 1;
					this.comments = [];
					this.hasMoreComments = true;
				}
				this.loadingComments = true;
				try {
					const res = await request({
						url: `/api/posts/${this.postId}/comments?page=${this.commentPage}&page_size=${this.commentPageSize}`,
						method: 'GET'
					});
					if (res.data.code === 0) {
						const newList = res.data.data.list;
						if (reset) this.comments = newList;
						else this.comments = [...this.comments, ...newList];
						this.hasMoreComments = this.comments.length < (res.data.data.total || 0);
						this.commentPage++;
					}
				} catch (e) {
					console.error(e);
				} finally {
					this.loadingComments = false;
				}
			},
			loadMoreComments() {
				if (this.hasMoreComments && !this.loadingComments) this.loadComments();
			},
			previewImage(idx) {
				const urls = this.post.images.map(img => this.getImageUrl(img));
				uni.previewImage({
					current: urls[idx],
					urls
				});
			},
			async toggleLike() {
				if (!this.getCurrentUserId()) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					return;
				}
				const url = this.post.liked ? `/api/posts/${this.postId}/unlike` : `/api/posts/${this.postId}/like`;
				try {
					const res = await request({
						url,
						method: 'POST',
						data: {}
					});
					if (res.data.code === 0) {
						this.post.liked = !this.post.liked;
						this.post.like_count = res.data.data.like_count;
					}
				} catch (e) {
					console.error(e);
				}
			},
			collectPost() {
				uni.showToast({
					title: '收藏功能开发中',
					icon: 'none'
				});
			},
			setReplyTarget(comment) {
				uni.showToast({
					title: `回复 ${comment.user_name}`,
					icon: 'none',
					duration: 1000
				});
				this.replyTarget = {
					commentId: comment.id,
					replyToUserId: comment.user_id,
					replyToUserName: comment.user_name
				};
				this.commentContent = '';
				this.placeholder = `回复 @${comment.user_name}：`;
				uni.showKeyboard();
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
						url: `/api/posts/${this.postId}/comments`,
						method: 'POST',
						data
					});
					if (res.data.code === 0) {
						this.commentContent = '';
						this.replyTarget = null;
						this.placeholder = '';
						await this.loadComments(true);
						this.post.comment_count++;
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
			goToUserPosts(userId) {
				if (!userId) return;
				uni.navigateTo({
					url: `/pages/social/userPosts?userId=${userId}`
				});
			}
		}
	}
</script>

<style lang="scss" scoped>
	.post-detail {
		background-color: #f8f8f8;
		min-height: 100vh;
	}

	.content-scroll {
		height: calc(100vh - 88rpx - 100rpx);
	}

	.image-swiper {
		width: 100%;
		height: 550rpx;

		.swiper {
			width: 100%;
			height: 100%;

			image {
				width: 100%;
				height: 100%;
			}
		}
	}

	.post-card {
		background: #fff;
		padding: 30rpx;

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

		.stats {
			display: flex;
			gap: 30rpx;
			font-size: 26rpx;
			color: #999;
			margin-top: 20rpx;
		}
	}

	.comments-section {
		background: #fff;
		margin-top: 20rpx;
		padding: 30rpx;

		.section-title {
			font-size: 32rpx;
			font-weight: bold;
			margin-bottom: 20rpx;
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
					margin-bottom: 8rpx;
				}

				.replies {
					background: #f9f9f9;
					border-radius: 12rpx;
					padding: 16rpx;
					margin: 12rpx 0;

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

		.empty-comment {
			text-align: center;
			padding: 40rpx 0;
			color: #999;
			font-size: 28rpx;
		}

		.load-more {
			text-align: center;
			padding: 20rpx;
			color: #5d7291;
			font-size: 28rpx;
		}
	}

	.bottom-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: #fff;
		padding: 16rpx 30rpx;
		display: flex;
		align-items: center;
		gap: 20rpx;
		box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);

		.input-area {
			flex: 1;
		}

		.action-area {
			display: flex;
			gap: 30rpx;

			.action-item {
				display: flex;
				flex-direction: column;
				align-items: center;
				font-size: 24rpx;
				color: #666;

				.u-icon {
					margin-bottom: 4rpx;
				}
			}
		}
	}

	.user-name,
	.name,
	.reply-name,
	.reply-to {
		cursor: pointer;
	}

	.author-badge {
		background: #f38b11;
		color: #fff;
		font-size: 20rpx;
		padding: 4rpx 12rpx;
		border-radius: 30rpx;
		margin-left: 12rpx;
		vertical-align: middle;
	}

	.ref-card {
		display: flex;
		align-items: center;
		background: #f9f9f9;
		border-radius: 20rpx;
		padding: 20rpx;
		margin-top: 20rpx;

		.ref-image {
			width: 120rpx;
			height: 120rpx;
			border-radius: 12rpx;
			margin-right: 20rpx;
		}

		.ref-info {
			flex: 1;

			.ref-name {
				font-size: 28rpx;
				font-weight: bold;
				display: block;
				margin-bottom: 8rpx;
			}

			.ref-price {
				color: #f38b11;
				font-size: 28rpx;
				font-weight: bold;
			}

			.ref-type {
				font-size: 24rpx;
				color: #999;
				margin-left: 16rpx;
			}
		}
	}
</style>