<template>
	<view class="cart-page">
		<!-- 导航栏 -->
		<view class="custom-navbar">
			<view class="navbar-left"></view>
			<view class="navbar-title">购物车</view>
			<view class="navbar-right">
				<u-icon name="search" size="24" color="#000" @click="goToSearchPage" />
				<text class="manage-btn" @click="toggleEditMode">{{ isEditMode ? '完成' : '管理' }}</text>
			</view>
		</view>

		<!-- 空状态 -->
		<view v-if="cartList.length === 0" class="empty-cart">
			<u-empty mode="cart" text="购物车空空如也" />
			<button class="go-shop-btn" @click="goToShop">去逛逛</button>
		</view>

		<!-- 购物车内容 -->
		<view v-else class="cart-content">
			<view v-for="(group, merchantId) in groupedCart" :key="merchantId" class="merchant-group">
				<!-- 店铺头部 -->
				<view class="merchant-header">
					<view class="merchant-info">
						<checkbox :checked="shopCheckedStatus[merchantId]" color="#5d7291"
							@click="(e) => { e.stopPropagation(); toggleShopSelect(merchantId, !shopCheckedStatus[merchantId]); }" />
						<text class="merchant-name" @click="goToMerchantShop(merchantId)">
							{{ merchantNameMap[merchantId] || '平台自营' }}
						</text>
					</view>
					<u-icon name="arrow-right" size="24" color="#999" @click="goToMerchantShop(merchantId)" />
				</view>

				<!-- 商品列表 -->
				<view class="cart-items">
					<view v-for="item in group" :key="item.id" class="cart-item">
						<!-- 复选框 -->
						<view class="item-checkbox">
							<checkbox :checked="item.checked" @click="toggleItemCheck(item)" />
						</view>
						<!-- 图片 -->
						<u-image :src="getImageUrl(item.product_image || item.service_image)" width="160rpx"
							height="160rpx" class="item-image" />
						<!-- 信息区域 -->
						<view class="item-info">
							<text class="item-name">{{ item.product_name || item.service_name }}</text>
							<!-- 商品规格 -->
							<text
								v-if="item.item_type === 'product' && item.selected_attributes && item.selected_attributes.length"
								class="item-spec">
								规格：{{ (Array.isArray(item.selected_attributes) ? item.selected_attributes : []).join(' + ') }}
							</text>
							<!-- 服务预约信息 -->
							<text v-if="item.item_type === 'service'" class="item-spec">
								预约：{{ item.service_date }} {{ item.service_time_slot }} 人数：{{ item.participant_count }}
							</text>
							<text class="item-price">
								¥{{ item.item_type === 'product' 
							        ? (item.price * item.quantity).toFixed(2) 
							        : (item.price * (item.participant_count || 1)).toFixed(2) 
							    }}
							</text>
						</view>
						<!-- 操作区域 -->
						<view class="item-actions">
							<u-number-box v-if="item.item_type === 'product'" v-model="item.quantity" :min="1"
								:max="item.stock" @change="updateQuantity(item, $event.value)" />
							<picker v-else mode="selector" :range="peopleRange"
								@change="(e) => updateServiceParticipant(item, e)">
								<view class="people-selector">{{ item.participant_count }}人</view>
							</picker>
							<u-icon name="trash" size="28" color="#999" @click="deleteCartItem(item)" />
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 底部操作栏 -->
		<view class="cart-footer" v-if="cartList.length > 0" :style="{ bottom: tabBarHeight + 'px' }">
			<template v-if="!isEditMode">
				<view class="select-all">
					<checkbox :checked="allChecked" color="#5d7291" @click="toggleAll(!allChecked)" />
					<text>全选</text>
				</view>
				<view class="total-info">
					<text>合计：¥{{ totalPrice.toFixed(2) }}</text>
					<button class="checkout-btn" @click="checkout">结算({{ selectedCount }})</button>
				</view>
			</template>
			<template v-else>
				<view class="select-all">
					<checkbox :checked="allChecked" color="#5d7291" @click="toggleAll(!allChecked)" />
					<text>全选</text>
				</view>
				<view class="batch-actions">
					<button class="batch-delete-btn" :disabled="selectedCount === 0" @click="batchDelete">
						删除({{ selectedCount }})
					</button>
				</view>
			</template>
		</view>
	</view>
