<template>
	<view class="merchant-shop">
		<!-- 固定顶部导航栏（返回 + 搜索） -->
		<view class="custom-nav">
			<view class="nav-left" @click="goBack">
				<u-icon name="arrow-left" size="24" color="#fff" />
			</view>
			<view class="nav-center" @click="goToSearchPage">
				<view class="fake-search">
					<u-icon name="search" size="18" color="#999" />
					<text class="placeholder">搜索本店商品</text>
				</view>
			</view>
			<view class="nav-right"></view>
		</view>

		<!-- 可滚动区域（商家头部 + Tab栏 + 内容） -->
		<scroll-view scroll-y class="scroll-container">
			<!-- 商家头部信息 -->
			<view class="shop-header">
				<view class="avatar-box">
					<u-image width="120rpx" height="120rpx" shape="circle" :src="getImageUrl(shopInfo.avatar)"
						class="shop-avatar" />
				</view>
				<view class="shop-info">
					<text class="shop-name">{{ shopInfo.shopName }}</text>
					<view class="shop-stats">
						<text>粉丝 {{ shopInfo.followCount }}</text>
						<text>商品 {{ shopInfo.productCount }}</text>
					</view>
					<view class="shop-rating">
					    <u-rate v-model="shopInfo.rating" disabled :count="5" :size="24" />
					    <text class="rating-text">{{ shopInfo.rating.toFixed(1) }}分</text>
					</view>
					<text class="shop-desc">{{ shopInfo.description || '暂无简介' }}</text>
				</view>
				<view v-if="!isSelfShop" class="follow-btn" :class="{ followed: isFollowed }" @click="toggleFollow">
					<view class="btn-content">{{ isFollowed ? '已关注' : '+ 关注' }}</view>
				</view>
			</view>

			<!-- Tab 栏（首页、宝贝、新品、服务） -->
			<view class="tab-bar">
				<view class="tab-item" :class="{ active: currentTab === 'home' }" @click="switchTab('home')">首页</view>
				<view class="tab-item" :class="{ active: currentTab === 'product' }" @click="switchTab('product')">宝贝
				</view>
				<view class="tab-item" :class="{ active: currentTab === 'new' }" @click="switchTab('new')">新品</view>
				<view class="tab-item" :class="{ active: currentTab === 'service' }" @click="switchTab('service')">服务
				</view>
			</view>

			<!-- 首页内容（店铺介绍） -->
			<view v-show="currentTab === 'home'" class="home-content">
				<view class="intro-title">店铺介绍</view>
				<rich-text :nodes="shopInfo.intro" class="intro-text"></rich-text>
				<view class="intro-images" v-if="shopInfo.introImages && shopInfo.introImages.length">
					<image v-for="(img, idx) in shopInfo.introImages" :key="idx" :src="getImageUrl(img)" mode="widthFix"
						class="intro-img"></image>
				</view>
			</view>

			<!-- 商品列表（宝贝） -->
			<view v-show="currentTab === 'product'" class="content-list">
				<view class="filter-bar">
					<scroll-view scroll-x class="category-scroll">
						<view class="category-list">
							<view class="category-item" :class="{ active: selectedCategory === '' }"
								@click="selectCategory('')">全部</view>
							<view class="category-item" :class="{ active: selectedCategory === 'rod' }"
								@click="selectCategory('rod')">鱼竿</view>
							<view class="category-item" :class="{ active: selectedCategory === 'bait' }"
								@click="selectCategory('bait')">鱼饵</view>
							<view class="category-item" :class="{ active: selectedCategory === 'accessory' }"
								@click="selectCategory('accessory')">配件</view>
						</view>
					</scroll-view>
					<view class="sort-bar">
						<view class="sort-item" :class="{ active: sortType === 'comprehensive' }"
							@click="setSort('comprehensive')">综合</view>
						<view class="sort-item" :class="{ active: sortType === 'sales' }" @click="setSort('sales')">销量
						</view>
						<view class="sort-item" :class="{ active: sortType === 'price_asc' }"
							@click="setSort('price_asc')">价格升序</view>
						<view class="sort-item" :class="{ active: sortType === 'price_desc' }"
							@click="setSort('price_desc')">价格降序</view>
						<view class="layout-switch" @click="toggleLayout">
							<u-icon :name="layoutType === 'grid' ? 'grid' : 'list'" size="32" color="#666" />
						</view>
					</view>
				</view>
				<view v-if="layoutType === 'grid'" class="product-grid">
					<view class="product-card" v-for="item in productList" :key="item.id" @click="goDetail(item)">
						<u-image width="100%" height="300rpx" :src="getImageUrl(item.pic_url)" mode="aspectFill" />
						<view class="info">
							<text class="title">{{ item.name }}</text>
							<text class="price">¥{{ item.price }}</text>
						</view>
					</view>
				</view>
				<view v-else class="product-list">
					<view class="product-item" v-for="item in productList" :key="item.id" @click="goDetail(item)">
						<u-image width="200rpx" height="200rpx" :src="getImageUrl(item.pic_url)" mode="aspectFill"
							class="product-img" />
						<view class="product-info">
							<text class="title">{{ item.name }}</text>
							<text class="price">¥{{ item.price }}</text>
							<text class="sales">月销 {{ item.sales || 0 }} 件</text>
						</view>
					</view>
				</view>
				<u-loadmore :status="loadStatus" @loadmore="loadMore('product')" />
				<view class="bottom-placeholder"></view>
			</view>

			<!-- 新品列表 -->
			<view v-show="currentTab === 'new'" class="content-list">
				<view v-if="layoutType === 'grid'" class="product-grid">
					<view class="product-card" v-for="item in newProductList" :key="item.id" @click="goDetail(item)">
						<u-image width="100%" height="300rpx" :src="getImageUrl(item.pic_url)" mode="aspectFill" />
						<view class="info">
							<text class="title">{{ item.name }}</text>
							<text class="price">¥{{ item.price }}</text>
						</view>
					</view>
				</view>
				<view v-else class="product-list">
					<view class="product-item" v-for="item in newProductList" :key="item.id" @click="goDetail(item)">
						<u-image width="200rpx" height="200rpx" :src="getImageUrl(item.pic_url)" mode="aspectFill"
							class="product-img" />
						<view class="product-info">
							<text class="title">{{ item.name }}</text>
							<text class="price">¥{{ item.price }}</text>
							<text class="sales">月销 {{ item.sales || 0 }} 件</text>
						</view>
					</view>
				</view>
				<u-loadmore :status="newLoadStatus" @loadmore="loadMore('new')" />
				<view class="bottom-placeholder"></view>
			</view>

			<!-- 服务列表 -->
			<view v-show="currentTab === 'service'" class="content-list">
				<!-- 服务类型筛选栏 -->
				<view class="service-filter-bar">
					<view class="filter-tabs">
						<view v-for="option in serviceFilterOptions" :key="option.value" class="filter-tab"
							:class="{ active: serviceFilter === option.value }"
							@click="changeServiceFilter(option.value)">
							{{ option.label }}
						</view>
					</view>
				</view>
				<view class="service-list">
					<view class="service-card" v-for="item in filteredServiceList" :key="item.id"
						@click="goServiceDetail(item.id)">
						<u-image :src="getImageUrl(item.cover_image)" width="160rpx" height="160rpx"
							border-radius="12" />
						<view class="service-info">
							<text class="name">{{ item.name }}</text>
							<text
								class="price">¥{{ item.price }}{{ item.service_type === 'regular' ? '/天' : '/人' }}</text>
							<view class="tags">
								<text class="tag" :class="{ competition: item.service_type === 'competition' }">
									{{ item.service_type === 'regular' ? '开钓服务' : '比赛服务' }}
								</text>
								<text v-if="item.is_end" class="tag end">已结束</text>
							</view>
						</view>
					</view>
				</view>
				<u-loadmore :status="serviceLoadStatus" @loadmore="loadMore('service')" />
				<view v-if="serviceList.length === 0 && !serviceLoading" class="empty-tip">暂无钓场服务</view>
				<view class="bottom-placeholder"></view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	import request from '@/common/request.js';

	export default {
		data() {
			return {
				merchantId: null,
				shopInfo: {
					shopName: '',
					avatar: '',
					description: '',
					intro: '',
					introImages: [],
					followCount: 0,
					productCount: 0,
					rating: 4.8
				},
				isFollowed: false,
				isSelfShop: false,
				currentTab: 'home', // home, product, new, service
				selectedCategory: '',
				sortType: 'comprehensive',
				layoutType: 'grid',
				// 商品列表
				productList: [],
				productPage: 1,
				productTotal: 0,
				loadStatus: 'loadmore',
				loading: false,
				// 新品列表
				newProductList: [],
				newPage: 1,
				newTotal: 0,
				newLoadStatus: 'loadmore',
				newLoading: false,
				// 服务列表（注意：获取某商家的服务列表暂无公开接口，此处调用的是商家自己的管理接口。
				// 如果当前登录用户不是该商家，该接口会返回空或403。实际项目中应使用公共接口。）
				serviceList: [],
				servicePage: 1,
				serviceTotal: 0,
				serviceLoadStatus: 'loadmore',
				serviceLoading: false,
				serviceFilterOptions: [{
						label: '全部',
						value: 'all'
					},
					{
						label: '开钓服务',
						value: 'regular'
					},
					{
						label: '比赛服务',
						value: 'competition'
					}
				],
				serviceFilter: 'all', // 当前选中的筛选类型
			}
		},
		computed: {
			filteredServiceList() {
				if (this.serviceFilter === 'all') return this.serviceList;
				return this.serviceList.filter(item => item.service_type === this.serviceFilter);
			}
		},
		onLoad(options) {
			this.merchantId = options.merchantId
			this.fetchShopInfo()
			this.fetchProducts()
			this.fetchNewProducts()
			this.fetchServices()
		},
		methods: {
			getImageUrl(url) {
				if (!url) return ''
				if (url.startsWith('http') || url.startsWith('data:')) return url
				return uni.$imgUrl(url);},
			getCurrentUserId() {
				let userInfo = this.$store.state.vuex_user_info || uni.getStorageSync('vuex_user_info')
				return userInfo?.id || null
			},
			goBack() {
				uni.navigateBack()
			},
			goToSearchPage() {
				uni.navigateTo({
					url: `/pages/shop/searchPage?merchantId=${this.merchantId}`
				})
			},
			// 获取店铺基本信息（公开接口）
			async fetchShopInfo() {
				try {
					const res = await request({
						url: `/api/shop/info?merchantId=${this.merchantId}`,
						method: 'GET'
					})
					if (res.data.code === 0) {
						this.shopInfo = res.data.data
						const userId = this.getCurrentUserId()
						if (userId && Number(userId) === Number(this.merchantId)) {
							this.isSelfShop = true
						}
						if (userId && !this.isSelfShop) {
							// 检查关注状态（需要登录，请求会自动携带 token）
							const followRes = await request({
							    url: `/api/shop/follow/check?merchantId=${this.merchantId}`,
							    method: 'GET'
							})
							if (followRes.data.code === 0) {
								this.isFollowed = followRes.data.data.followed
							}
						}
					}
				} catch (error) {
					console.error('获取店铺信息失败', error)
				}
			},
			// 关注/取消关注
			async toggleFollow() {
				if (!this.$store.state.isLoginStatus) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					})
					return
				}
				try {
					// 关注/取消关注
					const res = await request({
					    url: '/api/shop/follow',
					    method: 'POST',
					    data: {
					        merchantId: this.merchantId,
					        action: this.isFollowed ? 'unfollow' : 'follow'
					    }
					})
					if (res.data.code === 0) {
						this.isFollowed = !this.isFollowed
						this.shopInfo.followCount += this.isFollowed ? 1 : -1
						uni.showToast({
							title: this.isFollowed ? '关注成功' : '已取消关注',
							icon: 'success'
						})
					} else {
						uni.showToast({
							title: res.data.message || '操作失败',
							icon: 'none'
						})
					}
				} catch (error) {
					console.error('关注操作失败', error)
					uni.showToast({
						title: '网络错误',
						icon: 'none'
					})
				}
			},
			switchTab(tab) {
				this.currentTab = tab
				if (tab === 'product') this.fetchProducts()
				else if (tab === 'new') this.fetchNewProducts()
				else if (tab === 'service') this.fetchServices()
				// home 无需加载数据
			},
			selectCategory(cat) {
				this.selectedCategory = cat
				this.productPage = 1
				this.productList = []
				this.fetchProducts()
			},
			setSort(type) {
				this.sortType = type
				this.productPage = 1
				this.productList = []
				this.fetchProducts()
			},
			toggleLayout() {
				this.layoutType = this.layoutType === 'grid' ? 'list' : 'grid'
			},
			// 获取店铺商品（公开接口，无需登录）
			async fetchProducts(isLoadMore = false) {
				if (this.loading) return
				if (!isLoadMore) {
					this.loading = true
					this.loadStatus = 'loading'
				} else {
					if (this.loadStatus === 'nomore') return
					this.loadStatus = 'loading'
				}
				try {
					const res = await request({
						url: '/api/shop/products',
						method: 'GET',
						data: {
							merchantId: this.merchantId,
							category: this.selectedCategory,
							sort: this.sortType,
							page: this.productPage,
							pageSize: 10
						}
					})
					if (res.data.code === 0) {
						const newList = res.data.data.list
						if (isLoadMore) {
							this.productList = [...this.productList, ...newList]
						} else {
							this.productList = newList
						}
						this.productTotal = res.data.data.total
						this.loadStatus = this.productList.length >= this.productTotal ? 'nomore' : 'loadmore'
						if (!isLoadMore) this.loading = false
					} else {
						this.loadStatus = 'loadmore'
						this.loading = false
					}
				} catch (error) {
					console.error('获取商品列表失败', error)
					this.loadStatus = 'loadmore'
					this.loading = false
				}
			},
			// 获取新品列表（同样使用 /api/shop/products，排序为 new）
			async fetchNewProducts(isLoadMore = false) {
				if (this.newLoading) return
				if (!isLoadMore) {
					this.newLoading = true
					this.newLoadStatus = 'loading'
				} else {
					if (this.newLoadStatus === 'nomore') return
					this.newLoadStatus = 'loading'
				}
				try {
					const res = await request({
						url: '/api/shop/products',
						method: 'GET',
						data: {
							merchantId: this.merchantId,
							sort: 'new',
							page: this.newPage,
							pageSize: 10
						}
					})
					if (res.data.code === 0) {
						const newList = res.data.data.list
						if (isLoadMore) {
							this.newProductList = [...this.newProductList, ...newList]
						} else {
							this.newProductList = newList
						}
						this.newTotal = res.data.data.total
						this.newLoadStatus = this.newProductList.length >= this.newTotal ? 'nomore' : 'loadmore'
						if (!isLoadMore) this.newLoading = false
					} else {
						this.newLoadStatus = 'loadmore'
						this.newLoading = false
					}
				} catch (error) {
					console.error('获取新品列表失败', error)
					this.newLoadStatus = 'loadmore'
					this.newLoading = false
				}
			},
			// 获取店铺的服务列表
			async fetchServices(isLoadMore = false) {
			    if (this.serviceLoading) return
			    if (!isLoadMore) {
			        this.servicePage = 1
			        this.serviceList = []
			    }
			    if (this.serviceLoadStatus === 'nomore' && isLoadMore) return
			    this.serviceLoading = true
			    this.serviceLoadStatus = 'loading'
			    try {
			        const res = await request({
			            url: '/api/fishing/services/by_merchant',
			            method: 'GET',
			            data: {
			                merchant_id: this.merchantId,
			                page: this.servicePage,
			                page_size: 10
			            }
			        })
			        if (res.data.code === 0) {
			            const newList = res.data.data.list
			            if (isLoadMore) {
			                this.serviceList = [...this.serviceList, ...newList]
			            } else {
			                this.serviceList = newList
			            }
			            this.serviceTotal = res.data.data.total
			            this.serviceLoadStatus = this.serviceList.length >= this.serviceTotal ? 'nomore' : 'loadmore'
			            if (!isLoadMore) this.servicePage++
			        } else {
			            this.serviceLoadStatus = 'loadmore'
			        }
			    } catch (error) {
			        console.error('获取服务列表失败', error)
			        this.serviceLoadStatus = 'loadmore'
			    } finally {
			        this.serviceLoading = false
			    }
			},
			changeServiceFilter(filterType) {
				this.serviceFilter = filterType;
				// 由于服务列表是前端过滤，若需要重新从后端获取，可放开以下代码并修改后端接口
				// this.servicePage = 1;
				// this.serviceList = [];
				// this.fetchServices();
			},
			loadMore(type) {
				if (type === 'product') {
					if (this.loadStatus === 'nomore') return
					this.productPage++
					this.fetchProducts(true)
				} else if (type === 'new') {
					if (this.newLoadStatus === 'nomore') return
					this.newPage++
					this.fetchNewProducts(true)
				} else if (type === 'service') {
					if (this.serviceLoadStatus === 'nomore') return
					this.servicePage++
					this.fetchServices(true)
				}
			},
			goDetail(item) {
				const productJson = encodeURIComponent(JSON.stringify(item))
				uni.navigateTo({
					url: `/pages/shop/detail?product=${productJson}`
				})
			},
			goServiceDetail(id) {
				uni.navigateTo({
					url: `/pages/shop/pond-detail?id=${id}`
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	.merchant-shop {
		background-color: #f8f8f8;
		height: 100vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	/* 固定顶部导航栏 */
	.custom-nav {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		padding: 60rpx 30rpx 20rpx;
		background: #5d7291;
		display: flex;
		align-items: center;
		z-index: 20;

		.nav-left {
			margin-right: 20rpx;
		}

		.nav-center {
			flex: 1;
		}

		.fake-search {
			background-color: #f5f5f5;
			border-radius: 60rpx;
			height: 70rpx;
			display: flex;
			align-items: center;
			padding: 0 30rpx;

			.u-icon {
				margin-right: 16rpx;
			}

			.placeholder {
				font-size: 28rpx;
				color: #999;
			}
		}

		.nav-right {
			width: 60rpx;
		}
	}

	/* 滚动容器（宽度100%占满） */
	.scroll-container {
		width: 100%;
		margin-top: 130rpx;
		height: calc(100vh - 130rpx);
		box-sizing: border-box;
	}

	/* 商家头部 */
	.shop-header {
		background: #5d7291;
		padding: 40rpx 30rpx;
		display: flex;
		align-items: center;
		color: #fff;

		.avatar-box {
			margin-right: 20rpx;

			.shop-avatar {
				border: 4rpx solid #fff;
			}
		}

		.shop-info {
			flex: 1;

			.shop-name {
				font-size: 36rpx;
				font-weight: bold;
				display: block;
				margin-bottom: 12rpx;
			}

			.shop-stats {
				display: flex;
				gap: 30rpx;
				font-size: 24rpx;
				margin-bottom: 12rpx;
			}

			.shop-rating {
				display: flex;
				align-items: center;
				margin-bottom: 12rpx;

				.rating-text {
					font-size: 24rpx;
					margin-left: 16rpx;
				}
			}

			.shop-desc {
				font-size: 26rpx;
				opacity: 0.9;
			}
		}

		.follow-btn {
			background-color: #f38b11;
			border-radius: 60rpx;
			padding: 12rpx 24rpx;
			min-width: 100rpx;
			text-align: center;

			.btn-content {
				color: #fff;
				font-size: 28rpx;
			}

			&.followed {
				background-color: #ccc;
			}
		}
	}

	/* Tab 栏 */
	.tab-bar {
		display: flex;
		background: #fff;
		border-radius: 0 0 60rpx 60rpx;
		margin-bottom: 20rpx;
		padding: 8rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);

		.tab-item {
			flex: 1;
			text-align: center;
			padding: 20rpx 0;
			font-size: 28rpx;
			color: #666;
			border-radius: 60rpx;
			transition: all 0.2s;

			&.active {
				background: #5d7291;
				color: #fff;
				font-weight: bold;
			}
		}
	}

	/* 首页内容（店铺介绍） */
	.home-content {
		background: #fff;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 20rpx;

		.intro-title {
			font-size: 32rpx;
			font-weight: bold;
			margin-bottom: 20rpx;
		}

		.intro-text {
			font-size: 28rpx;
			color: #666;
			line-height: 1.6;
		}

		.intro-images {
			margin-top: 30rpx;

			.intro-img {
				width: 100%;
				margin-bottom: 20rpx;
				border-radius: 12rpx;
			}
		}
	}

	/* 筛选栏 */
	.filter-bar {
		background: #fff;
		border-radius: 20rpx;
		margin-bottom: 20rpx;
		padding: 20rpx 0;

		.category-scroll {
			white-space: nowrap;
			padding: 0 20rpx;

			.category-list {
				display: inline-flex;
				gap: 40rpx;

				.category-item {
					display: inline-block;
					font-size: 28rpx;
					color: #666;
					padding-bottom: 10rpx;

					&.active {
						color: #5d7291;
						font-weight: bold;
						border-bottom: 4rpx solid #5d7291;
					}
				}
			}
		}

		.sort-bar {
			display: flex;
			align-items: center;
			padding: 20rpx 20rpx 0;

			.sort-item {
				font-size: 26rpx;
				color: #666;
				margin-right: 30rpx;

				&.active {
					color: #5d7291;
					font-weight: bold;
				}
			}

			.layout-switch {
				margin-left: auto;
			}
		}
	}

	/* 商品网格/列表样式 */
	.product-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 20rpx;

		.product-card {
			width: calc(50% - 10rpx);
			background: #fff;
			border-radius: 20rpx;
			overflow: hidden;

			.info {
				padding: 20rpx;

				.title {
					font-size: 28rpx;
					font-weight: 500;
					display: block;
					margin-bottom: 10rpx;
				}

				.price {
					color: #f38b11;
					font-size: 32rpx;
					font-weight: bold;
				}
			}
		}
	}

	.product-list {
		.product-item {
			background: #fff;
			border-radius: 20rpx;
			margin-bottom: 20rpx;
			padding: 20rpx;
			display: flex;
			gap: 20rpx;

			.product-img {
				border-radius: 12rpx;
			}

			.product-info {
				flex: 1;

				.title {
					font-size: 28rpx;
					font-weight: 500;
					display: block;
					margin-bottom: 12rpx;
				}

				.price {
					color: #f38b11;
					font-size: 32rpx;
					font-weight: bold;
					display: block;
					margin-bottom: 8rpx;
				}

				.sales {
					font-size: 24rpx;
					color: #999;
				}
			}
		}
	}

	.service-filter-bar {
		background: #fff;
		border-radius: 20rpx;
		margin-bottom: 20rpx;
		padding: 20rpx 0;

		.filter-tabs {
			display: flex;
			gap: 40rpx;
			padding: 0 20rpx;

			.filter-tab {
				font-size: 28rpx;
				color: #666;
				padding-bottom: 10rpx;
				position: relative;

				&.active {
					color: #5d7291;
					font-weight: bold;

					&::after {
						content: '';
						position: absolute;
						bottom: -2rpx;
						left: 0;
						right: 0;
						height: 4rpx;
						background: #5d7291;
						border-radius: 2rpx;
					}
				}
			}
		}
	}

	/* 服务列表样式 */
	.service-list {
		.service-card {
			background: #fff;
			border-radius: 20rpx;
			margin-bottom: 20rpx;
			padding: 24rpx;
			display: flex;
			align-items: center;

			.service-info {
				flex: 1;
				margin-left: 20rpx;

				.name {
					font-size: 30rpx;
					font-weight: bold;
					display: block;
					margin-bottom: 8rpx;
				}

				.price {
					font-size: 32rpx;
					color: #f38b11;
					font-weight: bold;
				}

				.tags {
					display: flex;
					gap: 16rpx;
					margin-top: 12rpx;

					.tag {
						font-size: 22rpx;
						padding: 4rpx 12rpx;
						border-radius: 30rpx;
						background: #f0f0f0;
						color: #666;

						&.competition {
							background: #5d7291;
							color: #fff;
						}

						&.end {
							background: #e54d42;
							color: #fff;
						}
					}
				}
			}
		}
	}

	.service-filter-bar {
		background: #fff;
		border-radius: 20rpx;
		margin-bottom: 20rpx;
		padding: 20rpx 0;

		.filter-tabs {
			display: flex;
			gap: 40rpx;
			padding: 0 20rpx;

			.filter-tab {
				font-size: 28rpx;
				color: #666;
				padding-bottom: 10rpx;
				position: relative;

				&.active {
					color: #5d7291;
					font-weight: bold;

					&::after {
						content: '';
						position: absolute;
						bottom: -2rpx;
						left: 0;
						right: 0;
						height: 4rpx;
						background: #5d7291;
						border-radius: 2rpx;
					}
				}
			}
		}
	}

	.bottom-placeholder {
		height: 40rpx;
	}

	.empty-tip {
		text-align: center;
		padding: 100rpx 0;
		color: #999;
		font-size: 28rpx;
	}
</style>