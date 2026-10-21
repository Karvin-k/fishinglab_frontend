<template>
	<view class="wrap">
		<view class="wrap-in">
			<!-- 1. 轮播图 -->
			<view class="banner">
				<u-swiper :list="list" name='pic_url'></u-swiper>
			</view>


			<!-- 2. 通知 -->
			<view class="notices">
				<view class="notices-icon">
					<u-image src="/static/images/bell.png" width="40" height="40"></u-image>
				</view>
				<view class="info">
					<u-notice-bar mode="horizontal" :list="noticeList" type='none' :volume-icon="false"></u-notice-bar>
				</view>
			</view>
			<!-- 3. 动态排行榜 -->
			<view class="rank-list">
				<view class="header">
					<text class="title">动态排行榜</text>
					<navigator url="/pages/dynamicRank/dynamicRank" class="load-more">更多 > </navigator>
				</view>
				<view class="card">

					<view class="item" v-for="ele in topList" :key='ele.id'>
						<view class="cover">
							<u-image shape="circle" height="132" width="132" :src="ele.avatar">
							</u-image>
						</view>
						<view class="username">{{ ele.nickname }}</view>
						<view class="total">累计总量：{{ ele.all_weight }}/斤</view>
						<view class="tag">
							<u-image src="/static/images/jb1.png" width="59" height="56"></u-image>
						</view>
					</view>


				</view>
			</view>

			<!-- 4. 开钓付费 -->
			<view class="fish-charge">
				<view class="header">
					<text class="title">开钓付费</text>
					<navigator url="/pages/fishCharge/fishCharge" class="load-more">更多 > </navigator>
				</view>
				<view class="card">

					<view class="item" v-for="ele in pondList" :key="ele.id">
						<u-image width="240" height="240" border-radius="8" :src="ele.pic_url[0].url">
						</u-image>
						<view class="info">
							<view class="title">{{ ele.name }}</view>
							<view class="short-title">{{ ele.details }}</view>
							<view class="price-bt">价格：<text class="price">{{ele.price}}元</text></view>
							<!-- is_order 等于2 代表当前这个用户以及付费预约，只有付费预约的用户才可以进行换位置、提前结束、以及续费 -->
							<view class="tags" v-if="ele.is_order == 2">
								<u-tag text="提前结束" type="info" shape="circle" bg-color="#5d7291" color="#fff"
									mode="dark" />
								<u-tag text="更换位置" type="info" shape="circle" bg-color="#5d7291" color="#fff"
									mode="dark" />
								<u-tag text="续费" type="info" shape="circle" bg-color="#5d7291" color="#fff"
									mode="dark" />
							</view>
						</view>
					</view>




				</view>
			</view>

			<!-- 5. 比赛预约 -->
			<view class="match-order">
				<view class="header">
					<text class="title">比赛预约</text>
					<navigator url="/pages/matchOrder/matchOrder" class="load-more">更多 > </navigator>
				</view>
				<view class="card">
					<navigator url="/pages/matchOrder/matchOrder" v-for="ele in matchList" :key="ele.id">
						<view class="item">
							<view :class="{end: ele.is_end == 1 }">
								<u-image width="664" height="316" border-radius="8"
									:src="ele.pic_url[0]['url']">
								</u-image>
							</view>
							<view class="title">
								{{ ele.match_name }}
							</view>
							<view class="info u-line-4">
								{{ ele.match_detail }}... <text class="jzgd">更多</text>
							</view>
							<view class="footer">
								<view><text class="bt">时间：</text><text class="date">{{ ele.created_at }}</text></view>
								<view><text class="bt">地点：</text><text class="location">{{ ele.address}}</text></view>

							</view>
						</view>
					</navigator>

					


				</view>

			</view>
		</view>

	</view>
</template>

