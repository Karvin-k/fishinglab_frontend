<template>
	<view class="dashboard">
		<u-navbar title="商家中心" :bgColor="'#5d7291'" :title-color="'#fff'" :back-text="'返回'"></u-navbar>

		<!-- 统计卡片（可扩展） -->
		<view class="stats-card">
			<view class="stat-item">
				<text class="label">我的商品</text>
				<text class="num">{{ productCount }}</text>
			</view>
			<view class="stat-item" v-if="fishingServiceCount !== null">
				<text class="label">钓场服务</text>
				<text class="num">{{ fishingServiceCount }}</text>
			</view>
		</view>

		<view class="menu-grid">
			<!-- 商品管理 -->
			<view class="menu-item" @click="navigateTo('/pages/merchant/productList')">
				<u-icon name="shopping-cart" size="48" color="#5d7291"></u-icon>
				<text>商品管理</text>
			</view>
			<view class="menu-item" @click="navigateTo('/pages/merchant/productEdit')">
				<u-icon name="plus" size="48" color="#5d7291"></u-icon>
				<text>发布商品</text>
			</view>
			<view class="menu-item" @click="navigateTo('/pages/merchant/merchantShopEdit')">
				<u-icon name="edit-pen" size="48" color="#5d7291"></u-icon>
				<text>编辑店铺</text>
			</view>
			<view class="menu-item" @click="goMyShop">
				<u-icon name="home" size="48" color="#5d7291"></u-icon>
				<text>我的店铺</text>
			</view>

			<!-- 钓场服务管理 -->
			<view class="menu-item" @click="navigateTo('/pages/merchant/fishingServiceList')">
				<u-icon name="map" size="48" color="#5d7291"></u-icon>
				<text>钓场管理</text>
			</view>
			<view class="menu-item" @click="navigateTo('/pages/merchant/fishingServiceEdit')">
				<u-icon name="plus-circle" size="48" color="#5d7291"></u-icon>
				<text>发布钓场</text>
			</view>
		</view>
	</view>
</template>

<script>
	import request from '@/common/request.js';
	export default {
		data() {
			return {
				productCount: 0,
				fishingServiceCount: null
			}
		},
		onShow() {
			this.fetchStats()
		},
		methods: {
			async fetchStats() {
				if (!this.$store.state.isLoginStatus) return;
				try {
					const productRes = await request({
						url: '/api/merchant/products',
						data: {
							page: 1,
							pageSize: 1
						}
					});
					if (productRes.data.code === 0) this.productCount = productRes.data.data.total;
				} catch (e) {
					console.error(e);
				}
				try {
					const serviceRes = await request({
						url: '/api/merchant/fishing_services',
						data: {
							page: 1,
							page_size: 1
						}
					});
					if (serviceRes.data.code === 0) this.fishingServiceCount = serviceRes.data.data.total;
				} catch (e) {
					console.error(e);
				}
			},
			navigateTo(url) {
				uni.navigateTo({
					url
				})
			},
			goMyShop() {
				const merchantId = this.$store.state.vuex_user_info?.id
				if (merchantId) {
					uni.navigateTo({
						url: `/pages/shop/merchantShop?merchantId=${merchantId}`
					})
				} else {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					})
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.dashboard {
		background-color: #f5f5f5;
		min-height: 100vh;
		padding-bottom: 40rpx;
	}

	.stats-card {
		background: #fff;
		margin: 30rpx;
		border-radius: 20rpx;
		padding: 40rpx 30rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
		display: flex;
		justify-content: space-around;

		.stat-item {
			flex: 1;
			text-align: center;

			.label {
				font-size: 28rpx;
				color: #666;
				display: block;
				margin-bottom: 16rpx;
			}

			.num {
				font-size: 48rpx;
				font-weight: bold;
				color: #f38b11;
			}
		}
	}

	.menu-grid {
		display: flex;
		flex-wrap: wrap;
		margin: 0 30rpx;
		gap: 30rpx;

		.menu-item {
			flex: 1;
			min-width: calc(33.33% - 20rpx);
			background: #fff;
			border-radius: 20rpx;
			padding: 40rpx 0;
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 20rpx;
			box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
			transition: all 0.2s;

			&:active {
				transform: scale(0.98);
			}

			text {
				font-size: 28rpx;
				color: #333;
			}
		}
	}
</style>