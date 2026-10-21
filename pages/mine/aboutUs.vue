<template>
	<view class="about-us">
		<!-- 自定义导航栏 -->
		<u-navbar title="关于我们" :bgColor="'#5d7291'" :title-color="'#fff'" :back-text="'返回'"></u-navbar>

		<scroll-view scroll-y class="scroll-view">
			<!-- Banner 图 -->
			<view class="banner">
				<image src="/static/images/about-banner.jpg" mode="widthFix" class="banner-img"></image>
			</view>

			<!-- 平台介绍 -->
			<view class="card">
				<view class="card-title">平台介绍</view>
				<view class="card-content">
					钓鱼服务平台致力于为钓鱼爱好者提供一站式服务，涵盖渔具商城、钓场预约、商家入驻、社区分享等功能。
					我们连接钓友与优质商家，让钓鱼更轻松、更有趣。
				</view>
			</view>

			<!-- 核心功能 -->
			<view class="card">
				<view class="card-title">核心功能</view>
				<view class="features-grid">
					<view class="feature-item">
						<u-icon name="shopping-cart" size="48" color="#5d7291" />
						<text>渔具商城</text>
					</view>
					<view class="feature-item">
						<u-icon name="map" size="48" color="#5d7291" />
						<text>钓场预约</text>
					</view>
					<view class="feature-item">
						<u-icon name="account" size="48" color="#5d7291" />
						<text>商家入驻</text>
					</view>
					<view class="feature-item">
						<u-icon name="chat" size="48" color="#5d7291" />
						<text>社区分享</text>
					</view>
					<view class="feature-item">
						<u-icon name="coupon" size="48" color="#5d7291" />
						<text>优惠活动</text>
					</view>
					<view class="feature-item">
						<u-icon name="star" size="48" color="#5d7291" />
						<text>积分体系</text>
					</view>
				</view>
			</view>

			<!-- 团队介绍 -->
			<view class="card">
				<view class="card-title">团队介绍</view>
				<view class="team-list">
					<view class="team-item" v-for="member in team" :key="member.name">
						<u-image :src="member.avatar" width="100rpx" height="100rpx" shape="circle" />
						<view class="team-info">
							<text class="team-name">{{ member.name }}</text>
							<text class="team-role">{{ member.role }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 联系/反馈 -->
			<view class="card">
				<view class="card-title">联系与反馈</view>
				<view class="contact-info">
					<view class="contact-item" @click="copyEmail">
						<u-icon name="mail" size="36" color="#f38b11" />
						<text>客服邮箱：support@fishing.com</text>
					</view>
					<view class="contact-item" @click="showFeedback">
						<u-icon name="edit-pen" size="36" color="#f38b11" />
						<text>意见反馈</text>
					</view>
				</view>
			</view>

			<!-- 版本信息 -->
			<view class="card">
				<view class="card-title">版本信息</view>
				<view class="version-info">
					<text>当前版本：{{ version }}</text>
					<text>更新日期：2026-05-06</text>
				</view>
			</view>

			<view class="footer-space"></view>
		</scroll-view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				version: '1.0.0',
				team: [{
						name: '张三',
						role: '项目负责人',
						avatar: '/static/images/avatar1.png'
					},
					{
						name: '李四',
						role: '后端开发',
						avatar: '/static/images/avatar2.jpg'
					},
					{
						name: '王五',
						role: '前端开发',
						avatar: '/static/images/avatar3.jpg'
					}
				]
			};
		},
		methods: {
			copyEmail() {
				uni.setClipboardData({
					data: 'support@fishing.com',
					success: () => uni.showToast({
						title: '邮箱已复制',
						icon: 'success'
					})
				});
			},
			showFeedback() {
				uni.showToast({
					title: '反馈功能开发中',
					icon: 'none'
				});
				// 后续可以跳转到反馈表单或调用接口
			}
		}
	};
</script>

<style lang="scss" scoped>
	.about-us {
		background-color: #f8f8f8;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		overflow-x: hidden;
		/* 防止水平滚动 */
	}

	.scroll-view {
		flex: 1;
		width: 100%;
		box-sizing: border-box;
		padding: 20rpx 30rpx;
	}

	.banner {
		width: 100%;
		margin-bottom: 30rpx;

		.banner-img {
			width: 100%;
			border-radius: 24rpx;
			box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
			display: block;
		}
	}

	.card {
		background: #fff;
		border-radius: 24rpx;
		padding: 30rpx;
		margin-bottom: 30rpx;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.02);
		box-sizing: border-box;
		width: 100%;

		.card-title {
			font-size: 34rpx;
			font-weight: bold;
			color: #1a1a1a;
			margin-bottom: 24rpx;
			padding-left: 16rpx;
			border-left: 8rpx solid #5d7291;
		}

		.card-content {
			font-size: 28rpx;
			color: #666;
			line-height: 1.6;
		}
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 30rpx;

		.feature-item {
			display: flex;
			flex-direction: column;
			align-items: center;

			.u-icon {
				margin-bottom: 16rpx;
			}

			text {
				font-size: 26rpx;
				color: #333;
			}
		}
	}

	.team-list {
		.team-item {
			display: flex;
			align-items: center;
			margin-bottom: 30rpx;

			&:last-child {
				margin-bottom: 0;
			}

			.team-info {
				margin-left: 24rpx;

				.team-name {
					font-size: 30rpx;
					font-weight: bold;
					display: block;
				}

				.team-role {
					font-size: 26rpx;
					color: #999;
				}
			}
		}
	}

	.contact-info {
		.contact-item {
			display: flex;
			align-items: center;
			margin-bottom: 30rpx;

			&:last-child {
				margin-bottom: 0;
			}

			.u-icon {
				margin-right: 20rpx;
			}

			text {
				font-size: 28rpx;
				color: #333;
			}
		}
	}

	.version-info {
		display: flex;
		justify-content: space-between;
		font-size: 28rpx;
		color: #666;
		flex-wrap: wrap;
	}

	.footer-space {
		height: 40rpx;
	}
</style>