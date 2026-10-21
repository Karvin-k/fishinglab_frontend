<template>
	<view class="comment-page">
		<u-navbar title="发表评价" :bgColor="'#5d7291'" :title-color="'#fff'" :back-text="'返回'"></u-navbar>

		<!-- 商品信息卡片 -->
		<view class="product-card" v-if="orderItem">
			<u-image :src="getImageUrl(orderItem.product_image)" width="160rpx" height="160rpx" border-radius="16rpx" />
			<view class="product-info">
				<text class="name">{{ orderItem.product_name }}</text>
				<text class="spec" v-if="orderItem.product_attributes && orderItem.product_attributes.length">
					规格：{{ orderItem.product_attributes.join(' + ') }}
				</text>
			</view>
		</view>
		<view v-else class="loading-card">
			<u-loading mode="circle" size="40" />
		</view>

		<!-- 评分区域 -->
		<view class="rating-card">
			<text class="label">评分</text>
			<view class="stars">
				<u-icon v-for="i in 5" :key="i" :name="i <= rating ? 'star-fill' : 'star'" size="48"
					:color="i <= rating ? '#f38b11' : '#ddd'" @click="rating = i" />
			</view>
			<text class="rating-text">{{ ratingText }}</text>
		</view>

		<!-- 评价内容 -->
		<view class="content-card">
			<textarea v-model="content" placeholder="分享使用感受吧～" maxlength="200" class="textarea" />
			<view class="image-upload">
				<view v-for="(img, idx) in images" :key="idx" class="img-item">
					<image :src="getImageUrl(img)" mode="aspectFill" @click="previewImage(idx)"></image>
					<view class="del-icon" @click.stop="removeImage(idx)">
						<u-icon name="close" size="24" color="#fff" />
					</view>
				</view>
				<view v-if="images.length < 6" class="add-btn" @click="chooseImage">
					<u-icon name="plus" size="40" color="#ccc" />
				</view>
			</view>
		</view>

		<button class="submit-btn" @click="submitReview">提交评价</button>
	</view>
</template>

