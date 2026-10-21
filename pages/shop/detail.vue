<template>
	<view class="wrap">
		<!-- 商品图片轮播 -->
		<swiper class="swiper" :autoplay="false" indicator-dots indicator-color="#999" indicator-active-color="#f38b11">
			<swiper-item v-for="(img, index) in goodsDetail.images" :key="index">
				<u-image width="100%" height="500rpx" :src="getImageUrl(img)" mode="aspectFill"></u-image>
			</swiper-item>
		</swiper>

		<!-- 商品基本信息 -->
		<view class="goods-info">
			<view v-if="goodsDetail.stock <= 0" class="sold-out-tag">
				<u-tag text="已售罄" type="error" size="mini" />
			</view>
			<view class="price">¥{{ totalPrice.toFixed(2) }}</view>
			<view class="title">{{ goodsDetail.name }}</view>
			<view class="tags">
				<u-tag v-for="(tag, index) in goodsDetail.tags" :key="index" :text="tag" type="info" size="mini"
					shape="circle" bg-color="#5d7291" color="#fff" />
			</view>
			<view class="sales">月销{{ goodsDetail.sales }}件</view>
		</view>

		<!-- 商家信息卡片（全宽） -->
		<view class="merchant-card" @click="goMerchantShop">
			<view class="merchant-info">
				<u-image width="80rpx" height="80rpx" shape="circle" :src="getImageUrl(merchantAvatar)"
					class="merchant-avatar"></u-image>
				<view class="merchant-detail">
					<text class="merchant-name">{{ merchantName }}</text>
					<view class="merchant-stats">
						<text>评分 {{ merchantRating }}</text>
						<text>粉丝 {{ merchantFollowCount }}</text>
					</view>
				</view>
			</view>
			<u-icon name="arrow-right" size="28" color="#999"></u-icon>
		</view>

		<!-- 商品评价（全宽） -->
		<view class="comment-section">
			<view class="section-header">
				<view class="section-title">用户评价（{{ commentTotal }}）</view>
				<view class="view-all" @click="goToAllReviews" v-if="commentTotal > 0">查看全部 ></view>
			</view>
			<view v-if="commentList.length > 0" class="comment-list">
				<view class="comment-item" v-for="item in commentList" :key="item.id">
					<view class="comment-user">
						<text class="user-name">{{ item.userName }}</text>
						<text class="comment-time">{{ item.createTime }}</text>
					</view>
					<view class="comment-content">{{ item.content }}</view>
				</view>
			</view>
			<view v-else class="empty-comment">暂无评价，快来成为第一个评价的人吧～</view>
		</view>

		<!-- 商品详情 -->
		<view class="detail-section">
			<view class="section-title">商品详情</view>
			<view class="detail-images" v-if="goodsDetail.images && goodsDetail.images.length">
				<image v-for="(img, idx) in goodsDetail.images" :key="idx" :src="getImageUrl(img)" mode="widthFix"
					class="detail-image"></image>
			</view>
			<!-- 如果没有图片，则显示文字描述 -->
			<view v-else-if="goodsDetail.detail" class="detail-text">
				<u-parse :html="goodsDetail.detail"></u-parse>
			</view>
			<view v-else class="empty-detail">暂无商品详情</view>
		</view>

		<!-- 其他说明（全宽） -->
		<view class="extra-section">
			<view class="section-title">其他说明</view>
			<view class="extra-content">
				<view class="extra-item">发货时间：48小时内发货</view>
				<view class="extra-item">售后服务：支持7天无理由退换</view>
				<view class="extra-item">温馨提示：鱼竿属易损品，请妥善使用</view>
			</view>
		</view>

		<!-- 底部操作栏 -->
		<view class="footer">
			<view class="action-btn" :class="{ 'favorited': isFavorited, 'disabled': goodsDetail.stock <= 0 }"
				@click="goodsDetail.stock <= 0 ? showSoldOut() : toggleFavorite()">
				<u-icon :name="isFavorited ? 'star-fill' : 'star'" size="36"
					:color="isFavorited ? '#f38b11' : (goodsDetail.stock <= 0 ? '#ccc' : '#f38b11')">
				</u-icon>
				<text>{{ isFavorited ? '已收藏' : '收藏' }}</text>
			</view>
			<view class="cart-btn" @click="isMerchantSelf ? showCannotBuy() : showSkuForCart()"
				:class="{ disabled: isMerchantSelf }">
				<u-icon name="shopping-cart" size="36" color="#fff"></u-icon>
				<text>加入购物车</text>
			</view>
			<button class="buy-btn" :class="{ disabled: isMerchantSelf || goodsDetail.stock <= 0 }" @click="handleBuy">
				立即购买
			</button>
		</view>

		<!-- SKU选择弹窗 -->
		<u-popup v-model="showSkuPopup" mode="bottom" border-radius="20" height="800rpx">
			<view class="sku-popup">
				<view class="popup-header">
					<u-icon name="close" size="32" @click="showSkuPopup = false"></u-icon>
					<text>选择规格</text>
				</view>
				<view class="sku-info">
					<u-image width="180rpx" height="180rpx" :src="getImageUrl(goodsDetail.main_image)"
						border-radius="8"></u-image>
					<view class="info">
						<view class="price">¥{{ totalPrice.toFixed(2) }}</view>
						<view class="stock">库存：{{ goodsDetail.stock }}件</view>
					</view>
				</view>
				<view v-if="goodsDetail.stock <= 0" class="sold-out-banner">
					商品已售罄，暂时无法购买
				</view>
				<view class="sku-attributes">
					<view class="attribute" v-for="(attr, index) in goodsDetail.attributes" :key="index">
						<view class="attr-name">{{ attr.name }}</view>
						<view class="attr-values">
							<view v-for="value in attr.values" :key="value" class="attr-value" :class="{
								selected: selectedAttributes[index] === value,
								disabled: goodsDetail.stock <= 0
							}" @click="goodsDetail.stock <= 0 ? showSoldOut() : selectAttribute(index, value)">
								{{ value }}
							</view>
						</view>
					</view>
				</view>
				<view class="quantity-select">
					<text>数量</text>
					<u-number-box v-model="quantity" :min="1" :max="goodsDetail.stock"
						:disabled="goodsDetail.stock <= 0"></u-number-box>
				</view>
				<button class="confirm-btn" :class="{ disabled: goodsDetail.stock <= 0 }"
					@click="goodsDetail.stock <= 0 ? showSoldOut() : confirmSku()">
					确定
				</button>
			</view>
		</u-popup>
	</view>