<script>
	export default {
		data() {
			return {
				list: [],
				noticeList: [],
				topList: [],
				pondList: [],
				matchList: [],
				


			};
		},

		onLoad() {
			// 生命周期函数里面一般不需要写复杂的业务代码，一般只做功能函数的调用，把这些代码封装到 methods 的方法里面，然后再调用即可。
			this.getBanner();
			this.getNotice();
			this.getTopList();
			this.getPondList();
			this.getMatchList();


		},
		methods: {
			async getMatchList() {
				const res = await this.$u.api.getMatchList();
				console.log("res: ", res);
				this.matchList = res.data.list;
				
			},
			async getPondList() {
				const res = await this.$u.api.getPondList({
					page: 1,
					limit: 3
				});
				console.log("res: ", res);
				this.pondList = res.data.list;

			},
			async getTopList() {
				// try catch 一般是在业务代码里面完成，不在功能封装里面完成的 严谨一点的写法，在可能出错的的地方都要做异常捕获

				try {
					// 网络请求是最不可靠，稳定，因为网络环境很复杂，出于项目的健壮性考虑，尽可能还是多写 try catch 但是话回来了为了快速实现功能，一般都是怎么方便怎么来。有时间在优化，一般也很少优化，能跑则行；代码，你
					/// 很多项目的或者公司的周期都不会太长 
					const res = await this.$u.api.getTopList({
						type: 1,
						limit: 3
					});
					console.log("res: ", res);
					this.topList = res.data;


				} catch (e) {

					console.log('e', e);

				}

			},
			async getNotice() {
				const res = await this.$u.api.getNotices();
				console.log("res: ", res);

				this.noticeList = res.data.map(item => item.content);

			},
			async getBanner() {
				const res = await this.$u.api.getBanners();

				console.log("res: ", res);
				this.list = res.data.home_pages[0].banners;


			}
		}
	}
</script>

<style lang="scss">
	.wrap {
		width: 100%;
		background-color: #f7f7f8;

		.wrap-in {
			width: 750rpx - 24*2;
			margin: 0 auto;

			.banner {
				width: 100%;
				height: 256rpx;
				margin: 16rpx 0;
				border-radius: 12rpx;
			}

			.notices {
				display: flex;
				align-items: center;

				.notices-icon {
					width: 40rpx;
					height: 40rpx;
					margin-right: 10rpx;
				}

				.info {
					flex: 1;
					background-color: #fff;
				}
			}


			.rank-list {
				margin-top: 20rpx;
				background-color: #fff;
				padding: 0 20rpx 40rpx;
				border-radius: 16rpx;


				.header {
					display: flex;
					justify-content: space-between;

					.title {
						padding: 28rpx 0 22rpx;
						font-size: 36rpx;
						color: #151817;
						line-height: 44rpx;
						font-weight: 500;
					}

					.load-more {
						padding: 28rpx 20rpx 22rpx;
						font-size: 24rpx;
						color: #969998;
					}
				}

				.card {
					display: flex;
					justify-content: space-between;

					.item {
						padding-top: 44rpx;
						width: 208rpx;
						box-shadow: 4px 4px 16px 2px rgba(0, 0, 0, 0.25);

						display: flex;
						flex-direction: column;
						align-items: center;
						position: relative;

						.username {
							font-size: 28rpx;
							color: #1a1b1d;
							padding-top: 26rpx;
							line-height: 44rpx;
						}

						.total {
							font-size: 22rpx;
							color: #a1a1a1;
							line-height: 44rpx;
							padding-bottom: 10rpx;
						}

						.tag {
							position: absolute;
							left: 0;
							top: 0;
							width: 59rpx;
							height: 56rpx;

						}
					}
				}
			}

			.fish-charge {
				margin-top: 24rpx;

				.header {
					display: flex;
					justify-content: space-between;
					align-items: center;

					.title {
						font-size: 36rpx;
						color: #151817;
						padding: 16rpx 0;
						padding-left: 16rpx;
						font-weight: 500;
					}

					.load-more {
						font-size: 24rpx;
						color: #969998;
						padding: 22rpx 20rpx;

					}
				}

				.card {
					border-radius: 12rpx;
					padding: 44rpx 18rpx;
					background-color: #fff;

					.item:first-child {
						margin-bottom: 72rpx;
					}

					.item {
						display: flex;
						background-color: #fff;


						.info {
							flex: 1;
							padding-left: 14rpx;

							.title,
							.price-bt {
								font-size: 32rpx;
								color: #1A1B1D;
								font-weight: 500;
							}

							.title {
								color: #1a1b1d;

							}

							.short-title {
								font-size: 24rpx;
								color: #424242;
								line-height: 36rpx;
							}

							.price {
								font-size: 36rpx;
								color: #f38b11;

							}

							.tags {
								display: flex;
								justify-content: space-around;

							}

						}
					}
				}


			}

			.match-order {
				margin-top: 40rpx;

				.header {
					display: flex;
					justify-content: space-between;
					align-items: center;

					padding-left: 16rpx;

					.title {
						font-size: 36rpx;
						color: #151817;
						font-weight: 500;

					}

					.load-more {
						padding-right: 20rpx;
						font-size: 24rpx;
						color: #969998;
						padding: 20rpx;


					}
				}

				.card {
					.item {
						background-color: #fff;
						padding: 20rpx 18rpx;
						border-radius: 16rpx;
						margin-bottom: 16rpx;

						.end {
							position: relative;

							&::after {
								position: absolute;
								top: 0;
								right: 0;
								content: '';
								width: 164rpx;
								height: 164rpx;
								background: url(../../static/images/activity-end.png) no-repeat;
								background-size: 164rpx 164rpx;
							}
						}

						.title {
							font-size: 32rpx;
							color: #151817;
							font-weight: 500;
							line-height: 44rpx;
							margin-top: 20rpx;
							margin-bottom: 8rpx;
						}

						.info {
							font-size: 24rpx;
							color: #424242;
							line-height: 36rpx;
							margin-bottom: 8rpx;

							.jzgd {
								font-size: 30rpx;
								color: #5D7291;
							}
						}

						.footer {
							display: flex;
							justify-content: space-between;

							.bt {
								color: #151817;
							}

							.date,
							.location {
								font-size: 24rpx;
								color: #5d7291;

							}

						}
					}
				}
			}
		}
	}
