<template>
	<view class="pond-detail">
		<!-- 导航栏 -->
		<u-navbar :title="service.name || '钓场详情'" :bgColor="'#5d7291'" :title-color="'#fff'"
			:back-text="'返回'"></u-navbar>

		<scroll-view scroll-y class="content-scroll">
			<!-- 封面图轮播 -->
			<swiper class="cover-swiper" indicator-dots circular indicator-dots indicator-color="#999"
				indicator-active-color="#f38b11">
				<swiper-item v-for="(img, idx) in service.images" :key="idx">
					<image :src="getImageUrl(img)" mode="aspectFill" class="cover-img" @click="previewImage(idx)">
					</image>
				</swiper-item>
			</swiper>

			<!-- 基本信息 -->
			<view class="info-card">
				<text class="name">{{ service.name }}</text>
				<view class="price-row">
					<text class="price">¥{{ service.price }}</text>
					<text class="unit">{{ service.service_type === 'regular' ? '/天' : '/人' }}</text>
				</view>
				<view class="tags">
					<text class="tag" :class="{ competition: service.service_type === 'competition' }">
						{{ service.service_type === 'regular' ? '开钓服务' : '比赛服务' }}
					</text>
					<text v-if="service.is_end" class="tag end">已结束</text>
				</view>
			</view>

			<!-- 商家信息卡片 -->
			<view class="merchant-card" @click="goMerchantShop">
				<view class="merchant-info">
					<u-image width="80rpx" height="80rpx" shape="circle" :src="getImageUrl(service.merchant_avatar)"
						class="merchant-avatar"></u-image>
					<view class="merchant-detail">
						<text class="merchant-name">{{ service.merchant_name }}</text>
						<view class="merchant-stats">
							<text>评分 {{ merchantRating }}</text>
							<text>粉丝 {{ merchantFollowCount }}</text>
						</view>
					</view>
				</view>
				<u-icon name="arrow-right" size="28" color="#999"></u-icon>
			</view>

			<!-- 用户评价区域 -->
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

			<!-- 地址 -->
			<view class="info-card" v-if="service.address">
				<view class="row">
					<u-icon name="map" size="32" color="#5d7291" />
					<text class="label">地址</text>
				</view>
				<text class="address-text">{{ service.address }}</text>
			</view>

			<!-- 服务详情 -->
			<view class="info-card">
				<view class="row">
					<u-icon name="file-text" size="32" color="#5d7291" />
					<text class="label">服务详情</text>
				</view>
				<rich-text :nodes="service.details" class="detail-text" />
			</view>

			<!-- 比赛信息（醒目卡片） -->
			<view class="info-card competition-card" v-if="service.service_type === 'competition'">
				<view class="competition-header">
					<u-icon name="calendar" size="36" color="#5d7291" />
					<text class="competition-title">比赛信息</text>
				</view>
				<view class="competition-content">
					<view class="competition-row">
						<text class="competition-label">比赛名称</text>
						<text class="competition-name">{{ service.match_name }}</text>
					</view>
					<view class="competition-row">
						<text class="competition-label">比赛时间</text>
						<text
							class="competition-time">{{ service.match_time ? service.match_time.substring(0, 16) : '' }}</text>
					</view>
					<view class="competition-row">
						<text class="competition-label">比赛详情</text>
						<text class="competition-detail">{{ service.match_detail }}</text>
					</view>
				</view>
			</view>

			<!-- 标签 -->
			<view class="info-card" v-if="service.tags && service.tags.length">
				<view class="row">
					<u-icon name="tag" size="32" color="#5d7291" />
					<text class="label">标签</text>
				</view>
				<view class="tag-list">
					<text v-for="tag in service.tags" :key="tag" class="tag-item">#{{ tag }}#</text>
				</view>
			</view>

			<!-- 底部操作栏（与商品详情页一致） -->
			<view class="footer" v-if="!service.is_end">
				<!-- 收藏按钮（暂未实现服务收藏，仅样式） -->
				<view class="action-btn" :class="{ 'favorited': isFavorited }" @click="toggleFavorite">
					<u-icon :name="isFavorited ? 'star-fill' : 'star'" size="36"
						:color="isFavorited ? '#f38b11' : '#666'"></u-icon>
					<text>{{ isFavorited ? '已收藏' : '收藏' }}</text>
				</view>
				<!-- 加入购物车按钮（自店禁用） -->
				<view class="cart-btn" @click="isMerchantSelf ? showCannotBuy() : openCartPopup()"
					:class="{ disabled: isMerchantSelf }">
					<u-icon name="shopping-cart" size="36" color="#fff"></u-icon>
					<text>加入购物车</text>
				</view>
				<!-- 立即预约按钮（自店禁用） -->
				<button class="buy-btn" :class="{ disabled: isMerchantSelf }"
					@click="isMerchantSelf ? showCannotBuy() : bookNow()">
					立即预约
				</button>
			</view>
			<view class="footer" v-else>
				<button class="buy-btn disabled" disabled>已结束</button>
			</view>

			<!-- 预约信息弹窗（加入购物车时弹出） -->
			<u-popup v-model="showCartPopup" mode="bottom" border-radius="20" height="70vh" closeable>
				<view class="booking-popup">
					<view class="popup-title">选择预约信息</view>

					<!-- 比赛服务：显示固定时间卡片 -->
					<view v-if="isCompetition" class="competition-date-card">
						<view class="competition-date-label">比赛时间</view>
						<view class="competition-date-value">{{ formattedCompetitionTime }}</view>
					</view>

					<!-- 普通服务：显示日期选择器 -->
					<view v-else class="selector-row">
						<text class="label">预约日期</text>
						<scroll-view scroll-x class="scroll-selector" :show-scrollbar="false">
							<view class="options-wrapper">
								<view v-for="(date, idx) in dateOptions" :key="idx" class="option-item"
									:class="{ active: cartServiceDate === date.value }"
									@click="cartServiceDate = date.value">
									<text>{{ date.label }}</text>
								</view>
							</view>
						</scroll-view>
					</view>

					<!-- 普通服务：场次选择器 -->
					<view v-if="!isCompetition" class="selector-row">
						<text class="label">场次</text>
						<scroll-view scroll-x class="scroll-selector" :show-scrollbar="false"
							v-if="availableTimeSlots.length > 0">
							<view class="options-wrapper">
								<view v-for="slot in availableTimeSlots" :key="slot.value" class="option-item"
									:class="{ active: cartServiceTimeSlot === slot.value }"
									@click="cartServiceTimeSlot = slot.value">
									<text>{{ slot.label }}</text>
								</view>
							</view>
						</scroll-view>
						<view v-else class="no-slot-tip">今日已无可预约场次，请选择其他日期</view>
					</view>

					<!-- 人数：两者都显示 -->
					<view class="selector-row">
						<text class="label">人数</text>
						<scroll-view scroll-x class="scroll-selector" :show-scrollbar="false">
							<view class="options-wrapper">
								<view v-for="num in peopleRange" :key="num" class="option-item"
									:class="{ active: cartParticipantCount === num }"
									@click="cartParticipantCount = num">
									<text>{{ num }}人</text>
								</view>
							</view>
						</scroll-view>
					</view>

					<button class="confirm-btn" @click="addToCart">确定加入购物车</button>
				</view>
			</u-popup>
		</scroll-view>
	</view>
