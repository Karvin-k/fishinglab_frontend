<template>
	<view class="agreement-privacy">
		<u-navbar title="用户协议与隐私政策" :bgColor="'#5d7291'" :title-color="'#fff'" :back-text="'返回'"></u-navbar>
		<scroll-view scroll-y class="scroll-view">
			<!-- 用户协议部分 -->
			<view class="card">
				<view class="title">用户协议</view>
				<view class="update-date">更新日期：2026-05-06</view>

				<view class="section">
					<view class="section-title">一、服务说明</view>
					<text>钓鱼服务平台（以下简称“本平台”）为您提供渔具商城、钓场预约、商家入驻、社区分享等服务。平台保留根据实际情况调整服务内容的权利。</text>
				</view>

				<view class="section">
					<view class="section-title">二、账号注册与使用</view>
					<text>1. 您需使用真实、有效的手机号或用户名注册，并对账号行为负责。</text>
					<text>2. 不得将账号转让、出借给他人使用，否则后果自负。</text>
					<text>3. 如发现账号异常，请立即联系客服。</text>
				</view>

				<view class="section">
					<view class="section-title">三、交易规则</view>
					<text>1. 商品订单：下单后需在30分钟内支付，超时自动取消。</text>
					<text>2. 钓场预约：预约成功后如需取消，请遵守各商家的取消政策。</text>
					<text>3. 退款规则：商品未发货可申请退款，虚拟服务一经使用不可退款。</text>
				</view>

				<view class="section">
					<view class="section-title">四、用户行为规范</view>
					<text>禁止发布违法、侵权、骚扰、虚假广告等内容；禁止恶意刷单、攻击平台。违规者将被限制功能或封号。</text>
				</view>

				<view class="section">
					<view class="section-title">五、免责声明</view>
					<text>因不可抗力、网络故障、第三方原因导致的损失，平台不承担责任。平台不对商家发布的商品信息真实性做绝对保证。</text>
				</view>

				<view class="section">
					<view class="section-title">六、协议的修改与终止</view>
					<text>平台有权修改本协议，修改后的协议将在公示后生效。如您不同意修改，可停止使用服务。</text>
				</view>

				<view class="section">
					<view class="section-title">七、法律管辖</view>
					<text>本协议适用中华人民共和国法律。如有争议，双方应友好协商解决；协商不成的，提交平台所在地法院诉讼解决。</text>
				</view>
			</view>

			<!-- 隐私政策部分 -->
			<view class="card">
				<view class="title">隐私政策</view>
				<view class="update-date">生效日期：2026-05-06</view>

				<view class="section">
					<view class="section-title">一、信息收集</view>
					<text>我们收集您提供的手机号、昵称、头像、地址等信息，用于账号管理、订单配送、客服反馈。</text>
					<text>在您使用平台服务时，我们可能自动记录日志信息（设备信息、IP地址、操作记录）。</text>
				</view>

				<view class="section">
					<view class="section-title">二、信息使用</view>
					<text>您的信息用于：身份验证、订单处理、个性化推荐、改进服务、发送通知。</text>
					<text>我们不会向第三方出售或共享您的个人信息，除非法律要求或经您同意。</text>
				</view>

				<view class="section">
					<view class="section-title">三、信息存储与保护</view>
					<text>您的信息存储在中国境内服务器。我们采用加密、访问控制等措施保障安全。</text>
				</view>

				<view class="section">
					<view class="section-title">四、您的权利</view>
					<text>您可以查看、修改或删除您的个人信息（头像、昵称等）。注销账号请联系客服。</text>
				</view>

				<view class="section">
					<view class="section-title">五、Cookie及同类技术</view>
					<text>我们使用Cookie来提升您的登录体验和统计分析，您可自行关闭浏览器Cookie功能。</text>
				</view>

				<view class="section">
					<view class="section-title">六、未成年人保护</view>
					<text>我们建议未成年人征得监护人同意后使用本平台。</text>
				</view>

				<view class="section">
					<view class="section-title">七、政策变更</view>
					<text>隐私政策如有重大变更，我们将通过公告或推送通知您。</text>
				</view>

				<view class="section">
					<view class="section-title">八、联系方式</view>
					<text>如有疑问，请发邮件至：privacy@fishing.com</text>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	export default {};
</script>

<style lang="scss" scoped>
	.agreement-privacy {
		background-color: #f8f8f8;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		overflow-x: hidden;
	}

	.scroll-view {
		flex: 1;
		width: 100%;
		box-sizing: border-box;
		padding: 20rpx 30rpx;
	}

	.card {
		background: #fff;
		border-radius: 24rpx;
		padding: 40rpx 30rpx;
		margin-bottom: 30rpx;
		box-sizing: border-box;
		width: 100%;

		.title {
			font-size: 40rpx;
			font-weight: bold;
			text-align: center;
			margin-bottom: 16rpx;
		}

		.update-date {
			text-align: center;
			font-size: 24rpx;
			color: #999;
			margin-bottom: 32rpx;
		}

		.section {
			margin-bottom: 32rpx;

			.section-title {
				font-size: 32rpx;
				font-weight: bold;
				margin-bottom: 16rpx;
				color: #5d7291;
			}

			text {
				font-size: 28rpx;
				color: #333;
				line-height: 1.6;
				display: block;
				margin-bottom: 8rpx;
			}
		}
	}
</style>