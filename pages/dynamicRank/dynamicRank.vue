<template>
	<view class="wrap">
		<u-navbar title="排行榜" :bgColor="'#5d7291'" :title-color="'#fff'" :back-text="'返回'"></u-navbar>
		<!-- 筛选选项 -->
		<view class="filter-tabs">
			<view class="tab-item" :class="{ active: rankType === 'comprehensive' }" 
				  @click="changeRankType('comprehensive')">
				综合排名
			</view>
			<view class="tab-item" :class="{ active: rankType === 'fish_count' }" 
				  @click="changeRankType('fish_count')">
				鱼获数量
			</view>
			<view class="tab-item" :class="{ active: rankType === 'fishing_count' }" 
				  @click="changeRankType('fishing_count')">
				钓鱼次数
			</view>
			<view class="tab-item" :class="{ active: rankType === 'champion_count' }" 
				  @click="changeRankType('champion_count')">
				坑冠次数
			</view>
		</view>

		<!-- 排行榜列表 -->
		<view class="rank-list">
			<view class="rank-item" v-for="user in rankList" :key="user.id">
				<view class="rank-number" :class="getRankClass(user.rank)">
					{{ user.rank }}
				</view>
				<view class="avatar">
					<u-image width="80" height="80" shape="circle" :src="user.avatar"></u-image>
				</view>
				<view class="user-info">
					<text class="nickname">{{ user.nickname }}</text>
					<text class="score">综合评分: {{ user.score }}</text>
				</view>
				<view class="stats">
					<text class="stat-item">鱼获: {{ user.fish_count }}</text>
					<text class="stat-item">次数: {{ user.fishing_count }}</text>
					<text class="stat-item">坑冠: {{ user.champion_count }}</text>
				</view>
				<view class="medal" v-if="user.rank <= 3">
					<u-image width="40" height="40" :src="user.tag"></u-image>
				</view>
			</view>
		</view>

		<!-- 加载更多 -->
		<view class="load-more" v-if="hasMore" @click="loadMore">
			<text>加载更多</text>
		</view>

		<!-- 空状态 -->
		<view class="empty-state" v-if="rankList.length === 0 && !loading">
			<u-image width="200" height="200" src="/static/images/empty-rank.png"></u-image>
			<text class="empty-text">暂无排行榜数据</text>
		</view>

		<!-- 加载状态 -->
		<view class="loading-state" v-if="loading">
			<u-loading mode="circle" size="36"></u-loading>
			<text>加载中...</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				rankList: [],
				rankType: 'comprehensive',
				loading: false,
				hasMore: true,
				currentPage: 1,
				pageSize: 20
			};
		},
		onLoad() {
			this.fetchRankData();
		},
		methods: {
			// 获取排行榜数据
			async fetchRankData(isLoadMore = false) {
				if (this.loading) return;
				
				this.loading = true;
				
				try {
					const [error, res] = await uni.request({
						url: uni.$baseUrl + '/api/user/rank',
						method: 'GET',
						data: {
							type: this.rankType,
							limit: this.pageSize * (isLoadMore ? this.currentPage + 1 : 1)
						}
					});

					if (error || res.data.code !== 0) {
						throw new Error('排行榜数据加载失败');
					}

					const data = res.data.data || [];
					
					if (isLoadMore) {
						this.rankList = [...this.rankList, ...data];
						this.currentPage++;
					} else {
						this.rankList = data;
						this.currentPage = 1;
					}

					// 判断是否还有更多数据
					this.hasMore = data.length >= this.pageSize;

				} catch (e) {
					console.error('排行榜数据加载失败:', e);
					uni.showToast({
						title: '数据加载失败',
						icon: 'none'
					});
				} finally {
					this.loading = false;
				}
			},

			// 切换排名类型
			changeRankType(type) {
				if (this.rankType === type) return;
				
				this.rankType = type;
				this.fetchRankData();
			},

			// 加载更多
			loadMore() {
				if (!this.loading && this.hasMore) {
					this.fetchRankData(true);
				}
			},

			// 获取排名样式
			getRankClass(rank) {
				if (rank === 1) return 'rank-gold';
				if (rank === 2) return 'rank-silver';
				if (rank === 3) return 'rank-bronze';
				return 'rank-normal';
			}
		}
	};
</script>

<style lang="scss" scoped>
	.wrap {
		padding: 20rpx;
		background-color: #f7f7f8;
		min-height: 100vh;
	}


	.filter-tabs {
		display: flex;
		background: #fff;
		border-radius: 16rpx;
		margin-bottom: 20rpx;
		padding: 20rpx;
		
		.tab-item {
			flex: 1;
			text-align: center;
			padding: 20rpx 0;
			font-size: 28rpx;
			color: #969998;
			border-radius: 8rpx;
			
			&.active {
				background: #5d7291;
				color: #fff;
			}
		}
	}

	.rank-list {
		background: #fff;
		border-radius: 16rpx;
		overflow: hidden;
	}

	.rank-item {
		display: flex;
		align-items: center;
		padding: 30rpx 20rpx;
		border-bottom: 1rpx solid #f1f1f1;
		position: relative;
		
		&:last-child {
			border-bottom: none;
		}
		
		.rank-number {
			width: 60rpx;
			height: 60rpx;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 28rpx;
			font-weight: bold;
			margin-right: 20rpx;
			
			&.rank-gold {
				background: linear-gradient(135deg, #FFD700, #FFA500);
				color: #fff;
			}
			
			&.rank-silver {
				background: linear-gradient(135deg, #C0C0C0, #A0A0A0);
				color: #fff;
			}
			
			&.rank-bronze {
				background: linear-gradient(135deg, #CD7F32, #A56C2A);
				color: #fff;
			}
			
			&.rank-normal {
				background: #f1f1f1;
				color: #969998;
			}
		}
		
		.avatar {
			margin-right: 20rpx;
		}
		
		.user-info {
			flex: 1;
			
			.nickname {
				display: block;
				font-size: 32rpx;
				color: #151817;
				font-weight: 500;
				margin-bottom: 8rpx;
			}
			
			.score {
				display: block;
				font-size: 24rpx;
				color: #f38b11;
			}
		}
		
		.stats {
			display: flex;
			flex-direction: column;
			align-items: flex-end;
			margin-right: 20rpx;
			
			.stat-item {
				font-size: 22rpx;
				color: #969998;
				margin-bottom: 4rpx;
			}
		}
		
		.medal {
			position: absolute;
			top: 10rpx;
			right: 10rpx;
		}
	}

	.load-more {
		text-align: center;
		padding: 40rpx;
		color: #5d7291;
		font-size: 28rpx;
		
		&:active {
			opacity: 0.7;
		}
	}

	.empty-state {
		text-align: center;
		padding: 100rpx 0;
		
		.empty-text {
			display: block;
			margin-top: 20rpx;
			font-size: 28rpx;
			color: #969998;
		}
	}

	.loading-state {
		text-align: center;
		padding: 40rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		
		text {
			margin-top: 20rpx;
			font-size: 28rpx;
			color: #969998;
		}
	}
</style>