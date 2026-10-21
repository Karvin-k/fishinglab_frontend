<template>
	<view class="publish-page">
		<u-navbar title="发布动态" :bgColor="'#5d7291'" :title-color="'#fff'" :back-text="'返回'"></u-navbar>

		<view class="form-container">
			<textarea v-model="content" placeholder="分享你的钓鱼经历..." maxlength="500" class="textarea" />

			<view class="image-upload">
				<view v-for="(img, idx) in images" :key="idx" class="img-item">
					<image :src="getImageUrl(img)" mode="aspectFill" @click="previewImage(idx)"></image>
					<view class="del-icon" @click.stop="removeImage(idx)">
						<u-icon name="close" size="24" color="#fff" />
					</view>
				</view>
				<view v-if="images.length < 9" class="add-btn" @click="chooseImage">
					<u-icon name="plus" size="40" color="#ccc" />
				</view>
			</view>

			<view class="info-row">
				<text class="label">钓场定位</text>
				<u-input v-model="location" placeholder="选择钓场或输入地点" border />
			</view>

			<view class="info-row">
				<text class="label">话题标签</text>
				<view class="tag-input-area">
					<view v-for="(tag, idx) in tags" :key="idx" class="tag-chip">
						<text>#{{ tag }}#</text>
						<u-icon name="close" size="20" color="#fff" @click="removeTag(idx)" />
					</view>
					<input v-model="tagInput" placeholder="输入标签后按回车" class="tag-input" @confirm="addTag" />
				</view>
				<view class="hot-tags">
					<text class="hot-title">热门话题：</text>
					<view v-for="hot in hotTags" :key="hot.name" class="hot-tag" @click="addHotTag(hot.name)">
						#{{ hot.name }}#
					</view>
				</view>
			</view>

			<!-- 引用区域 -->
			<view class="info-row">
				<text class="label">引用商品/服务（可选）</text>
				<view v-if="ref" class="ref-card">
					<image :src="getImageUrl(ref.image)" mode="aspectFill" class="ref-img"></image>
					<view class="ref-info">
						<text class="ref-name">{{ ref.name }}</text>
						<text class="ref-price">¥{{ ref.price }}</text>
						<text v-if="ref.service_type"
							class="ref-type">{{ ref.service_type === 'regular' ? '开钓服务' : '比赛服务' }}</text>
					</view>
					<view @click.stop="removeRef">
						<u-icon name="close" size="28" color="#999" />
					</view>
				</view>
				<view v-else class="add-ref-btn" @click="goToRefSearch">
					<u-icon name="plus" size="32" color="#5d7291" />
					<text>添加引用</text>
				</view>
			</view>
			<button class="submit-btn" @click="submitPost">发布</button>
		</view>
	</view>
</template>