</template>

<script>
	import request from '@/common/request.js';

	export default {
		data() {
			return {
				cartList: [],
				isEditMode: false,
				merchantNameMap: {},
				tabBarHeight: 50,
				peopleRange: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
			}
		},
		computed: {
			groupedCart() {
				const grouped = {};
				this.cartList.forEach(item => {
					const mid = item.merchant_id || 0;
					if (!grouped[mid]) grouped[mid] = [];
					grouped[mid].push(item);
				});
				return grouped;
			},
			shopCheckedStatus() {
				const status = {};
				for (const mid in this.groupedCart) {
					const items = this.groupedCart[mid];
					status[mid] = items.length > 0 && items.every(item => item.checked === true);
				}
				return status;
			},
			allChecked() {
				return this.cartList.length > 0 && this.cartList.every(item => item.checked === true);
			},
			totalPrice() {
				return this.cartList.filter(item => item.checked).reduce((sum, item) => {
					let itemTotal;
					if (item.item_type === 'product') {
						itemTotal = item.price * item.quantity;
					} else {
						itemTotal = item.price * (item.participant_count || 1);
					}
					return sum + itemTotal;
				}, 0);
			},
			selectedCount() {
				return this.cartList.filter(item => item.checked).length;
			}
		},
		watch: {
			cartList: {
				deep: true,
				handler() {
					this.loadMissingMerchantNames();
				}
			}
		},
		mounted() {
			const systemInfo = uni.getSystemInfoSync();
			this.tabBarHeight = systemInfo.platform === 'ios' ? 50 : 56;
		},
		onShow() {
			this.loadCartList();
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
			async loadCartList() {
				const userId = this.getCurrentUserId();
				if (!userId) {
					this.cartList = [];
					return;
				}
				try {
					const res = await request({
						url: uni.$baseUrl + '/api/cart/list',
						method: 'GET'
					});
					if (res.data.code === 0) {
						this.cartList = res.data.data.map(item => ({
							...item,
							checked: false,
							selected_attributes: Array.isArray(item.selected_attributes) ? item
								.selected_attributes : (typeof item.selected_attributes === 'string' ? JSON
									.parse(item.selected_attributes) : [])
						}));
					}
				} catch (e) {
					uni.showToast({
						title: '加载购物车失败',
						icon: 'none'
					});
				}
			},
			async loadMissingMerchantNames() {
				const merchantIds = [...new Set(this.cartList.map(item => item.merchant_id).filter(id => id && !this
					.merchantNameMap[id]))];
				for (const mid of merchantIds) {
					try {
						const res = await request({
							url: `${uni.$baseUrl}/api/shop/info?merchantId=${mid}`,
							method: 'GET'
						});
						if (res.data.code === 0) {
							this.$set(this.merchantNameMap, mid, res.data.data.shopName);
						}
					} catch (e) {
						console.error('获取商家名称失败', e);
					}
				}
			},
			toggleItemCheck(item) {
				this.$set(item, 'checked', !item.checked);
			},
			toggleShopSelect(merchantId, checked) {
				const items = this.groupedCart[merchantId];
				if (items) {
					items.forEach(item => {
						this.$set(item, 'checked', checked);
					});
				}
			},
			toggleAll(checked) {
				this.cartList.forEach(item => {
					this.$set(item, 'checked', checked);
				});
			},
			async updateQuantity(item, newVal) {
				if (this.isEditMode) return;
				try {
					const res = await request({
						url: uni.$baseUrl + '/api/cart/update',
						method: 'POST',
						data: {
							cart_id: item.id,
							quantity: newVal
						}
					});
					if (res.data.code === 0) {
						item.quantity = newVal;
					} else {
						uni.showToast({
							title: res.data.message,
							icon: 'none'
						});
						this.loadCartList();
					}
				} catch (e) {
					uni.showToast({
						title: '更新失败',
						icon: 'none'
					});
				}
			},
			async deleteCartItem(item) {
				try {
					const res = await request({
						url: uni.$baseUrl + '/api/cart/delete',
						method: 'POST',
						data: {
							cart_id: item.id
						}
					});
					if (res.data.code === 0) {
						this.cartList = this.cartList.filter(i => i.id !== item.id);
						uni.showToast({
							title: '删除成功',
							icon: 'success'
						});
					} else {
						uni.showToast({
							title: '删除失败',
							icon: 'none'
						});
					}
				} catch (e) {
					uni.showToast({
						title: '删除失败',
						icon: 'none'
					});
				}
			},
			async batchDelete() {
				const selectedItems = this.cartList.filter(item => item.checked);
				if (selectedItems.length === 0) {
					uni.showToast({
						title: '请选择要删除的商品',
						icon: 'none'
					});
					return;
				}
				uni.showModal({
					title: '提示',
					content: `确定删除选中的 ${selectedItems.length} 件商品吗？`,
					success: async (res) => {
						if (res.confirm) {
							let successCount = 0;
							for (const item of selectedItems) {
								try {
									const resp = await request({
										url: uni.$baseUrl + '/api/cart/delete',
										method: 'POST',
										data: {
											cart_id: item.id
										}
									});
									if (resp.data.code === 0) successCount++;
								} catch (e) {}
							}
							if (successCount > 0) {
								this.cartList = this.cartList.filter(item => !item.checked);
								uni.showToast({
									title: `成功删除 ${successCount} 件`,
									icon: 'success'
								});
							} else {
								uni.showToast({
									title: '删除失败',
									icon: 'none'
								});
							}
						}
					}
				});
			},
			toggleEditMode() {
				this.isEditMode = !this.isEditMode;
				if (!this.isEditMode) {
					this.cartList.forEach(item => {
						this.$set(item, 'checked', false);
					});
				}
			},
			goToShop() {
				uni.switchTab({
					url: '/pages/shop/shop'
				});
			},
			goToSearchPage() {
				uni.navigateTo({
					url: '/pages/cart/cartSearch'
				});
			},
			goToMerchantShop(merchantId) {
				if (merchantId) {
					uni.navigateTo({
						url: `/pages/shop/merchantShop?merchantId=${merchantId}`
					});
				}
			},
			checkout() {
				const selectedItems = this.cartList.filter(item => item.checked);
				if (selectedItems.length === 0) {
					uni.showToast({
						title: '请选择商品',
						icon: 'none'
					});
					return;
				}
				const orderItems = selectedItems.map(item => {
					if (item.item_type === 'product') {
						return {
							item_type: 'product',
							product_id: item.product_id,
							product_name: item.product_name,
							product_image: item.product_image,
							attributes: item.selected_attributes || [],
							quantity: item.quantity,
							unit_price: item.price,
							stock: item.stock,
							merchant_id: item.merchant_id,
							category: item.category || ''
						};
					} else {
						return {
							item_type: 'service',
							service_id: item.service_id,
							name: item.service_name,
							image: item.service_image,
							unit_price: item.unit_price,
							participant_count: item.participant_count,
							service_date: item.service_date,
							service_time_slot: item.service_time_slot,
							merchant_id: item.merchant_id,
							address: item.address || '',
							is_competition: item.is_competition || false
						};
					}
				});
				const orderItemsStr = encodeURIComponent(JSON.stringify(orderItems));
				uni.navigateTo({
					url: `/pages/shop/order?orderItems=${orderItemsStr}`
				});
			},
			async updateServiceParticipant(item, e) {
				const newCount = this.peopleRange[e.detail.value];
				if (newCount === item.participant_count) return;
				if (!this.getCurrentUserId()) return;
				uni.showLoading({
					title: '更新中...'
				});
				try {
					const res = await request({
						url: uni.$baseUrl + '/api/cart/update_service',
						method: 'POST',
						data: {
							cart_id: item.id,
							participant_count: newCount
						}
					});
					if (res.data.code === 0) {
						item.participant_count = newCount;
					} else {
						uni.showToast({
							title: res.data.message || '更新失败',
							icon: 'none'
						});
					}
				} catch (e) {
					uni.showToast({
						title: '更新失败',
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
	.cart-page {
		background-color: #fff;
		min-height: 100vh;
		padding-top: 80rpx;
		padding-bottom: 120rpx;
	}

	.navbar-right {
		display: flex;
		align-items: center;
		gap: 30rpx;
		margin-right: 30rpx;

		.manage-btn {
			font-size: 28rpx;
			color: #000;
		}
	}

	.custom-navbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 999;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 30rpx;
		height: 88rpx;
		background-color: #fff;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);

		.navbar-left {
			width: 60rpx;
		}

		.navbar-title {
			font-size: 34rpx;
			font-weight: bold;
			color: #000;
			position: absolute;
			left: 50%;
			transform: translateX(-50%);
		}

		.navbar-right {
			display: flex;
			align-items: center;
			gap: 30rpx;

			.manage-btn {
				font-size: 28rpx;
				color: #000;
			}
		}
	}

	.empty-cart {
		text-align: center;
		padding-top: 200rpx;

		.go-shop-btn {
			margin-top: 40rpx;
			background: #5d7291;
			color: #fff;
			border-radius: 60rpx;
			width: 300rpx;
		}
	}

	.cart-content {
		padding: 20rpx;
	}

	.merchant-group {
		background: #fff;
		border-radius: 20rpx;
		margin-bottom: 20rpx;
		overflow: hidden;

		.merchant-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 24rpx 30rpx;
			background: #fafafa;
			border-bottom: 1rpx solid #eee;

			.merchant-info {
				display: flex;
				align-items: center;
				gap: 16rpx;
			}

			.merchant-name {
				font-size: 30rpx;
				font-weight: bold;
				color: #333;

				&:active {
					opacity: 0.6;
				}
			}
		}

		.cart-items {
			padding: 0 30rpx;
		}
	}

	.cart-item {
		display: flex;
		align-items: center;
		padding: 30rpx 0;
		border-bottom: 1rpx solid #f0f0f0;

		&:last-child {
			border-bottom: none;
		}

		.item-checkbox {
			margin-right: 20rpx;
			flex-shrink: 0;
		}

		.item-image {
			width: 160rpx;
			height: 160rpx;
			margin-right: 20rpx;
			flex-shrink: 0;
			border-radius: 12rpx;
		}

		.item-info {
			flex: 1;
			display: flex;
			flex-direction: column;
			justify-content: center;
			min-width: 0;

			.item-name {
				font-size: 30rpx;
				font-weight: bold;
				margin-bottom: 8rpx;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			.item-spec {
				font-size: 24rpx;
				color: #999;
				margin-bottom: 8rpx;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			.item-price {
				font-size: 32rpx;
				color: #f38b11;
				font-weight: bold;
			}
		}

		.item-actions {
			display: flex;
			flex-direction: column;
			align-items: flex-end;
			gap: 16rpx;
			flex-shrink: 0;

			.people-selector {
				background: #f5f5f5;
				padding: 8rpx 24rpx;
				border-radius: 60rpx;
				font-size: 26rpx;
				color: #333;
				text-align: center;
			}
		}
	}

	.cart-footer {
		position: fixed;
		left: 0;
		right: 0;
		background: #fff;
		padding: 20rpx 30rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);

		.select-all {
			display: flex;
			align-items: center;
			gap: 16rpx;
		}

		.total-info {
			display: flex;
			align-items: center;
			gap: 30rpx;

			.checkout-btn {
				background: #f38b11;
				color: #fff;
				border-radius: 60rpx;
				height: 70rpx;
				line-height: 70rpx;
				padding: 0 30rpx;
				font-size: 28rpx;
				border: none;
			}
		}

		.batch-actions {
			.batch-delete-btn {
				background: #e74c3c;
				color: #fff;
				border-radius: 60rpx;
				height: 70rpx;
				line-height: 70rpx;
				padding: 0 30rpx;
				font-size: 28rpx;
				border: none;

				&:disabled {
					background: #ccc;
					opacity: 0.6;
				}
			}
		}
	}
</style>