</template>

<script>
	import request from '@/common/request.js';
	export default {
		data() {
			return {
				baseUrl: uni.$baseUrl,
				goodsId: null,
				goodsDetail: {
					id: 0,
					name: '',
					price: 0,
					main_image: '',
					images: [],
					tags: [],
					sales: 0,
					stock: 0,
					detail: '',
					attributes: []
				},
				showSkuPopup: false,
				selectedAttributes: [],
				quantity: 1,
				basePrice: 0,
				selectedPrice: 0,
				attributePrices: {},
				isFavorited: false,
				favoriteId: null,
				favoriteLoading: false,
				merchantId: null,
				merchantName: '平台自营',
				merchantAvatar: '',
				commentList: [],
				commentTotal: 0,
				showSkuPopup: false, // 复用弹窗
				skuForCart: false, // 标记是加入购物车还是立即购买
				isMerchantSelf: false,
				merchantRating: 0,
				merchantFollowCount: 0,
			}
		},
		onLoad(options) {
			if (options && options.id) {
				this.goodsId = options.id;
				this.getGoodsDetail();
			} else if (options && options.product) {
				try {
					const product = JSON.parse(decodeURIComponent(options.product));
					this.goodsId = product.id;
					this.getGoodsDetail();
				} catch (e) {
					console.error('解析product参数失败', e);
					uni.showToast({
						title: '商品数据格式错误',
						icon: 'none',
						duration: 2000
					});
				}
			} else {
				uni.showToast({
					title: '商品ID缺失',
					icon: 'none',
					duration: 2000
				});
				const pages = getCurrentPages();
				if (pages && pages.length > 0) {
					const currentPage = pages[pages.length - 1];
					const routeParams = currentPage.options;
					if (routeParams && routeParams.id) {
						this.goodsId = routeParams.id;
						this.getGoodsDetail();
					}
				}
			}
			this.checkFavoriteStatus();
			this.fetchComments();
		},
		computed: {
			totalPrice() {
				return this.selectedPrice * this.quantity;
			}
		},
		methods: {
			// 售罄无法购买	
			handleBuy() {
				if (this.goodsDetail.stock <= 0) {
					uni.showToast({
						title: '商品已售罄',
						icon: 'none'
					});
					return;
				}
				if (this.isMerchantSelf) {
					this.showCannotBuy();
					return;
				}
				// 弹出SKU选择弹窗，标记为立即购买模式
				this.skuForCart = false;
				this.showSkuPopup = true;
			},
			// 提示
			showCannotBuy() {
				uni.showToast({
					title: '不能购买自己店铺的商品',
					icon: 'none'
				});
			},
			// 获取当前用户ID
			getCurrentUserId() {
				let userInfo = this.$store.state.vuex_user_info || uni.getStorageSync('vuex_user_info');
				return userInfo?.id || null;
			},
			// 加入购物车：弹出规格选择
			showSkuForCart() {
				if (this.goodsDetail.stock <= 0) {
					uni.showToast({
						title: '商品已售罄',
						icon: 'none'
					});
					return;
				}
				this.skuForCart = true;
				this.showSkuPopup = true;
			},
			getImageUrl(url) {
				if (!url) return '';
				if (url.startsWith('http') || url.startsWith('data:')) return url;
				return this.baseUrl + url;
			},
			async checkFavoriteStatus() {
				if (!this.$store.state.isLoginStatus) return;
				try {
					const res = await request({
						url: `${uni.$baseUrl}/api/user/favorite/check?goodsId=${this.goodsId}`,
						method: 'GET'
					});
					if (res.data.code === 0) {
						this.isFavorited = res.data.data.exists;
						if (this.isFavorited) this.favoriteId = res.data.data.favorite_id;
					}
				} catch (error) {
					console.error('检查收藏状态失败', error);
				}
			},
			async toggleFavorite() {
				if (this.favoriteLoading) return;
				this.favoriteLoading = true;
				if (!this.$store.state.isLoginStatus) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					this.favoriteLoading = false;
					return;
				}
				try {
					if (this.isFavorited) {
						if (!this.favoriteId) {
							await this.checkFavoriteStatus();
							if (!this.favoriteId) {
								uni.showToast({
									title: '收藏记录不存在',
									icon: 'none'
								});
								this.favoriteLoading = false;
								return;
							}
						}
						const deleteRes = await request({
							url: `${uni.$baseUrl}/api/user/favorite/${this.favoriteId}`,
							method: 'DELETE'
						});
						if (deleteRes.data.code === 0) {
							this.isFavorited = false;
							this.favoriteId = null;
							uni.showToast({
								title: '已取消收藏',
								icon: 'success'
							});
						} else if (deleteRes.data.code === 404) {
							this.isFavorited = false;
							this.favoriteId = null;
							uni.showToast({
								title: '收藏记录不存在',
								icon: 'none'
							});
						} else {
							throw new Error(deleteRes.data.message || '取消收藏失败');
						}
					} else {
						const res = await request({
							url: uni.$baseUrl + '/api/user/favorite',
							method: 'POST',
							data: {
								goods_id: this.goodsId
							}
						});
						if (res.data.code === 0) {
							this.isFavorited = true;
							this.favoriteId = res.data.data.favorite_id;
							uni.showToast({
								title: '收藏成功',
								icon: 'success'
							});
						} else if (res.data.code === 409) {
							// 已收藏过，重新检查状态
							this.isFavorited = true;
							await this.checkFavoriteStatus();
							uni.showToast({
								title: '您已收藏过该商品',
								icon: 'none'
							});
						} else {
							throw new Error(res.data.message || '收藏失败');
						}
					}
				} catch (error) {
					console.error('收藏操作失败', error);
					uni.showToast({
						title: error.message || '操作失败',
						icon: 'none'
					});
				} finally {
					this.favoriteLoading = false;
				}
			},
			showSoldOut() {
				uni.showToast({
					title: '商品已售罄',
					icon: 'none'
				});
			},
			selectAttribute(index, value) {
				if (this.goodsDetail.stock <= 0) return;
				this.$set(this.selectedAttributes, index, value);
				this.calculatePrice();
			},
			calculatePrice() {
				let finalPrice = this.basePrice;
				let absolutePrices = [];
				this.selectedAttributes.forEach((value, index) => {
					const attr = this.goodsDetail.attributes[index];
					if (attr && attr.prices && attr.values) {
						const valueIndex = attr.values.indexOf(value);
						if (valueIndex !== -1) {
							if (attr.is_absolute_price) {
								absolutePrices.push(attr.prices[valueIndex]);
							} else {
								finalPrice += attr.prices[valueIndex];
							}
						}
					}
				});
				// 绝对价：直接取该规格标价，不受基础价限制（否则"小一号"比基础价便宜时会被抬回去）
				// 加价模式：基础价 + 各属性加价，且不能低于基础价
				if (absolutePrices.length > 0) {
					finalPrice = Math.max(...absolutePrices);
				} else if (finalPrice < this.basePrice) {
					finalPrice = this.basePrice;
				}
				this.selectedPrice = finalPrice;
			},
			goMerchantShop() {
				if (this.merchantId) {
					uni.navigateTo({
						url: `/pages/shop/merchantShop?merchantId=${this.merchantId}`
					});
				} else {
					uni.showToast({
						title: '平台自营商品，无商家店铺',
						icon: 'none'
					});
				}
			},
			async fetchComments() {
				if (!this.goodsId) return;
				try {
					const [err, res] = await uni.request({
						url: `${uni.$baseUrl}/api/products/${this.goodsId}/reviews?page=1&page_size=3`,
						method: 'GET'
					});
					if (res.data.code === 0) {
						this.commentList = res.data.data.list.map(item => ({
							id: item.id,
							userName: item.user_name,
							content: item.content,
							createTime: item.created_at
							// 不显示图片和星星
						}));
						this.commentTotal = res.data.data.total;
					} else {
						this.commentList = [];
						this.commentTotal = 0;
					}
				} catch (error) {
					console.error('获取评价失败', error);
					this.commentList = [];
					this.commentTotal = 0;
				}
			},
			async getGoodsDetail() {
				if (!this.goodsId) return;
				uni.showLoading({
					title: '加载中...'
				});
				try {
					const userId = this.getCurrentUserId();
					if (userId && this.merchantId === userId) {
						this.isMerchantSelf = true;
					} else {
						this.isMerchantSelf = false;
					}

					const res = await uni.request({
						url: `${uni.$baseUrl}/api/goods/detail/${this.goodsId}`,
						method: 'GET',
						timeout: 10000,
						header: {
							'Content-Type': 'application/json'
						}
					});
					let response = Array.isArray(res) ? res[1] : res;
					if (response.statusCode !== 200) throw new Error(`请求失败，状态码: ${response.statusCode}`);
					if (response.data.code === 0) {
						const data = response.data.data;
						this.goodsDetail = data;
						this.basePrice = data.price;
						this.merchantId = data.merchant_id;
						this.merchantName = data.merchant_name || '平台自营';
						// 判断是否为自己的店铺
						const userId = this.getCurrentUserId();
						this.isMerchantSelf = (userId && this.merchantId === userId);
						// 获取商家头像
						if (this.merchantId && this.merchantId !== 0) {
							await this.getMerchantInfo();
						} else {
							this.merchantAvatar = '/static/images/user-avatar.jpg';
						}
						if (this.goodsDetail.attributes?.length) {
							this.selectedAttributes = this.goodsDetail.attributes.map(attr => attr.values[0]);
							this.calculatePrice();
						} else {
							this.selectedPrice = this.basePrice;
						}
					} else {
						throw new Error(response.data.message || '商品数据获取失败');
					}
				} catch (error) {
					console.error(error);
					uni.showToast({
						title: `加载失败: ${error.message || '网络错误'}`,
						icon: 'none',
						duration: 3000
					});
					// 开发环境使用模拟数据
					if (process.env.NODE_ENV === 'development') {
						this.goodsDetail = {
							id: this.goodsId,
							name: '模拟商品',
							price: 199,
							main_image: '/static/shop/rod1.webp',
							images: ['/static/shop/rod1.webp', '/static/shop/rod2.webp'],
							tags: ['碳纤维', '轻量化'],
							sales: 128,
							stock: 50,
							detail: '<p>模拟商品详情</p>',
							attributes: [{
								name: '颜色',
								values: ['黑色', '蓝色']
							}, {
								name: '尺寸',
								values: ['3.6米', '4.5米']
							}]
						};
						this.selectedAttributes = this.goodsDetail.attributes.map(attr => attr.values[0]);
					}
				} finally {
					uni.hideLoading();
				}
			},
			// 获取商家信息
			async getMerchantInfo() {
				if (!this.merchantId) return;
				try {
					const res = await uni.request({
						url: `${uni.$baseUrl}/api/shop/info?merchantId=${this.merchantId}`,
						method: 'GET'
					});
					if (res[1].data.code === 0) {
						const data = res[1].data.data;
						this.merchantAvatar = data.avatar || '/static/images/user-avatar.jpg';
						this.merchantName = data.shopName;
						this.merchantRating = data.rating; // 真实评分
						this.merchantFollowCount = data.followCount; // 真实粉丝数
					}
				} catch (e) {
					console.error('获取商家信息失败', e);
				}
			},
			// 加入购物车
			async addToCart() {
				if (!this.$store.state.isLoginStatus) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					return;
				}

				const res = await request({
					url: uni.$baseUrl + '/api/cart/add',
					method: 'POST',
					data: {
						product_id: this.goodsId,
						quantity: this.quantity,
						selected_attributes: this.selectedAttributes
					}
				});
				if (res.data.code === 0) {
					uni.showToast({
						title: '已加入购物车',
						icon: 'success'
					});
					setTimeout(() => {
						uni.navigateBack();
					}, 1000);
				} else {
					uni.showToast({
						title: res.data.message,
						icon: 'none'
					});
				}
			},
			// 判断是加入购物车还是立即购买
			confirmSku() {
				this.showSkuPopup = false;
				if (this.skuForCart) {
					this.addToCart();
				} else {
					this.goOrder(); // 立即购买
				}
				this.skuForCart = false;
			},
			goOrder() {
				this.skuForCart = false;
				const orderItem = {
					id: this.goodsId,
					item_type: 'product',
					name: this.goodsDetail.name,
					image: this.goodsDetail.main_image,
					attributes: this.selectedAttributes,
					quantity: this.quantity,
					unitPrice: this.selectedPrice,
					totalPrice: this.totalPrice,
					tags: this.goodsDetail.tags,
					stock: this.goodsDetail.stock,
					category: this.goodsDetail.category,
					merchant_id: this.merchantId
				};
				const orderItemStr = encodeURIComponent(JSON.stringify(orderItem));
				uni.navigateTo({
					url: `/pages/shop/order?orderItem=${orderItemStr}`
				});
			},
			goToAllReviews() {
				uni.navigateTo({
					url: `/pages/shop/productReviews?productId=${this.goodsId}&productName=${encodeURIComponent(this.goodsDetail.name)}`
				});
			}
		}
	}
