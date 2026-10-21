<template>
	<view class="collect-container">
		<!-- 自定义导航栏（无返回按钮，固定顶部） -->
		<view class="custom-navbar">
			<view class="navbar-left" @click="goBack">
				<u-icon name="arrow-left" size="24" color="#1a1a1a" />
			</view>
			<view class="navbar-title">我的收藏</view>
			<view class="navbar-right"></view>
		</view>

		<!-- 加载状态 -->
		<view v-if="loading" class="loading">
			<u-loading mode="circle" size="40" />
		</view>

		<!-- 空状态 -->
		<view v-else-if="favorites.length === 0" class="empty">
			<u-empty mode="favor" text="暂无收藏" />
			<button class="go-shopping" @click="goToShop">去逛逛</button>
		</view>

		<!-- 收藏列表 -->
		<scroll-view v-else scroll-y class="list" :style="{ height: scrollHeight + 'px' }">
			<view v-for="item in favorites" :key="item.id" class="favorite-item">
				<!-- 可点击区域（跳转商品详情） -->
				<view class="content" @click="goToDetail(item)">
					<view class="image-wrapper">
						<u-image :src="getImageUrl(item.goodsData.main_image)" width="180rpx" height="180rpx"
							border-radius="16rpx" mode="aspectFill" />
						<!-- 第一个标签作为角标（可选） -->
						<view v-if="item.goodsData.tags && item.goodsData.tags.length" class="tag-badge">
							<u-tag :text="item.goodsData.tags[0]" type="error" size="mini" shape="circle" />
						</view>
					</view>

					<view class="info">
						<text class="title">{{ item.goodsData.name }}</text>
						<!-- 标签行（最多显示3个） -->
						<view class="tags" v-if="item.goodsData.tags && item.goodsData.tags.length > 1">
							<u-tag v-for="(tag, idx) in item.goodsData.tags.slice(1, 4)" :key="idx" :text="tag"
								type="info" size="mini" shape="circle" bg-color="#5d7291" color="#fff" />
						</view>
						<view class="price-row">
							<text class="price">¥{{ item.goodsData.price.toFixed(2) }}</text>
							<text class="sales">月销 {{ item.goodsData.sales || 0 }} 件</text>
						</view>
					</view>
				</view>

				<!-- 删除按钮 -->
				<view class="delete-btn" @tap.stop="removeFavorite(item.id)">
					<u-icon name="trash" size="32" color="#ccc" />
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	import request from '@/common/request.js';
	export default {
		data() {
			return {
				loading: true,
				favorites: [],
				scrollHeight: 0
			}
		},
		onShow() {
			this.loadFavorites();
			this.getScrollHeight();
		},
		methods: {
			goBack() {
				uni.navigateBack();
			},
			// 计算滚动区域高度（减去导航栏高度）
			getScrollHeight() {
				const systemInfo = uni.getSystemInfoSync();
				// 导航栏高度 88rpx 转换为 px
				const navbarHeight = uni.upx2px(88);
				this.scrollHeight = systemInfo.windowHeight - navbarHeight;
			},
			// 处理图片URL（与购物车页面一致）
			getImageUrl(url) {
				if (!url) return '';
				if (url.startsWith('http') || url.startsWith('data:')) return url;
				return uni.$imgUrl(url);
			},
			async loadFavorites() {
				if (!this.$store.state.isLoginStatus) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					return;
				}
				this.loading = true;
				try {
					const res = await request({
					    url: uni.$baseUrl + '/api/user/favorite',
					    method: 'GET'
					});
					if (res.data.code === 0) {
					    this.favorites = res.data.data.map(item => {
					        let goodsData = typeof item.goods_data === 'string' ? JSON.parse(item.goods_data) : item.goods_data;
					        if (!goodsData.main_image) {
					            goodsData.main_image = '/static/images/default-goods.png';
					        }
					        return { ...item, goodsData };
					    });
					} else {
					    uni.showToast({ title: res.data.message || '加载失败', icon: 'none' });
					}
				} catch (error) {
					console.error('获取收藏列表失败', error);
					uni.showToast({
						title: '网络错误',
						icon: 'none'
					});
				} finally {
					this.loading = false;
				}
			},
			goToDetail(item) {
				uni.navigateTo({
					url: `/pages/shop/detail?id=${item.goods_id}`
				});
			},
			async removeFavorite(id) {
				uni.showModal({
					title: '提示',
					content: '确定取消收藏该商品吗？',
					success: async (res) => {
						if (res.confirm) {
							uni.showLoading({
								title: '删除中...',
								mask: true
							});
							try {
								await request({
								    url: `${uni.$baseUrl}/api/user/favorite/${id}`,
								    method: 'DELETE'
								});
								this.favorites = this.favorites.filter(item => item.id !== id);
								uni.showToast({
									title: '已删除',
									icon: 'success'
								});
							} catch (error) {
								console.error('删除收藏失败', error);
								uni.showToast({
									title: '删除失败',
									icon: 'none'
								});
							} finally {
								uni.hideLoading();
							}
						}
					}
				});
			},
			goToShop() {
				uni.switchTab({
					url: '/pages/shop/shop'
				});
			}
		}
	}