</template>

<script>
	import request from '@/common/request.js';

	export default {
		data() {
			return {
				id: null, // 服务ID
				service: { // 服务详情数据
					name: '',
					cover_image: '',
					price: 0,
					service_type: 'regular',
					is_end: false,
					address: '',
					details: '',
					merchant_id: null,
					merchant_name: '',
					merchant_avatar: '',
					merchant_rating: 0,
					merchant_follow_count: 0,
					match_name: '',
					match_time: '',
					match_detail: '',
					tags: [],
					images: []
				},
				commentList: [], // 评价列表
				commentTotal: 0, // 评价总数
				showCartPopup: false, // 控制预约弹窗显示
				cartServiceDate: '', // 选择的日期
				cartServiceTimeSlot: '', // 选择的场次
				cartParticipantCount: 1, // 选择的人数
				peopleRange: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // 人数选项
				timeSlots: [{
						label: '上午场 (8:30-12:00)',
						value: '上午场',
						startHour: 8
					},
					{
						label: '下午场 (13:00-17:00)',
						value: '下午场',
						startHour: 13
					},
					{
						label: '夜场 (18:00-22:00)',
						value: '夜场',
						startHour: 18
					}
				],
				dateOptions: [], // 日期选项（动态生成）
				isFavorited: false, // 是否已收藏（暂未实现）
				favoriteId: null,
				favoriteLoading: false,
				isMerchantSelf: false // 是否为自己的店铺
			}
		},
		computed: {
			formattedCompetitionTime() {
			    if (!this.isCompetition) return '';
			    const date = this.cartServiceDate;
			    const time = this.cartServiceTimeSlot;
			    if (!date) return '';
			    if (time && time !== '') return `${date} ${time}`;
			    return date;
			},
			isCompetition() {
				return this.service.service_type === 'competition';
			},
			availableTimeSlots() {
				if (!this.cartServiceDate) return [];
				// 将选中的日期字符串转换为 Date 对象（避免时区问题，只取日期部分）
				const selectedDate = new Date(this.cartServiceDate + 'T00:00:00');
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				// 比较时间戳（毫秒）
				const isToday = selectedDate.getTime() === today.getTime();
				const currentHour = new Date().getHours();
				return this.timeSlots.filter(slot => {
					if (isToday) {
						return currentHour < slot.startHour;
					}
					return true;
				});
			},
			// 商家评分（保留一位小数）
			merchantRating() {
				return this.service.merchant_rating ? this.service.merchant_rating.toFixed(1) : '4.8';
			},
			// 商家粉丝数
			merchantFollowCount() {
				return this.service.merchant_follow_count || 0;
			}
		},
		watch: {
			cartServiceDate() {
				this.cartServiceTimeSlot = '';
			}
		},
		onLoad(options) {
			if (options.id) {
				this.id = options.id;
				this.loadDetail();
				this.fetchComments();
				this.generateDateOptions(); // 生成未来10天日期选项
			} else {
				uni.showToast({
					title: '参数错误',
					icon: 'none'
				});
				setTimeout(() => uni.navigateBack(), 1500);
			}
		},
		methods: {
			// 购物车弹窗
			openCartPopup() {
			    if (this.isMerchantSelf) return;
			    if (this.isCompetition && this.service.match_time) {
			        const parts = this.service.match_time.split(' ');
			        this.cartServiceDate = parts[0];
			        this.cartServiceTimeSlot = parts[1] ? parts[1].slice(0, 5) : '';
			    } else {
			        this.cartServiceDate = this.dateOptions[0]?.value || '';
			        this.cartServiceTimeSlot = '';
			    }
			    this.cartParticipantCount = 1;
			    this.showCartPopup = true;
			},
			// 生成未来10天的日期选项（包含今天）
			generateDateOptions() {
				const options = [];
				const today = new Date();
				for (let i = 0; i <= 10; i++) {
					const date = new Date(today);
					date.setDate(today.getDate() + i);
					const year = date.getFullYear();
					const month = date.getMonth() + 1;
					const day = date.getDate();
					const value = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
					const label = `${month}月${day}日`;
					options.push({
						label,
						value
					});
				}
				this.dateOptions = options;
				// 默认选中今天
				if (options.length) {
					this.cartServiceDate = options[0].value;
				}
			},

			// 图片URL拼接完整地址
			getImageUrl(url) {
				if (!url) return '';
				if (url.startsWith('http') || url.startsWith('data:')) return url;
				return uni.$imgUrl(url);
			},

			// 获取当前登录用户ID
			getCurrentUserId() {
				let userInfo = this.$store.state.vuex_user_info || uni.getStorageSync('vuex_user_info');
				return userInfo?.id || null;
			},

			// 收藏功能（暂未实现服务收藏，仅提示）
			async toggleFavorite() {
				uni.showToast({
					title: '服务收藏功能开发中',
					icon: 'none'
				});
			},

			// 提示不能购买自己的服务
			showCannotBuy() {
				uni.showToast({
					title: '不能购买自己店铺的服务',
					icon: 'none'
				});
			},

			// 预览轮播图大图
			previewImage(idx) {
				const urls = this.service.images.map(img => this.getImageUrl(img));
				uni.previewImage({
					current: urls[idx],
					urls: urls
				});
			},

			// 加载服务详情
			async loadDetail() {
				uni.showLoading({
					title: '加载中...'
				});
				const res = await uni.request({
					url: `${uni.$baseUrl}/api/fishing/service/${this.id}`,
					method: 'GET'
				});
				uni.hideLoading();
				const result = res[1].data;
				if (result.code === 0) {
					let data = result.data;
					let tags = data.tags || [];
					if (typeof tags === 'string') {
						try {
							tags = JSON.parse(tags);
						} catch (e) {
							tags = [];
						}
					}
					const images = data.images || (data.cover_image ? [data.cover_image] : []);
					this.service = {
						...data,
						tags: tags,
						images: images,
						merchant_rating: data.merchant_rating || 4.8,
						merchant_follow_count: data.merchant_follow_count || 0
					};
					// 如果是比赛，预填充弹窗变量
					if (this.service.service_type === 'competition' && this.service.match_time) {
					    const parts = this.service.match_time.split(' ');
					    this.cartServiceDate = parts[0];
					    this.cartServiceTimeSlot = parts[1] ? parts[1].slice(0, 5) : '';
					}
					// 普通服务：默认选中今天日期
					else if (this.service.service_type === 'regular') {
					    this.cartServiceDate = this.dateOptions[0]?.value || '';
					    this.cartServiceTimeSlot = '';
					}
					// 判断是否为自己的店铺
					const userId = this.getCurrentUserId();
					this.isMerchantSelf = (userId && this.service.merchant_id === userId);
				} else {
					uni.showToast({
						title: result.msg || '加载失败',
						icon: 'none'
					});
					setTimeout(() => uni.navigateBack(), 1500);
				}
			},

			// 获取评价
			async fetchComments() {
				if (!this.id) return;
				try {
					const [err, res] = await uni.request({
						url: `${uni.$baseUrl}/api/service_reviews?service_id=${this.id}&page=1&page_size=3`,
						method: 'GET'
					});
					if (res.data.code === 0) {
						const list = res.data.data.list;
						this.commentList = list.map(item => ({
							id: item.id,
							userName: item.user_name,
							content: item.content,
							createTime: item.created_at
						}));
						this.commentTotal = res.data.data.total;
					} else {
						this.commentList = [];
						this.commentTotal = 0;
					}
				} catch (error) {
					console.error('获取服务评价失败', error);
					this.commentList = [];
					this.commentTotal = 0;
				}
			},

			// 跳转到商家店铺页
			goMerchantShop() {
				if (this.service.merchant_id) {
					uni.navigateTo({
						url: `/pages/shop/merchantShop?merchantId=${this.service.merchant_id}`
					});
				} else {
					uni.showToast({
						title: '商家信息不存在',
						icon: 'none'
					});
				}
			},

			// 跳转到全部评价页
			goToAllReviews() {
				uni.navigateTo({
					url: `/pages/shop/serviceReviews?serviceId=${this.id}&serviceName=${encodeURIComponent(this.service.name)}`
				});
			},

			// 立即预约（直接跳转订单页，预约信息在订单页填写）
			bookNow() {
				if (!this.$store.state.isLoginStatus) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					return;
				}
				const isCompetition = this.service.service_type === 'competition';
				let serviceDate = '';
				let serviceTime = ''; // 新增：具体时间
				if (isCompetition && this.service.match_time) {
					// 假设 match_time 格式为 "YYYY-MM-DD HH:mm:ss"
					const parts = this.service.match_time.split(' ');
					serviceDate = parts[0]; // 日期部分
					serviceTime = parts[1] ? parts[1].slice(0, 5) : ''; // 时间部分 HH:mm
				}
				const orderItem = {
					item_type: 'service',
					service_id: this.service.id,
					name: this.service.name,
					image: this.service.cover_image,
					unitPrice: this.service.price,
					quantity: 1,
					address: this.service.address,
					totalPrice: this.service.price,
					service_date: serviceDate,
					service_time_slot: serviceTime, // 存储具体时间
					participant_count: 1,
					merchant_id: this.service.merchant_id,
					merchant_name: this.service.merchant_name,
					is_competition: isCompetition,
					match_time_full: this.service.match_time // 可选，完整时间
				};
				const orderItemStr = encodeURIComponent(JSON.stringify(orderItem));
				uni.navigateTo({
					url: `/pages/shop/order?orderItem=${orderItemStr}&type=service`
				});
			},

			// 加入购物车（弹窗中选择日期、场次、人数后调用）
			async addToCart() {
				// 比赛服务不需要校验日期和场次（因为已经预设）
				if (!this.isCompetition && (!this.cartServiceDate || !this.cartServiceTimeSlot)) {
					uni.showToast({
						title: '请选择完整预约信息',
						icon: 'none'
					});
					return;
				}
				if (!this.$store.state.isLoginStatus) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					return;
				}
				uni.showLoading({
					title: '加入中...'
				});
				try {
					const res = await request({
						url: uni.$baseUrl + '/api/cart/add_service',
						method: 'POST',
						data: {
							service_id: this.service.id,
							service_date: this.cartServiceDate,
							service_time_slot: this.cartServiceTimeSlot,
							participant_count: this.cartParticipantCount
						}
					});
					if (res.data.code === 0) {
						uni.showToast({
							title: '已加入购物车',
							icon: 'success'
						});
						this.showCartPopup = false;
						// 重置弹窗数据
						this.cartServiceDate = this.dateOptions[0]?.value || '';
						this.cartServiceTimeSlot = '';
						this.cartParticipantCount = 1;
					} else {
						uni.showToast({
							title: res.data.message || '加入失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('加入购物车失败', error);
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
	// ==================== 页面容器 ====================
	.pond-detail {
		background-color: #f7f7f8;
		min-height: 100vh;
	}

	// 滚动区域
	.content-scroll {
		height: calc(100vh - 88rpx);
		padding-bottom: 120rpx;
	}

	// ==================== 封面轮播 ====================
	.cover-swiper {
		width: 100%;
		height: 500rpx;
		background-color: #fff;
	}

	.cover-img {
		width: 100%;
		height: 100%;
		display: block;
		object-fit: cover;
	}

	.info-card,
	.merchant-card,
	.comment-section {
		background: #fff;
		padding: 24rpx 30rpx;
		box-shadow: 0 4rpx 16rpx rgba(243, 139, 17, 0.06);
	}

	// ==================== 商家卡片特殊布局 ====================
	.merchant-card {
		display: flex;
		align-items: center;
		justify-content: space-between;

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
					color: #1a1a1a;
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

	// ==================== 基本信息卡片内部样式 ====================
	.info-card {
		.name {
			font-size: 36rpx;
			font-weight: bold;
			display: block;
			margin-bottom: 12rpx;
			color: #1a1a1a;
		}

		.price-row {
			margin-bottom: 16rpx;

			.price {
				font-size: 48rpx;
				font-weight: bold;
				color: #f38b11;
			}

			.unit {
				font-size: 28rpx;
				color: #999;
				margin-left: 8rpx;
			}
		}

		.tags {
			display: flex;
			flex-wrap: wrap;
			gap: 16rpx;

			.tag {
				padding: 6rpx 20rpx;
				border-radius: 30rpx;
				font-size: 24rpx;
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

		.row {
			display: flex;
			align-items: center;
			margin-bottom: 20rpx;

			.label {
				font-size: 32rpx;
				font-weight: bold;
				margin-left: 12rpx;
				color: #1a1a1a;
			}
		}

		// 地址高亮
		.address-text {
			font-weight: 500;
			color: #f38b11;
			background: rgba(243, 139, 17, 0.08);
			padding: 12rpx 20rpx;
			border-radius: 16rpx;
			display: inline-block;
			width: auto;
		}

		.detail-text {
			font-size: 28rpx;
			color: #333;
			line-height: 1.5;
		}

		.match-info {
			.match-name {
				font-weight: bold;
				display: block;
				margin-bottom: 8rpx;
				color: #1a1a1a;
			}

			.match-time {
				color: #f38b11;
				margin-bottom: 12rpx;
				display: block;
				font-weight: 600;
				background: rgba(243, 139, 17, 0.1);
				padding: 6rpx 16rpx;
				border-radius: 30rpx;
				display: inline-block;
			}

			.match-detail {
				color: #666;
			}
		}

		.tag-list {
			display: flex;
			flex-wrap: wrap;
			gap: 16rpx;

			.tag-item {
				background: #f0f0f0;
				padding: 8rpx 20rpx;
				border-radius: 60rpx;
				font-size: 26rpx;
				color: #5d7291;
			}
		}
	}

	// ==================== 比赛信息卡片（额外醒目） ====================
	.competition-card {
		background: #fff; // linear-gradient(135deg, #fff9f0, #fff);


		.competition-header {
			display: flex;
			align-items: center;
			gap: 12rpx;
			margin-bottom: 24rpx;
			padding-bottom: 16rpx;
			border-bottom: 2rpx dashed #5d7291;

			.competition-title {
				font-size: 34rpx;
				font-weight: bold;
				color: #1a1a1a;
			}
		}

		.competition-content {
			.competition-row {
				margin-bottom: 20rpx;
				display: flex;
				align-items: flex-start;

				&:last-child {
					margin-bottom: 0;
				}

				.competition-label {
					width: 140rpx;
					font-size: 28rpx;
					color: #999;
					flex-shrink: 0;
				}

				.competition-name,
				.competition-time,
				.competition-detail {
					flex: 1;
					font-size: 28rpx;
					color: #333;
					line-height: 1.5;
				}

				.competition-name {
					font-weight: bold;
					color: #1a1a1a;
				}

				.competition-time {
					font-weight: 600;
					color: #f38b11;
					font-size: 30rpx;
					background: rgba(243, 139, 17, 0.1);
					padding: 6rpx 16rpx;
					border-radius: 30rpx;
					display: inline-block;
				}
			}
		}
	}

	// ==================== 评价区域 ====================
	.comment-section {
		.section-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 20rpx;

			.section-title {
				font-size: 32rpx;
				font-weight: bold;
				padding-left: 15rpx;
				border-left: 8rpx solid #5d7291;
				color: #1a1a1a;
			}

			.view-all {
				font-size: 26rpx;
				color: #5d7291;

				&:active {
					opacity: 0.6;
				}
			}
		}

		.comment-item {
			border-bottom: 1rpx solid #f0e6d8;
			padding: 24rpx 0;

			&:last-child {
				border-bottom: none;
			}

			.comment-user {
				display: flex;
				align-items: center;
				margin-bottom: 16rpx;

				.user-name {
					font-size: 28rpx;
					font-weight: 500;
					color: #333;
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
	}

	.empty-comment {
		text-align: center;
		font-size: 28rpx;
		color: #999;
		padding: 40rpx 0;
	}

	// ==================== 底部操作栏 ====================
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

		.cart-btn {
			flex: 1;
			background-color: #5d7291;
			color: #fff;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			font-size: 24rpx;

			&.disabled {
				opacity: 0.6;
				pointer-events: none;
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
				opacity: 0.6;
				pointer-events: none;
			}
		}
	}

	// ==================== 预约弹窗样式 ====================
	.booking-popup {
		padding: 40rpx 30rpx;

		.popup-title {
			font-size: 36rpx;
			font-weight: bold;
			text-align: center;
			margin-bottom: 40rpx;
			color: #1a1a1a;
		}

		.selector-row {
			margin-bottom: 40rpx;

			.label {
				font-size: 30rpx;
				font-weight: 500;
				color: #333;
				display: block;
				margin-bottom: 20rpx;
			}

			.scroll-selector {
				width: 100%;
				white-space: nowrap;

				.options-wrapper {
					display: inline-flex;
					gap: 20rpx;
					padding: 0 10rpx;

					.option-item {
						display: inline-block;
						background: #f5f7fa;
						border-radius: 60rpx;
						padding: 16rpx 32rpx;
						font-size: 28rpx;
						color: #333;
						transition: all 0.2s;

						&.active {
							background: #5d7291;
							color: #fff;
						}

						&:active {
							transform: scale(0.96);
						}
					}
				}
			}
		}

		.confirm-btn {
			width: 100%;
			background: #f38b11;
			color: #fff;
			border-radius: 60rpx;
			height: 88rpx;
			line-height: 88rpx;
			font-size: 32rpx;
			font-weight: bold;
			margin-top: 40rpx;
			border: none;
		}
	}

	.no-slot-tip {
		background: #fef0e6;
		color: #f38b11;
		border-radius: 16rpx;
		padding: 20rpx;
		font-size: 26rpx;
		text-align: center;
	}
	
	.competition-date-card {
	    background: linear-gradient(135deg, #fef9e6, #fff3e0);
	    border-radius: 20rpx;
	    padding: 24rpx 30rpx;
	    margin-bottom: 30rpx;
	    border-left: 8rpx solid #f38b11;
	
	    .competition-date-label {
	        font-size: 28rpx;
	        color: #f38b11;
	        margin-bottom: 12rpx;
	        font-weight: 500;
	    }
	
	    .competition-date-value {
	        font-size: 36rpx;
	        font-weight: bold;
	        color: #1a1a1a;
	    }
	}
</style>