</script>

<style lang="scss" scoped>
	.cart-btn {
		flex: 1;
		background-color: #5d7291;
		color: #fff;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		font-size: 24rpx;

		.u-icon {
			margin-bottom: 5rpx;
		}
	}

	.buy-btn {
		flex: 1;
	}

	// 商品详情
	.detail-images {
		.detail-image {
			width: 100%;
			margin-bottom: 20rpx;
			display: block;
			border-radius: 8rpx;
		}
	}

	.detail-text {
		font-size: 28rpx;
		color: #666;
		line-height: 1.6;
	}

	.empty-detail {
		text-align: center;
		font-size: 28rpx;
		color: #999;
		padding: 40rpx 0;
	}

	.wrap {
		padding-bottom: 120rpx;
		background-color: #f7f7f8;
	}

	/* 轮播图 */
	.swiper {
		height: 500rpx;
		background-color: #fff;
	}

	/* 商品信息 */
	.goods-info {
		background: #fff;
		padding: 30rpx;
		margin-bottom: 0; // 移除边距，紧贴下方区块
		position: relative;

		.price {
			color: #f38b11;
			font-size: 44rpx;
			font-weight: bold;
			margin-bottom: 15rpx;
		}

		.title {
			font-size: 32rpx;
			font-weight: bold;
			line-height: 1.5;
			margin-bottom: 20rpx;
		}

		.tags {
			display: flex;
			flex-wrap: wrap;
			gap: 10rpx;
			margin-bottom: 20rpx;
		}

		.sales {
			color: #999;
			font-size: 26rpx;
		}

		.sold-out-tag {
			position: absolute;
			top: 30rpx;
			right: 30rpx;
			z-index: 2;
		}
	}

	/* 商家卡片（全宽） */
	.merchant-card {
		background: #fff;
		padding: 24rpx 30rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1rpx solid #f0f0f0; // 分割线

		.merchant-info {
			display: flex;
			align-items: center;

			.merchant-avatar {
				margin-right: 20rpx;
			}

			.merchant-detail {
				.merchant-name {
					font-size: 32rpx;
					font-weight: bold;
					color: #333;
				}

				.merchant-stats {
					display: flex;
					gap: 20rpx;
					font-size: 24rpx;
					color: #999;
					margin-top: 8rpx;
				}
			}
		}
	}

	/* 通用区块样式（全宽，无左右外边距） */
	.comment-section,
	.detail-section,
	.extra-section {
		background: #fff;
		margin-bottom: 20rpx; // 下边距分隔，左右无边距
		padding: 24rpx 30rpx;
	}

	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		margin-bottom: 20rpx;
		padding-left: 15rpx;
		border-left: 8rpx solid #5d7291;
	}

	/* 评价列表 */
	.comment-item {
		border-bottom: 1rpx solid #f0f0f0;
		padding: 24rpx 0;

		&:last-child {
			border-bottom: none;
		}

		.comment-user {
			display: flex;
			align-items: center;
			margin-bottom: 16rpx;

			.user-avatar {
				margin-right: 16rpx;
			}

			.user-name {
				font-size: 28rpx;
				font-weight: 500;
				color: #333;
				margin-right: 20rpx;
			}

			.rating-stars {
				display: inline-flex;
				margin-left: 170rpx;
				margin-right: 20rpx;
			}

			.comment-time {
				font-size: 24rpx;
				color: #999;
			}
		}

		.comment-content {
			font-size: 28rpx;
			color: #666;
			line-height: 1.5;
		}
	}

	.empty-comment {
		text-align: center;
		font-size: 28rpx;
		color: #999;
		padding: 40rpx 0;
	}

	/* 商品详情内容 */
	.detail-content {
		padding: 20rpx 0;
	}

	/* 其他说明 */
	.extra-content {
		.extra-item {
			font-size: 28rpx;
			color: #666;
			line-height: 2;

			&::before {
				content: '•';
				margin-right: 16rpx;
				color: #5d7291;
			}
		}
	}

	/* 底部操作栏 */
	.footer {
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 100rpx;
		display: flex;
		background-color: #fff;
		box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);

		.action-btn {
			width: 180rpx;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			font-size: 24rpx;
			color: #666;

			&.favorited .u-icon,
			&.favorited text {
				color: #f38b11 !important;
			}

			.u-icon {
				margin-bottom: 5rpx;
			}
		}

		.buy-btn {
			flex: 1;
			height: 100rpx;
			line-height: 100rpx;
			background-color: #f38b11;
			color: #fff;
			font-size: 32rpx;
			border-radius: 0;

			&.disabled {
				background-color: #ccc !important;
			}
		}

		.disabled {
			opacity: 0.6;
			pointer-events: none;

			.u-icon,
			text {
				color: #c0c0c0 !important;
			}
		}
	}

	/* SKU弹窗样式 */
	.sku-popup {
		padding: 30rpx;

		.popup-header {
			display: flex;
			align-items: center;
			padding-bottom: 30rpx;
			border-bottom: 1rpx solid #eee;

			.u-icon {
				margin-right: 20rpx;
			}

			text {
				font-size: 32rpx;
				font-weight: bold;
			}
		}

		.sku-info {
			display: flex;
			padding: 30rpx 0;
			border-bottom: 1rpx solid #eee;

			.info {
				margin-left: 20rpx;

				.price {
					color: #f38b11;
					font-size: 36rpx;
					font-weight: bold;
					margin-bottom: 10rpx;
				}

				.stock {
					color: #999;
					font-size: 26rpx;
				}
			}
		}

		.sold-out-banner {
			background-color: #fff8f8;
			color: #e54d42;
			padding: 20rpx;
			text-align: center;
			font-size: 28rpx;
			margin-top: 20rpx;
			border-radius: 8rpx;
		}

		.sku-attributes {
			padding: 30rpx 0;
			border-bottom: 1rpx solid #eee;

			.attribute {
				margin-bottom: 40rpx;

				&:last-child {
					margin-bottom: 0;
				}

				.attr-name {
					font-size: 28rpx;
					margin-bottom: 20rpx;
					color: #333;
				}

				.attr-values {
					display: flex;
					flex-wrap: wrap;
					gap: 20rpx;

					.attr-value {
						padding: 10rpx 30rpx;
						border: 1rpx solid #ddd;
						border-radius: 8rpx;
						font-size: 26rpx;
						color: #333;

						&.selected {
							border-color: #f38b11;
							color: #f38b11;
							background-color: rgba(243, 139, 17, 0.1);
						}

						&.disabled {
							background-color: #f5f5f5 !important;
							color: #c0c0c0 !important;
							border-color: #e5e5e5 !important;
						}
					}
				}
			}
		}

		.quantity-select {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 40rpx 0;
			font-size: 28rpx;
		}

		.confirm-btn {
			height: 80rpx;
			line-height: 80rpx;
			background-color: #f38b11;
			color: #fff;
			font-size: 32rpx;
			border-radius: 40rpx;
			margin-top: 20rpx;

			&.disabled {
				background-color: #ccc !important;
			}
		}
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;

		.section-title {
			margin-bottom: 0;
			border-left: 8rpx solid #5d7291;
			padding-left: 15rpx;
		}

		.view-all {
			font-size: 26rpx;
			color: #5d7291;

			&:active {
				opacity: 0.6;
			}
		}
	}
</style>