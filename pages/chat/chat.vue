<template>
	<view class="chat-container">
		<!-- 顶部导航栏 -->
		<view class="chat-header">
			<view class="header-title">
				<text>客服中心</text>
				<text class="status">在线</text>
			</view>
		</view>

		<!-- 聊天主体区域 -->
		<scroll-view class="chat-messages" scroll-y :scroll-top="scrollTop" scroll-with-animation
			@scroll="scrollHandler" ref="scrollView">
			<view class="system-msg" v-if="messages.length === 0">
				<text>您好！我是钓鱼客服小助手，有什么可以帮您的？</text>
			</view>

			<!-- 修改消息循环部分 -->
			<view v-for="(msg, index) in messages" :key="index">
				<!-- 客服消息 -->
				<view v-if="msg.sender === 'service'" class="message service">
					<view class="avatar">
						<u-image src="/static/images/service-avatar.png" width="80" height="80"></u-image>
					</view>
					<view class="content-container">
						<view class="name">钓鱼客服</view>
						<view class="bubble">
							<text>{{ msg.content }}</text>
							<view class="time">{{ msg.time }}</view>
						</view>
					</view>
				</view>

				<!-- 用户消息 -->
				<view v-if="msg.sender === 'me'" class="message me">
					<view class="content-container">
						<view class="name">我</view> <!-- 添加用户名称 -->
						<view class="bubble">
							<text>{{ msg.content }}</text>
							<view class="time">{{ msg.time }}</view>
						</view>
					</view>
					<view class="avatar">
						<u-image :src="userAvatar" width="80" height="80"></u-image>
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- 快捷问题 -->
		<view class="quick-questions">
			<view class="section-title">常见问题</view>
			<view class="question-list">
				<view v-for="(question, index) in quickQuestions" :key="index" class="question"
					@click="sendQuickQuestion(question)">
					<text>{{ question }}</text>
				</view>
			</view>
		</view>

		<!-- 输入区域 -->
		<view class="input-area">
			<u-input v-model="inputMessage" placeholder="输入您的问题..." height="80" :border="false" :focus="inputFocus"
				@confirm="sendMessage" class="input-box"></u-input>
			<view class="send-btn" @click="sendMessage">
				<u-icon name="chat" size="42" color="#5d7291"></u-icon>
			</view>
		</view>
	</view>
</template>


<script>
	export default {
		data() {
			return {
				messages: [],
				inputMessage: '',
				inputFocus: false,
				scrollTop: 0,
				oldScrollTop: 0,
				userAvatar: '/static/images/user-avatar.jpg',
				quickQuestions: [
					"怎么预约钓场？",
					"比赛报名需要什么条件？",
					"鱼竿怎么保养？",
					"钓场位置在哪里？",
					"如何更换预约位置？",
					"钓场提供鱼饵吗？"
				],
				autoReplyMap: {
					"预约": "您可以在钓场服务页面选择心仪的钓场，点击立即预约即可。预约成功后我们会发送确认短信到您的手机。",
					"比赛": "钓鱼比赛报名需要您注册成为我们的会员，并在比赛页面提交报名信息。报名费用根据比赛不同有所差异。",
					"鱼竿": "鱼竿保养建议：每次使用后用清水冲洗，避免暴晒，定期检查鱼线磨损情况。碳素鱼竿要避免硬物碰撞。",
					"位置": "您可以在钓场详情页查看具体位置和导航信息。部分钓场提供免费停车位，详情请查看钓场说明。",
					"更换": "如需更换预约位置，请在预约记录中找到对应订单，点击'更换位置'按钮进行操作。",
					"鱼饵": "大多数钓场提供基础鱼饵购买服务，部分高级钓场免费提供。您也可以自带鱼饵，但需符合钓场规定。",
					"支付": "我们支持微信支付、支付宝和银联卡支付。预约钓场需提前支付全款，比赛报名需支付50%定金。",
					"取消": "钓场预约在开始前24小时可免费取消，比赛报名在开始前7天可申请全额退款。"
				}
			};
		},
		mounted() {
			// 添加欢迎消息
			setTimeout(() => {
				this.addServiceMessage("您好！我是钓鱼客服小助手，有什么可以帮您的？");
			}, 500);
		},
		methods: {
			goBack() {
				uni.navigateBack();
			},
			sendMessage() {
				if (!this.inputMessage.trim()) return;

				// 添加用户消息
				this.addMessage(this.inputMessage, 'me');

				// 保存消息内容并清空输入框
				const msg = this.inputMessage;
				this.inputMessage = '';

				// 模拟客服回复
				setTimeout(() => {
					this.autoReply(msg);
				}, 800);
			},
			sendQuickQuestion(question) {
				this.inputMessage = question;
				this.sendMessage();
			},
			addMessage(content, sender) {
				const time = this.getCurrentTime();
				this.messages.push({
					content,
					sender,
					time
				});

				this.scrollToBottom();
			},
			addServiceMessage(content) {
				this.addMessage(content, 'service');
			},
			getCurrentTime() {
				const now = new Date();
				return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
			},
			autoReply(userMsg) {
				let reply = "感谢您的咨询！关于钓鱼相关问题，您可以查看我们的帮助中心，或继续向我提问。";

				// 匹配关键词回复
				for (const keyword in this.autoReplyMap) {
					if (userMsg.includes(keyword)) {
						reply = this.autoReplyMap[keyword];
						break;
					}
				}

				this.addServiceMessage(reply);
			},
			scrollToBottom() {
				this.$nextTick(() => {
					this.scrollTop = this.oldScrollTop + 100;
				});
			},
			scrollHandler(e) {
				this.oldScrollTop = e.detail.scrollTop;
			}
		}
	};