</script>

<style lang="scss" scoped>
	.collect-container {
		background-color: #f8f8f8;
		min-height: 100vh;
	}

	/* 自定义固定导航栏 */
	.custom-navbar {
		.navbar-left {
			width: 60rpx;
			height: 100%;
			display: flex;
			align-items: center;
			justify-content: flex-start;
			// 扩大点击热区
			padding: 10rpx 0;
		}

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
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03);
		margin-bottom: 30rpx;

		.navbar-left,
		.navbar-right {
			width: 60rpx;
		}

		.navbar-title {
			font-size: 34rpx;
			font-weight: 600;
			color: #1a1a1a;
		}
	}

	.loading {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
	}

	.empty {
		text-align: center;
		padding-top: 200rpx;

		.go-shopping {
			margin-top: 40rpx;
			width: 240rpx;
			background-color: #f38b11;
			color: #fff;
			border-radius: 60rpx;
			border: none;
			font-size: 28rpx;
		}
	}

	.list {
		padding: 20rpx;
		margin-top: 100rpx;
		box-sizing: border-box;
	}

	.favorite-item {
		display: flex;
		align-items: center;
		background: #fff;
		border-radius: 24rpx;
		padding: 24rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
		transition: all 0.25s ease;
		position: relative;
		overflow: hidden;

		&::after {
			content: '';
			position: absolute;
			left: 0;
			top: 20rpx;
			bottom: 20rpx;
			width: 6rpx;
			background: linear-gradient(180deg, #5d7291, #f38b11);
			border-radius: 0 4rpx 4rpx 0;
			opacity: 0;
			transition: opacity 0.2s;
		}

		&:active {
			transform: translateY(2rpx);
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);

			&::after {
				opacity: 1;
			}
		}

		.content {
			flex: 1;
			display: flex;
			align-items: center;
			gap: 20rpx;
		}

		.image-wrapper {
			position: relative;
			flex-shrink: 0;

			.tag-badge {
				position: absolute;
				top: -8rpx;
				right: -8rpx;
				z-index: 2;
			}
		}

		.info {
			flex: 1;
			min-width: 0; // 防止文字溢出

			.title {
				font-size: 30rpx;
				font-weight: 600;
				color: #1a1a1a;
				display: -webkit-box;
				-webkit-box-orient: vertical;
				-webkit-line-clamp: 2;
				overflow: hidden;
				line-height: 1.4;
				margin-bottom: 12rpx;
			}

			.tags {
				display: flex;
				flex-wrap: wrap;
				gap: 12rpx;
				margin-bottom: 16rpx;
			}

			.price-row {
				display: flex;
				justify-content: space-between;
				align-items: baseline;

				.price {
					font-size: 36rpx;
					font-weight: bold;
					color: #f38b11;

					&::before {
						content: '¥';
						font-size: 28rpx;
						margin-right: 4rpx;
					}
				}

				.sales {
					font-size: 24rpx;
					color: #999;
				}
			}
		}

		.delete-btn {
			padding-left: 20rpx;
			flex-shrink: 0;

			&:active {
				transform: scale(0.92);
			}
		}
	}
</style>