<script>
	import request from '@/common/request.js';
	import {
		uploadFile
	} from '@/common/request.js';

	export default {
		data() {
			return {
				content: '',
				images: [], // 存储上传成功后返回的图片 URL（相对路径）
				location: '',
				tags: [],
				tagInput: '',
				hotTags: [],
				ref: null, // 存储引用对象 { type, id, name, price, image, service_type? }
			}
		},
		// 在 onShow 中接收返回的引用数据
		onShow() {
			const pages = getCurrentPages();
			const prevPage = pages[pages.length - 2];
			if (prevPage && prevPage.$vm && prevPage.$vm.selectedRef) {
				console.log('收到引用数据:', prevPage.$vm.selectedRef);
				this.ref = prevPage.$vm.selectedRef;
				delete prevPage.$vm.selectedRef;
			} else {
				console.log('未收到引用数据');
			}
		},
		onLoad() {
			this.loadHotTags();
			uni.$on('refSelected', this.handleRefSelected);
		},
		onUnload() {
			uni.$off('refSelected', this.handleRefSelected);
		},
		methods: {
			// 获取完整图片 URL（用于显示）
			getImageUrl(url) {
				if (!url) return '';
				// 如果已经是完整 URL，直接返回
				if (url.startsWith('http') || url.startsWith('data:')) return url;
				// 否则拼接后端基地址
				return uni.$imgUrl(url);
			},
			getCurrentUserId() {
				let userInfo = this.$store.state.vuex_user_info || uni.getStorageSync('vuex_user_info');
				return userInfo?.id || null;
			},
			goToRefSearch() {
				uni.navigateTo({
					url: '/pages/social/refSearch'
				});
			},
			removeRef() {
				this.ref = null;
			},
			handleRefSelected(refData) {
				console.log('收到引用数据:', refData);
				this.ref = refData;
			},
			async loadHotTags() {
				try {
					const res = await request({
						url: '/api/posts/hot/tags',
						method: 'GET'
					});
					if (res.data.code === 0) this.hotTags = res.data.data;
				} catch (e) {
					console.error('加载热门标签失败', e);
				}
			},
			chooseImage() {
				const maxCount = 9 - this.images.length;
				if (maxCount <= 0) {
					uni.showToast({
						title: '最多上传9张图片',
						icon: 'none'
					});
					return;
				}
				uni.chooseImage({
					count: maxCount,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: async (res) => {
						uni.showLoading({
							title: '上传中...'
						});
						for (let tempFile of res.tempFiles) {
							// 文件大小限制 10MB
							if (tempFile.size > 10 * 1024 * 1024) {
								uni.showToast({
									title: '图片不能超过10MB',
									icon: 'none'
								});
								continue;
							}
							const url = await this.uploadImage(tempFile.path);
							if (url) {
								this.images.push(url); // 存储相对路径
							}
						}
						uni.hideLoading();
					}
				});
			},
			// 上传图片，返回图片的相对路径
			async uploadImage(filePath) {
				try {
					const uploadRes = await uploadFile({
						url: '/api/upload',
						filePath: filePath,
						name: 'file'
					});
					// uploadRes 是 uni.uploadFile 的响应对象，包含 data（字符串）和 statusCode
					const result = JSON.parse(uploadRes.data);
					if (result.code === 0) {
						return result.data.url; // 如 "/static/uploads/xxx.png"
					} else {
						uni.showToast({
							title: result.message || '上传失败',
							icon: 'none'
						});
						return null;
					}
				} catch (error) {
					console.error('上传失败', error);
					uni.showToast({
						title: '上传失败，请重试',
						icon: 'none'
					});
					return null;
				}
			},
			previewImage(idx) {
				const urls = this.images.map(img => this.getImageUrl(img));
				uni.previewImage({
					current: urls[idx],
					urls: urls
				});
			},
			removeImage(idx) {
				this.images.splice(idx, 1);
			},
			addTag() {
				const tag = this.tagInput.trim();
				if (tag && !this.tags.includes(tag) && this.tags.length < 5) {
					this.tags.push(tag);
					this.tagInput = '';
				}
			},
			removeTag(idx) {
				this.tags.splice(idx, 1);
			},
			addHotTag(name) {
				if (!this.tags.includes(name) && this.tags.length < 5) this.tags.push(name);
			},
			async submitPost() {
				if (!this.content && this.images.length === 0) {
					uni.showToast({
						title: '内容或图片不能为空',
						icon: 'none'
					});
					return;
				}
				const userId = this.getCurrentUserId();
				if (!userId) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					return;
				}
				uni.showLoading({
					title: '发布中...'
				});
				try {
					const res = await request({
						url: '/api/posts',
						method: 'POST',
						data: {
							content: this.content,
							location: this.location,
							tags: this.tags,
							images: this.images, // 传递相对路径数组
							ref_type: this.ref ? this.ref.type : null,
							ref_id: this.ref ? this.ref.id : null
						}
					});
					if (res.data.code === 0) {
						uni.showToast({
							title: '发布成功',
							icon: 'success'
						});
						setTimeout(() => uni.navigateBack(), 1500);
					} else {
						uni.showToast({
							title: res.data.message || '发布失败',
							icon: 'none'
						});
					}
				} catch (e) {
					uni.showToast({
						title: '发布失败',
						icon: 'none'
					});
				} finally {
					uni.hideLoading();
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.publish-page {
		background: #f8f8f8;
		min-height: 100vh;
	}

	.form-container {
		padding: 10rpx;

		.textarea {
			width: 670rpx;
			margin: 5rpx 0 5rpx 0;
			height: 250rpx;
			background: #fff;
			border-radius: 20rpx;
			padding: 30rpx;
			font-size: 30rpx;
		}

		.image-upload {
			display: flex;
			flex-wrap: wrap;
			gap: 20rpx;
			margin: 30rpx 0;

			.img-item {
				position: relative;
				width: 200rpx;
				height: 200rpx;

				image {
					width: 100%;
					height: 100%;
					border-radius: 16rpx;
				}

				.del-icon {
				    position: absolute;
				    top: -12rpx;
				    right: -12rpx;
				    background: rgba(0, 0, 0, 0.6);
				    border-radius: 50%;
				    width: 48rpx;
				    height: 48rpx;
				    display: flex;
				    align-items: center;
				    justify-content: center;
				    .u-icon {
				        line-height: 1;
				    }
				}
			}

			.add-btn {
				width: 200rpx;
				height: 200rpx;
				background: #f5f5f5;
				border-radius: 16rpx;
				display: flex;
				align-items: center;
				justify-content: center;
			}
		}

		.info-row {
			background: #fff;
			border-radius: 20rpx;
			padding: 30rpx;
			margin-bottom: 30rpx;

			.label {
				font-size: 30rpx;
				font-weight: bold;
				display: block;
				margin-bottom: 20rpx;
			}

			.tag-input-area {
				display: flex;
				flex-wrap: wrap;
				align-items: center;
				gap: 16rpx;

				.tag-chip {
					background: #5d7291;
					color: #fff;
					padding: 8rpx 20rpx;
					border-radius: 60rpx;
					font-size: 26rpx;
					display: inline-flex;
					align-items: center;
					gap: 8rpx;
				}

				.tag-input {
					flex: 1;
					height: 60rpx;
					background: #f9f9f9;
					border-radius: 60rpx;
					padding: 0 20rpx;
					font-size: 28rpx;
				}
			}

			.hot-tags {
				margin-top: 20rpx;
				display: flex;
				flex-wrap: wrap;
				align-items: center;
				gap: 16rpx;

				.hot-title {
					font-size: 26rpx;
					color: #999;
				}

				.hot-tag {
					background: #f0f0f0;
					padding: 8rpx 20rpx;
					border-radius: 60rpx;
					font-size: 26rpx;
					color: #5d7291;
				}
			}
		}

		.submit-btn {
			background: #f38b11;
			color: #fff;
			border-radius: 60rpx;
			height: 88rpx;
			line-height: 88rpx;
			font-size: 32rpx;
			border: none;
		}
	}

	.add-ref-btn {
		display: flex;
		align-items: center;
		gap: 16rpx;
		background: #f5f7fa;
		border: 1rpx dashed #5d7291;
		border-radius: 60rpx;
		padding: 20rpx 30rpx;
		justify-content: center;
		color: #5d7291;
		font-size: 28rpx;
	}

	.ref-card {
		display: flex;
		align-items: center;
		background: #f9f9f9;
		border-radius: 20rpx;
		padding: 20rpx;
		position: relative;

		.ref-img {
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

		.ref-remove {
			position: absolute;
			top: -12rpx;
			right: -12rpx;
			background: rgba(0, 0, 0, 0.5);
			border-radius: 50%;
			width: 48rpx;
			height: 48rpx;
			display: flex;
			align-items: center;
			justify-content: center;
		}
	}
</style>