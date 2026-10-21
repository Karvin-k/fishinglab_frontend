<template>
	<view class="balance-page">
		<u-navbar title="我的余额" :bgColor="'#fff'" :title-color="'#333'" :back-text="'返回'"></u-navbar>

		<view class="balance-card">
			<text class="label">当前余额（元）</text>
			<text class="amount">¥{{ balance }}</text>
		</view>

		<view class="recharge-section">
			<text class="section-title">选择充值金额</text>
			<view class="amount-grid">
				<view v-for="item in presetAmounts" :key="item" class="amount-item"
					:class="{ active: selectedAmount === item }" @click="selectAmount(item)">
					<text class="value">{{ item }}元</text>
				</view>
			</view>

			<!-- 其他金额自定义输入 -->
			<view class="custom-amount">
				<text class="label">其他金额</text>
				<view class="input-wrapper">
					<text class="unit">¥</text>
					<input type="number" v-model="customAmount" placeholder="请输入正整数金额" class="custom-input"
						@input="onCustomAmountInput" />
				</view>
			</view>

			<button class="recharge-btn" @click="recharge" :disabled="!canRecharge">立即充值</button>
		</view>
	</view>
</template>

<script>
	import request from '@/common/request.js';
	export default {
		data() {
			return {
				balance: 0,
				presetAmounts: [10, 50, 100, 200],
				selectedAmount: null, // 当前选中的预设金额
				customAmount: '', // 自定义金额
			}
		},
		computed: {
			// 是否可以充值：有选中预设金额 或 自定义金额为正整数
			canRecharge() {
				if (this.selectedAmount !== null) return true;
				const val = parseInt(this.customAmount);
				return !isNaN(val) && val > 0;
			},
			// 实际充值金额
			rechargeAmount() {
				if (this.selectedAmount !== null) return this.selectedAmount;
				const val = parseInt(this.customAmount);
				return isNaN(val) ? 0 : val;
			}
		},
		onShow() {
			this.loadBalance();
			this.resetSelection();
		},
		methods: {
			loadBalance() {
				const userInfo = this.$store.state.vuex_user_info;
				if (userInfo) this.balance = userInfo.balance || 0;
			},
			resetSelection() {
				this.selectedAmount = null;
				this.customAmount = '';
			},
			selectAmount(amount) {
				this.selectedAmount = amount;
				this.customAmount = ''; // 清空自定义输入
			},
			onCustomAmountInput(e) {
				// 用户输入自定义金额时，清空预设选中状态
				if (e.detail.value) {
					this.selectedAmount = null;
				} else {
					// 如果清空输入，且没有选中预设，则不能充值
				}
			},
			async recharge() {
				if (!this.canRecharge) return;
				const amount = this.rechargeAmount;
				uni.showLoading({
					title: '充值中...'
				});
				try {
					const res = await request({
						url: uni.$baseUrl + '/api/user/recharge',
						method: 'POST',
						data: {
							amount
						}
					});
					if (res.data.code === 0) {
						const newBalance = res.data.data.new_balance;
						const updatedUserInfo = {
							...this.$store.state.vuex_user_info,
							balance: newBalance
						};
						this.$store.commit('setUserInfo', updatedUserInfo);
						uni.setStorageSync('vuex_user_info', updatedUserInfo);
						this.balance = newBalance;
						uni.showToast({
							title: `充值${amount}元成功`,
							icon: 'success'
						});
						this.resetSelection();
					} else {
						throw new Error(res.data.message);
					}
				} catch (error) {
					console.error(error);
					uni.showToast({
						title: error.message || '充值失败',
						icon: 'none'
					});
				} finally {
					uni.hideLoading();
				}
			}
		}
	}
</script>

<style scoped>
	.balance-page {
		background-color: #fff;
		min-height: 100vh;
	}

	/* 余额卡片 */
	.balance-card {
		background: linear-gradient(135deg, #5d7291 0%, #3b4b66 100%);
		margin: 30rpx;
		padding: 60rpx 40rpx;
		border-radius: 24rpx;
		text-align: center;
		color: #fff;
	}

	.balance-card .label {
		font-size: 28rpx;
		opacity: 0.8;
	}

	.balance-card .amount {
		font-size: 72rpx;
		font-weight: bold;
		margin-top: 20rpx;
		display: block;
	}

	/* 充值选项区域 */
	.recharge-section {
		padding: 0 30rpx;
	}

	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		margin: 30rpx 0 20rpx;
		display: block;
	}

	/* 预设金额网格 */
	.amount-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 20rpx;
		margin-bottom: 40rpx;
	}

	.amount-item {
		width: calc(25% - 15rpx);
		background: #f5f5f5;
		border-radius: 60rpx;
		padding: 20rpx 0;
		text-align: center;
		transition: all 0.2s;
		border: 2rpx solid transparent;
	}

	.amount-item.active {
		background: #f38b11;
		border-color: #d9790e;

		.value {
			color: #fff;
		}
	}

	.amount-item .value {
		font-size: 32rpx;
		color: #333;
	}

	/* 其他金额自定义输入 */
	.custom-amount {
		margin-bottom: 60rpx;
	}

	.custom-amount .label {
		font-size: 28rpx;
		color: #666;
		display: block;
		margin-bottom: 16rpx;
	}

	.input-wrapper {
		display: flex;
		align-items: center;
		background: #f5f5f5;
		border-radius: 60rpx;
		padding: 0 30rpx;
		height: 88rpx;
	}

	.unit {
		font-size: 36rpx;
		font-weight: bold;
		margin-right: 16rpx;
		color: #333;
	}

	.custom-input {
		flex: 1;
		font-size: 32rpx;
		height: 100%;
	}

	/* 充值按钮 */
	.recharge-btn {
		margin-top: 20rpx;
		background-color: #f38b11;
		color: #fff;
		border-radius: 60rpx;
		height: 88rpx;
		line-height: 88rpx;
		font-size: 32rpx;
		font-weight: bold;
	}

	.recharge-btn:disabled {
		background-color: #ccc;
	}
</style>