</style>

<style lang="scss">
	.charge-card {
		border-radius: 12rpx;
		padding: 44rpx 18rpx;
		background-color: #fff;

		.item {
			display: flex;
			background-color: #fff;
			margin-bottom: 40rpx;

			image {
				width: 240rpx;
				height: 240rpx;
			}

			.info {
				flex: 1;
				padding-left: 20rpx;

				.title,
				.price-bt {
					font-size: 30rpx;
					color: #1a1b1d;
					font-weight: bold;
				}

				.title {
					font-size: 40rpx;
					color: #1a1b1d;
					font-weight: 500;
					margin-bottom: 20rpx;
				}

				.short-cut {
					font-size: 28rpx;
					color: #525252;
					line-height: 36rpx;
				}

				.price {
					font-size: 30rpx;
					color: #f38b11;
					line-height: 64rpx;
				}

				.tags {
					display: flex;
					justify-content: space-around;
				}
			}
		}

		.xf-date {
			font-size: 32rpx;
			color: #1a1b1d;
			margin-top: 20rpx;
			margin-bottom: 34rpx;
		}

		.select-time {
			display: flex;
			justify-content: space-around;
			margin-bottom: 20rpx;

			view {
				width: 216rpx;
				height: 60rpx;
				line-height: 60rpx;
				text-align: center;
				font-size: 28rpx;
				border-radius: 4rpx;
				background-color: #f1f1f1;

				&.active {
					background-color: #5d7291;
					color: #fff;
				}
			}
		}

		.sub {
			width: 632rpx;
			height: 72rpx;
			border-radius: 36rpx;
			line-height: 72rpx;
			background-color: #282828;
			color: #fff;
			font-size: 32rpx;
		}
	}
</style>