<script>
	// 引入统一请求封装和上传封装
	import request from '@/common/request.js';
	import {
		uploadFile
	} from '@/common/request.js';

	export default {
		data() {
			return {
				orderId: null, // 订单ID
				orderItemId: null, // 订单项ID
				productId: null, // 商品ID
				orderItem: null, // 订单项信息（用于展示）
				rating: 5, // 评分（1-5）
				content: '', // 评价文字
				images: [], // 上传的图片URL数组
				uploading: false // 是否正在上传
			}
		},
		computed: {
			// 根据评分显示文字
			ratingText() {
				const map = {
					1: '很差',
					2: '较差',
					3: '一般',
					4: '满意',
					5: '非常满意'
				};
				return map[this.rating] || '';
			}
		},
		onLoad(options) {
			// 接收从订单列表传来的参数
			if (options.orderId && options.orderItemId) {
				this.orderId = options.orderId;
				this.orderItemId = options.orderItemId;
				this.productId = options.productId;
				this.loadOrderItem(); // 加载订单项信息
			} else {
				uni.showToast({
					title: '参数错误',
					icon: 'none'
				});
				setTimeout(() => uni.navigateBack(), 1500);
			}
		},
		methods: {
			// 拼接完整图片URL
			getImageUrl(url) {
				if (!url) return '';
				if (url.startsWith('http') || url.startsWith('data:')) return url;
				return uni.$imgUrl(url);
			},
			// 获取当前登录用户ID（仅用于判断，但请求中不再使用）
			getCurrentUserId() {
				let userInfo = this.$store.state.vuex_user_info || uni.getStorageSync('vuex_user_info');
				return userInfo?.id || null;
			},
			// 加载订单项信息（用于显示商品图片、名称等）
			async loadOrderItem() {
				try {
					// 使用 request 封装，不再传 user_id，后端从 token 获取
					const res = await request({
						url: `/api/orders/${this.orderId}`,
						method: 'GET'
					});
					if (res.data.code === 0) {
						const order = res.data.data;
						// 找到当前要评价的订单项
						const targetItem = order.items.find(i => i.id == this.orderItemId);
						if (targetItem) {
							this.orderItem = {
								product_name: targetItem.product_name,
								product_image: targetItem.product_image,
								product_attributes: targetItem.product_attributes || []
							};
							// 如果未传 productId，则从订单项中获取
							if (!this.productId && targetItem.product_id) {
								this.productId = targetItem.product_id;
							}
						} else {
							uni.showToast({
								title: '商品信息不存在',
								icon: 'none'
							});
						}
					} else {
						uni.showToast({
							title: '加载失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('加载订单项失败', error);
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					});
				}
			},
			// 选择图片（最多6张）
			chooseImage() {
				uni.chooseImage({
					count: 6 - this.images.length,
					sizeType: ['compressed'],
					success: async (res) => {
						for (let file of res.tempFiles) {
							const url = await this.uploadImage(file.path);
							if (url) this.images.push(url);
						}
					}
				});
			},
			// 上传单张图片，返回相对路径
			async uploadImage(filePath) {
				try {
					const uploadRes = await uploadFile({
						url: '/api/upload',
						filePath: filePath,
						name: 'file'
					});
					const result = JSON.parse(uploadRes.data);
					if (result.code === 0) return result.data.url;
					else return null;
				} catch (error) {
					console.error('上传失败', error);
					return null;
				}
			},
			// 预览图片
			previewImage(idx) {
				const urls = this.images.map(img => this.getImageUrl(img));
				uni.previewImage({
					current: urls[idx],
					urls: urls
				});
			},
			// 删除已选的图片
			removeImage(idx) {
				this.images.splice(idx, 1);
			},
			// 提交评价
			async submitReview() {
				if (!this.rating) {
					uni.showToast({
						title: '请评分',
						icon: 'none'
					});
					return;
				}
				if (!this.productId) {
					uni.showToast({
						title: '商品信息缺失，无法评价',
						icon: 'none'
					});
					return;
				}
				uni.showLoading({
					title: '提交中...'
				});
				try {
					// 使用 request 发送 POST 请求，不再传 user_id
					const res = await request({
						url: '/api/reviews',
						method: 'POST',
						data: {
							order_id: this.orderId,
							order_item_id: this.orderItemId,
							product_id: this.productId,
							rating: this.rating,
							content: this.content,
							images: this.images
						}
					});
					if (res.data.code === 0) {
						uni.showToast({
							title: '评价成功',
							icon: 'success'
						});
						setTimeout(() => uni.navigateBack(), 1500);
					} else {
						uni.showToast({
							title: res.data.message || '评价失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('提交评价失败', error);
					uni.showToast({
						title: '网络错误',
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
	.comment-page {
		background: #f8f8f8;
		min-height: 100vh;
		padding: 0rpx;
		padding-bottom: 100rpx;
		box-sizing: border-box;
	}

	.product-card,
	.rating-card,
	.content-card {
		background: #fff;
		padding: 30rpx;
		width: 100%;
		box-sizing: border-box;
	}

	.product-card {
		display: flex;
		align-items: center;

		.product-info {
			flex: 1;
			margin-left: 24rpx;

			.name {
				font-size: 32rpx;
				font-weight: bold;
				display: block;
				margin-bottom: 8rpx;
			}

			.spec {
				font-size: 26rpx;
				color: #999;
			}
		}
	}

	.loading-card {
		background: #fff;
		border-radius: 24rpx;
		padding: 60rpx;
		display: flex;
		justify-content: center;
		margin-bottom: 20rpx;
	}

	.rating-card {
		.label {
			font-size: 32rpx;
			font-weight: bold;
			display: block;
			margin-bottom: 20rpx;
		}

		.stars {
			display: flex;
			gap: 20rpx;
		}

		.rating-text {
			margin-top: 16rpx;
			font-size: 28rpx;
			color: #f38b11;
		}
	}

	.content-card {
		.textarea {
			width: 100%;
			height: 200rpx;
			background: #f9f9f9;
			border-radius: 16rpx;
			padding: 20rpx;
			font-size: 28rpx;
			box-sizing: border-box;
		}

		.image-upload {
			display: flex;
			flex-wrap: wrap;
			gap: 20rpx;
			margin-top: 20rpx;

			.img-item {
				position: relative;
				width: 160rpx;
				height: 160rpx;

				image {
					width: 100%;
					height: 100%;
					border-radius: 12rpx;
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
					z-index: 2;

					.u-icon {
						line-height: 1;
					}
				}
			}

			.add-btn {
				width: 160rpx;
				height: 160rpx;
				background: #f5f5f5;
				border-radius: 12rpx;
				display: flex;
				align-items: center;
				justify-content: center;
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
		margin: 40rpx;
	}
</style>