</script>

<style lang="scss" scoped>
	.chat-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: #f5f7fa;
	}

	.chat-header {
		background: linear-gradient(135deg, #5d7291, #3a506b);
		color: white;
		padding: 15rpx 30rpx;
		display: flex;
		align-items: center;
		height: 90rpx;

		.header-title {
			flex: 1;
			font-size: 36rpx;
			font-weight: bold;
			text-align: center;

			.status {
				margin-left: 20rpx;
				font-size: 24rpx;
				background-color: #4CAF50;
				padding: 4rpx 12rpx;
				border-radius: 20rpx;
			}
		}
	}

	.chat-messages {
		flex: 1;
		padding: 20rpx;
		overflow: hidden;
		box-sizing: border-box;

		.system-msg {
			text-align: center;
			padding: 30rpx;
			color: #888;
			font-size: 28rpx;
			background-color: #fff;
			border-radius: 16rpx;
			margin: 20rpx;
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
		}
	}

	.message {
		display: flex;
		margin-bottom: 40rpx;
		max-width: 100%;
		box-sizing: border-box;
	}

	.content-container {
		max-width: calc(100% - 100rpx);
	}

	.bubble {
		position: relative;
		padding: 20rpx;
		border-radius: 12rpx;
		font-size: 32rpx;
		line-height: 1.5;
		box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
		word-break: break-word;
		/* 修复换行问题 */

		.time {
			font-size: 20rpx;
			margin-top: 10rpx;
		}
	}

	/* 客服消息样式 */
	.message.service {
		justify-content: flex-start;

		.content-container {
			margin-left: 20rpx;
			margin-right: 0;
		}

		.name {
			font-size: 24rpx;
			color: #666;
			margin-bottom: 10rpx;
			text-align: left;
		}

		.bubble {
			background-color: #e6eeff;
			color: #333;
			border-top-left-radius: 0;
			max-width: 100%;
			/* 允许扩展到最大宽度 */
			min-width: 120rpx;
			/* 确保最小宽度 */
			text-align: left;

			&:before {
				content: '';
				position: absolute;
				left: -10rpx;
				top: 20rpx;
				border: 10rpx solid transparent;
				border-right-color: #e6eeff;
				border-left: 0;
			}

			.time {
				color: #999;
				text-align: right;
			}
		}
	}

	/* 用户消息样式 - 修复版 */
	.message.me {
		justify-content: flex-end;

		.content-container {
			margin-right: 20rpx;
			/* 与客服对称 */
			margin-left: 0;
			text-align: right;
			/* 名称右对齐 */
		}

		.name {
			font-size: 24rpx;
			color: #666;
			margin-bottom: 10rpx;
		}

		.bubble {
			background-color: #5d7291;
			color: white;
			border-top-right-radius: 0;
			max-width: 100%;
			/* 允许扩展到最大宽度 */
			min-width: 120rpx;
			/* 确保最小宽度 */
			text-align: left;
			/* 内容文本左对齐 */

			&:before {
				content: '';
				position: absolute;
				right: -10rpx;
				top: 20rpx;
				border: 10rpx solid transparent;
				border-left-color: #5d7291;
				border-right: 0;
			}

			.time {
				color: rgba(255, 255, 255, 0.7);
				text-align: right;
			}
		}
	}

	.avatar {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		overflow: hidden;
		flex-shrink: 0;
		align-self: flex-start;
	}

	.quick-questions {
		padding: 20rpx 30rpx;
		background-color: #fff;
		border-top: 1rpx solid #eee;

		.section-title {
			font-size: 28rpx;
			color: #999;
			margin-bottom: 20rpx;
		}

		.question-list {
			display: flex;
			flex-wrap: wrap;
			gap: 20rpx;

			.question {
				background-color: #f0f4f9;
				border-radius: 40rpx;
				padding: 12rpx 24rpx;
				font-size: 28rpx;
				color: #5d7291;

				&:active {
					background-color: #e0e8f0;
				}
			}
		}
	}

	.input-area {
		display: flex;
		align-items: center;
		padding: 20rpx 30rpx;
		background-color: #fff;
		border-top: 2rpx solid #eee;
		box-sizing: border-box;

		.input-box {
			flex: 1;
			background-color: #f5f7fa;
			border-radius: 40rpx;
			padding: 0 30rpx;
			margin-right: 20rpx;
			box-shadow: 0 2rpx 8rpx rgba(93, 114, 145, 0.1);
		}

		.send-btn {
			width: 80rpx;
			height: 80rpx;
			border-radius: 50%;
			background-color: #f0f4f9;
			display: flex;
			align-items: center;
			justify-content: center;
			box-shadow: 0 2rpx 8rpx rgba(93, 114, 145, 0.1);

			&:active {
				background-color: #e0e8f0;
			}
		}
	}
</style>