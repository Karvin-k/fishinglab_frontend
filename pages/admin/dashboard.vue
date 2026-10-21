<template>
	<view class="admin-dashboard">
		<!-- 顶部导航栏 -->
		<view class="admin-header">
			<view class="header-left">
				<text class="header-title">钓鱼平台管理后台</text>
			</view>
			<view class="header-right">
				<text class="admin-info">欢迎，{{ adminInfo.nickname || adminInfo.username }}</text>
				<u-button size="mini" type="primary" @click="logout" class="logout-btn">退出登录</u-button>
			</view>
		</view>

		<!-- 主要内容区域 -->
		<view class="admin-content">
			<!-- 侧边栏 -->
			<view class="admin-sidebar">
				<view class="sidebar-menu">
					<view v-for="item in menuList" :key="item.key" class="menu-item"
						:class="{ active: activeMenu === item.key }" @click="switchMenu(item.key)">
						<image class="menu-icon" :src="item.icon" mode="aspectFit"></image>
						<text class="menu-text">{{ item.name }}</text>
						<u-badge v-if="item.badge && item.badge > 0" :count="item.badge" :offset="[-10, -5]" />
					</view>
				</view>
			</view>

			<!-- 内容区域 -->
			<view class="admin-main">
				<!-- 仪表盘首页 -->
				<view v-if="activeMenu === 'dashboard'" class="dashboard-page">
					<view class="stats-cards">
						<view class="stat-card">
							<view class="stat-icon" style="background: #409EFF;">
								<u-icon name="order" color="#fff" size="32"></u-icon>
							</view>
							<view class="stat-content">
								<text class="stat-number">{{ stats.pendingApplications }}</text>
								<text class="stat-label">待审核申请</text>
							</view>
						</view>
						<view class="stat-card">
							<view class="stat-icon" style="background: #67C23A;">
								<u-icon name="checkmark" color="#fff" size="32"></u-icon>
							</view>
							<view class="stat-content">
								<text class="stat-number">{{ stats.approvedApplications }}</text>
								<text class="stat-label">已通过申请</text>
							</view>
						</view>
						<view class="stat-card">
							<view class="stat-icon" style="background: #E6A23C;">
								<u-icon name="clock" color="#fff" size="32"></u-icon>
							</view>
							<view class="stat-content">
								<text class="stat-number">{{ stats.totalApplications }}</text>
								<text class="stat-label">总申请数</text>
							</view>
						</view>
						<view class="stat-card">
							<view class="stat-icon" style="background: #F56C6C;">
								<u-icon name="close" color="#fff" size="32"></u-icon>
							</view>
							<view class="stat-content">
								<text class="stat-number">{{ stats.rejectedApplications }}</text>
								<text class="stat-label">已拒绝申请</text>
							</view>
						</view>
					</view>

					<!-- 最近申请 -->
					<view class="recent-applications">
						<view class="section-header">
							<text class="section-title">最近申请</text>
							<u-button size="mini" type="primary" @click="switchMenu('applications')">查看全部</u-button>
						</view>
						<view class="applications-list">
							<view v-for="item in recentApplications" :key="item.id" class="application-item">
								<view class="app-info">
									<text class="shop-name">{{ item.shop_name }}</text>
									<text class="contact-phone">{{ item.contact_phone }}</text>
									<text class="apply-time">{{ formatTime(item.apply_time) }}</text>
								</view>
								<view class="app-status">
									<u-tag :text="getStatusText(item.merchant_status)"
										:type="getStatusType(item.merchant_status)" size="mini" />
								</view>
							</view>
							<view v-if="recentApplications.length === 0" class="empty-state">
								<u-empty mode="list" text="暂无申请记录"></u-empty>
							</view>
						</view>
					</view>
				</view>

				<!-- 申请管理页面 -->
				<view v-if="activeMenu === 'applications'" class="applications-page">
					<view class="page-header">
						<text class="page-title">商家申请管理</text>
						<view class="filter-bar">
							<u-input v-model="searchKeyword" placeholder="搜索店铺名称或联系电话" prefix-icon="search" clearable
								@change="loadApplications" class="search-input" />
							<u-button type="primary" size="mini" @click="loadApplications">搜索</u-button>
						</view>
					</view>

					<!-- 申请列表 -->
					<view class="applications-table">
						<view class="table-header">
							<text class="col-shop">店铺名称</text>
							<text class="col-phone">联系电话</text>
							<text class="col-time">申请时间</text>
							<text class="col-status">状态</text>
							<text class="col-actions">操作</text>
						</view>
						<view class="table-body">
							<view v-for="item in applicationList" :key="item.id" class="table-row">
								<text class="col-shop">{{ item.shop_name }}</text>
								<text class="col-phone">{{ item.contact_phone }}</text>
								<text class="col-time">{{ formatTime(item.apply_time) }}</text>
								<text class="col-status">
									<u-tag :text="getStatusText(item.merchant_status)"
										:type="getStatusType(item.merchant_status)" size="mini" />
								</text>
								<view class="col-actions">
									<u-button v-if="item.merchant_status === 'pending'" type="primary" size="mini"
										@click="showReviewDialog(item)">
										审核
									</u-button>
									<u-button v-else type="info" size="mini" @click="showApplicationDetail(item)">
										查看
									</u-button>
								</view>
							</view>
							<view v-if="applicationList.length === 0" class="empty-state">
								<u-empty mode="list" text="暂无申请记录"></u-empty>
							</view>
						</view>
					</view>

					<!-- 自定义分页 -->
					<view class="pagination" v-if="totalCount > 0">
						<view class="pagination-btns">
							<u-button :disabled="currentPage === 1" @click="pageChange(currentPage - 1)" size="mini"
								type="default">
								上一页
							</u-button>
							<text class="page-info">第 {{ currentPage }} 页 / 共 {{ Math.ceil(totalCount / pageSize) }} 页</text>
							<u-button :disabled="currentPage * pageSize >= totalCount"
								@click="pageChange(currentPage + 1)" size="mini" type="primary">
								下一页
							</u-button>
						</view>
					</view>
				</view>

				<!-- Banner管理页面 -->
				<view v-if="activeMenu === 'banners'" class="banners-page">
					<view class="page-header">
						<text class="page-title">海报管理</text>
						<u-button type="primary" size="mini" @click="showBannerDialog(null)">添加Banner</u-button>
					</view>
					<view class="banners-table">
						<view class="table-header">
							<text class="col-image">图片</text>
							<text class="col-link">跳转链接</text>
							<text class="col-order">排序</text>
							<text class="col-status">状态</text>
							<text class="col-actions">操作</text>
						</view>
						<view class="table-body">
							<view v-for="item in bannerList" :key="item.id" class="table-row">
								<view class="col-image">
									<image :src="getFullImageUrl(item.image_url)" mode="aspectFill"
										class="banner-thumb"></image>
								</view>
								<text class="col-link">{{ item.link_url || '无' }}</text>
								<text class="col-order">{{ item.sort_order }}</text>
								<text class="col-status">
									<u-tag :text="item.status === 1 ? '启用' : '禁用'"
										:type="item.status === 1 ? 'success' : 'info'" size="mini" />
								</text>
								<view class="col-actions">
									<u-button type="primary" size="mini" @click="showBannerDialog(item)">编辑</u-button>
									<u-button type="error" size="mini" @click="deleteBanner(item.id)">删除</u-button>
								</view>
							</view>
						</view>
						<u-empty v-if="bannerList.length === 0" mode="list" text="暂无Banner"></u-empty>
					</view>
					<!-- Banner编辑弹窗 -->
					<u-popup v-model="showBannerPopup" mode="center" width="85%" border-radius="16">
						<view class="banner-popup">
							<view class="popup-header">
								<text class="popup-title">{{ bannerForm.id ? '编辑Banner' : '添加Banner' }}</text>
							</view>
							<view class="popup-content">
								<view class="form-item">
									<text class="label">图片：</text>
									<view class="upload-area">
										<!-- 图片预览模式 -->
										<image v-if="bannerForm.image_url" :src="getFullImageUrl(bannerForm.image_url)"
											class="preview-image"
											@click="previewImage(bannerForm.image_url, 'Banner图片')">
										</image>
										<!-- 上传模式 -->
										<view v-else class="upload-btn" @click="chooseBannerImage">
											<u-icon name="plus" size="40" color="#ccc" />
											<text>点击上传</text>
										</view>
										<!-- 删除按钮 -->
										<view v-if="bannerForm.image_url" class="delete-img-btn"
											@click="bannerForm.image_url = ''">
											<u-icon name="trash" size="28" color="#f56c6c" />
										</view>
									</view>
								</view>
								<view class="form-item">
									<text class="label">跳转链接：</text>
									<u-input v-model="bannerForm.link_url"
										placeholder="可选，例如 /pages/shop/detail?id=1" />
								</view>
								<view class="form-item">
									<text class="label">排序：</text>
									<u-input v-model.number="bannerForm.sort_order" type="number"
										placeholder="数字越小越靠前" />
								</view>
								<view class="form-item">
									<text class="label">状态：</text>
									<u-switch v-model="bannerForm.status" />
								</view>
							</view>
							<view class="popup-footer">
								<u-button type="default" @click="showBannerPopup = false">取消</u-button>
								<u-button type="primary" @click="submitBanner" :loading="bannerLoading">确定</u-button>
							</view>
						</view>
					</u-popup>
				</view>

				<!-- 优惠券管理页面 -->
				<view v-if="activeMenu === 'coupons'" class="coupons-page">
					<view class="page-header">
						<text class="page-title">优惠券管理</text>
						<u-button type="primary" size="mini" @click="showCouponDialog(null)">添加优惠券</u-button>
					</view>
					<view class="coupons-table">
						<view class="table-header">
							<text class="col-type">类型</text>
							<text class="col-value">面额</text>
							<text class="col-min">满减条件</text>
							<text class="col-expire">有效期</text>
							<text class="col-actions">操作</text>
						</view>
						<view class="table-body">
							<view v-for="item in couponList" :key="item.id" class="table-row">
								<text class="col-type">{{ getCouponTypeName(item.type) }}</text>
								<text class="col-value">¥{{ item.value }}</text>
								<text class="col-min">{{ item.condition }}</text>
								<text class="col-expire">{{ item.expire }}</text>
								<view class="col-actions">
									<u-button type="error" size="mini" @click="deleteCoupon(item.id)">删除</u-button>
								</view>
							</view>
						</view>
						<u-empty v-if="couponList.length === 0" mode="list" text="暂无优惠券"></u-empty>
					</view>
					<!-- 添加优惠券弹窗 -->
					<u-popup v-model="showCouponPopup" mode="center" width="85%" border-radius="16">
						<view class="coupon-popup">
							<view class="popup-header">
								<text class="popup-title">添加优惠券</text>
							</view>
							<view class="popup-content">
								<view class="form-item">
									<text class="label">类型：</text>
									<view class="custom-select" @click="showTypePicker = true">
										{{ couponForm.typeLabel || '请选择类型' }}
									</view>
									<u-picker mode="selector" v-model="showTypePicker" :range="couponTypeList"
										range-key="label" @confirm="onTypePickerConfirm"></u-picker>
								</view>
								<view class="form-item">
									<text class="label">面额（元）：</text>
									<u-input v-model="couponForm.value" type="number" placeholder="例如 10" />
								</view>
								<view class="form-item">
									<text class="label">最低消费（元）：</text>
									<u-input v-model="couponForm.min_amount" type="number" placeholder="例如 50" />
								</view>
								<view class="form-item">
									<text class="label">有效期：</text>
									<view class="custom-select" @click="showDatePicker = true">
										{{ couponForm.expire_date || '请选择日期' }}
									</view>
									<u-picker mode="selector" v-model="showDatePicker" :range="dateOptions"
										range-key="label" @confirm="onDatePickerConfirm"></u-picker>
								</view>
							</view>
							<view class="popup-footer">
								<u-button type="default" @click="showCouponPopup = false">取消</u-button>
								<u-button type="primary" @click="submitCoupon" :loading="couponLoading">确定</u-button>
							</view>
						</view>
					</u-popup>
				</view>

				<!-- 数据分析页面 -->
				<view v-if="activeMenu === 'statistics'" class="statistics-page">
					<view class="page-header">
						<text class="page-title">数据统计</text>
					</view>

					<!-- 核心指标卡片 -->
					<view class="stats-cards">
						<view class="stat-card">
							<view class="stat-icon" style="background: #409EFF;">
								<u-icon name="order" color="#fff" size="32"></u-icon>
							</view>
							<view class="stat-content">
								<text
									class="stat-number">¥{{ (statistics.overview.orders && statistics.overview.orders.total_amount || 0).toFixed(0) }}</text>
								<text class="stat-label">总订单数</text>
							</view>
						</view>
						<view class="stat-card">
							<view class="stat-icon" style="background: #67C23A;">
								<u-icon name="rmb" color="#fff" size="32"></u-icon>
							</view>
							<view class="stat-content">
								<text
									class="stat-number">¥{{ (statistics.overview.orders && statistics.overview.orders.total_amount || 0).toFixed(2) }}</text>
								<text class="stat-label">总交易额</text>
							</view>
						</view>
						<view class="stat-card">
							<view class="stat-icon" style="background: #E6A23C;">
								<u-icon name="account" color="#fff" size="32"></u-icon>
							</view>
							<view class="stat-content">
								<text
									class="stat-number">{{ statistics.overview.users && statistics.overview.users.total || 0 }}</text>
								<text class="stat-label">总用户数</text>
							</view>
						</view>
						<view class="stat-card">
							<view class="stat-icon" style="background: #F56C6C;">
								<u-icon name="shopping-cart" color="#fff" size="32"></u-icon>
							</view>
							<view class="stat-content">
								<text class="stat-number">{{ statistics.overview.products_total || 0 }}</text>
								<text class="stat-label">商品总数</text>
							</view>
						</view>
					</view>

					<!-- 订单状态分布 - 饼图 -->
					<view class="section-card">
						<view class="section-header">
							<text class="section-title">订单状态分布</text>
							<view class="view-switch" @click="showPieChart = !showPieChart">
								<u-icon :name="showPieChart ? 'table' : 'pie-chart'" size="28" color="#5d7291"></u-icon>
								<text>{{ showPieChart ? '切换表格' : '切换图表' }}</text>
							</view>
						</view>
						<!-- 图表视图 -->
						<qiun-data-charts v-if="showPieChart" type="pie" :chartData="pieChartData" :opts="pieOpts" />
						<!-- 表格视图 -->
						<view v-else class="status-list">
							<view v-for="item in statistics.statusDistribution" :key="item.name" class="status-item">
								<text>{{ item.name }}</text>
								<text>{{ item.value }} 单</text>
							</view>
						</view>
					</view>

					<!-- 近30天订单趋势 - 折线图 -->
					<view class="section-card">
						<view class="section-header">
							<text class="section-title">近30天订单趋势</text>
							<view class="view-switch" @click="showTrendChart = !showTrendChart">
								<u-icon :name="showTrendChart ? 'table' : 'chart'" size="28" color="#5d7291"></u-icon>
								<text>{{ showTrendChart ? '切换表格' : '切换图表' }}</text>
							</view>
						</view>
						<!-- 图表视图 -->
						<qiun-data-charts v-if="showTrendChart" type="line" :chartData="trendChartData"
							:opts="trendOpts" />
						<!-- 表格视图 -->
						<view v-else class="trend-table">
							<!-- 表格内容保持不变，具体实现略 -->
							<view class="trend-row header">
								<text>日期</text>
								<text>订单数</text>
								<text>金额(元)</text>
							</view>
							<view class="trend-row" v-for="item in statistics.ordersTrend" :key="item.date">
								<text>{{ item.date }}</text>
								<text>{{ item.count }}</text>
								<text>{{ item.amount.toFixed(2) }}</text>
							</view>
						</view>
					</view>

					<!-- 热销商品TOP5 - 柱状图 -->
					<view class="section-card">
						<view class="section-header">
							<text class="section-title">热销商品TOP5</text>
							<view class="view-switch" @click="showBarChart = !showBarChart">
								<u-icon :name="showBarChart ? 'table' : 'chart'" size="28" color="#5d7291"></u-icon>
								<text>{{ showBarChart ? '切换表格' : '切换图表' }}</text>
							</view>
						</view>
						<!-- 图表视图 -->
						<qiun-data-charts v-if="showBarChart" type="bar" :chartData="barChartData" :opts="barOpts" />
						<!-- 表格视图 -->
						<view v-else class="rank-table">
							<view v-for="(item, idx) in statistics.productsTop" :key="item.id" class="rank-table-item">
								<view class="rank-index">{{ idx+1 }}</view>
								<image class="rank-img" :src="getFullImageUrl(item.image)" mode="aspectFill"></image>
								<view class="rank-info">
									<text class="rank-name">{{ item.name }}</text>
									<text class="rank-stats">销量 {{ item.sales }} 件</text>
								</view>
							</view>
							<view v-if="statistics.productsTop.length === 0" class="empty-tip">暂无数据</view>
						</view>
					</view>

					<!-- 热销钓场TOP5（默认表格，无图表，纯展示） -->
					<view class="section-card">
						<view class="section-header">
							<text class="section-title">热销钓场TOP5</text>
						</view>
						<view class="rank-table">
							<view v-for="(item, idx) in statistics.servicesTop" :key="item.id" class="rank-table-item">
								<view class="rank-index">{{ idx+1 }}</view>
								<image class="rank-img" :src="getFullImageUrl(item.image)" mode="aspectFill"></image>
								<view class="rank-info">
									<text class="rank-name">{{ item.name }}</text>
									<text class="rank-stats">预约 {{ item.bookings }} 次</text>
								</view>
							</view>
							<view v-if="statistics.servicesTop.length === 0" class="empty-tip">暂无数据</view>
						</view>
					</view>

					<!-- 用户增长趋势 - 折线图（仅图表） -->
					<view class="section-card">
						<view class="section-header">
							<text class="section-title">近30天用户增长</text>
						</view>
						<qiun-data-charts type="line" :chartData="userGrowthChartData" :opts="userGrowthOpts" />
					</view>
				</view>
			</view>
		</view>

		<!-- 审核弹窗 -->
		<u-popup v-model="showReviewPopup" mode="center" width="85%" height="90%" border-radius="16">
			<view class="review-popup">
				<view class="popup-header">
					<text class="popup-title">审核商家申请</text>
				</view>
				<view class="popup-content">
					<view class="application-detail">
						<view class="detail-item">
							<text class="label">店铺名称：</text>
							<text class="value">{{ currentApplication.shop_name }}</text>
						</view>
						<view class="detail-item">
							<text class="label">联系电话：</text>
							<text class="value">{{ currentApplication.contact_phone }}</text>
						</view>
						<view class="detail-item">
							<text class="label">店铺地址：</text>
							<text class="value">{{ currentApplication.shop_address }}</text>
						</view>
						<view class="detail-item">
							<text class="label">经营范围：</text>
							<text class="value">{{ currentApplication.business_scope }}</text>
						</view>
					</view>

					<!-- 图片显示区域 -->
					<view class="image-display-section">
						<text class="image-section-title">申请材料</text>

						<!-- 营业执照 -->
						<view class="image-item">
							<text class="image-label">营业执照：</text>
							<view class="image-preview-container">
								<image :src="getFullImageUrl(currentApplication.business_license)" mode="aspectFit"
									class="preview-image"
									@click="previewImage(currentApplication.business_license, '营业执照')"></image>
								<text class="image-tip">点击查看大图</text>
							</view>
						</view>

						<!-- 身份证正面 -->
						<view class="image-item">
							<text class="image-label">身份证正面：</text>
							<view class="image-preview-container">
								<image :src="getFullImageUrl(currentApplication.id_card_front)" mode="aspectFit"
									class="preview-image"
									@click="previewImage(currentApplication.id_card_front, '身份证正面')"></image>
								<text class="image-tip">点击查看大图</text>
							</view>
						</view>

						<!-- 身份证反面 -->
						<view class="image-item">
							<text class="image-label">身份证反面：</text>
							<view class="image-preview-container">
								<image :src="getFullImageUrl(currentApplication.id_card_back)" mode="aspectFit"
									class="preview-image"
									@click="previewImage(currentApplication.id_card_back, '身份证反面')"></image>
								<text class="image-tip">点击查看大图</text>
							</view>
						</view>
					</view>


					<view class="review-actions">
						<text class="action-title">请选择审核结果：</text>

						<!-- 优化后的选择按钮 -->
						<view class="action-buttons">
							<view class="action-btn approve-btn" :class="{ active: reviewAction === 'approve' }"
								@click="reviewAction = 'approve'">
								<view class="btn-icon">
									<u-icon name="checkmark-circle" color="#67C23A" size="48"></u-icon>
								</view>
								<view class="btn-content">
									<text class="btn-title">通过申请</text>
									<text class="btn-desc">商家将获得平台入驻资格</text>
								</view>
								<view class="btn-check" v-if="reviewAction === 'approve'">
									<u-icon name="checkmark" color="#67C23A" size="32"></u-icon>
								</view>
							</view>

							<view class="action-btn reject-btn" :class="{ active: reviewAction === 'reject' }"
								@click="reviewAction = 'reject'">
								<view class="btn-icon">
									<u-icon name="close-circle" color="#F56C6C" size="48"></u-icon>
								</view>
								<view class="btn-content">
									<text class="btn-title">拒绝申请</text>
									<text class="btn-desc">商家将无法入驻平台</text>
								</view>
								<view class="btn-check" v-if="reviewAction === 'reject'">
									<u-icon name="checkmark" color="#F56C6C" size="32"></u-icon>
								</view>
							</view>
						</view>

						<!-- 拒绝理由输入框 -->
						<view v-if="reviewAction === 'reject'" class="reject-reason-section">
							<text class="reason-title">拒绝理由：</text>
							<view class="reason-input">
								<u-input v-model="rejectReason" type="textarea"
									placeholder="请详细说明拒绝的原因，这将帮助商家了解问题所在并进行改进..." height="120" :border="true" />
							</view>
							<text class="reason-tip">请务必填写详细的拒绝理由，以便商家理解</text>
						</view>
					</view>
				</view>
				<view class="popup-footer">
					<u-button type="primary" @click="showReviewPopup = false" class="cancel-btn">取消</u-button>
					<u-button type="primary" @click="handleReview" :loading="reviewLoading"
						:class="reviewAction === 'reject' ? 'reject-confirm-btn' : 'approve-confirm-btn'">
						{{ reviewLoading ? '处理中...' : reviewAction === 'approve' ? '确认通过' : '确认拒绝' }}
					</u-button>
				</view>
			</view>
		</u-popup>

		<u-popup v-model="showCustomPreview" mode="center" width="90%" height="80%" border-radius="16">
			<view class="custom-preview">
				<view class="preview-header">
					<text class="preview-title">{{ previewImageTitle }}</text>
					<u-icon name="close" size="32" @click="closeCustomPreview" class="close-icon"></u-icon>
				</view>
				<view class="preview-content">
					<image :src="previewImageUrl" mode="aspectFit" class="full-preview-image"></image>
				</view>
			</view>
		</u-popup>
	</view>
</template>

<script>
	import request from '@/common/request.js';

	export default {
		data() {
			return {
				showCustomPreview: false,
				previewImageUrl: '',
				previewImageTitle: '',
				activeMenu: 'dashboard',
				adminInfo: {},
				stats: {
					pendingApplications: 0,
					approvedApplications: 0,
					rejectedApplications: 0,
					totalApplications: 0
				},
				recentApplications: [],
				applicationList: [],
				searchKeyword: '',
				currentPage: 1,
				pageSize: 10,
				totalCount: 0,
				showReviewPopup: false,
				currentApplication: {},
				reviewAction: 'approve',
				rejectReason: '',
				reviewLoading: false,
				menuList: [{
						key: 'dashboard',
						name: '仪表盘',
						icon: '/static/icons/dashboard.png',
						badge: 0
					},
					{
						key: 'applications',
						name: '申请管理',
						icon: '/static/icons/applications.png',
						badge: 0
					},
					{
						key: 'banners',
						name: '海报管理',
						icon: '/static/icons/banner.png'
					},
					{
						key: 'coupons',
						name: '优惠券管理',
						icon: '/static/icons/coupon.png'
					},
					{
						key: 'statistics',
						name: '数据分析',
						icon: '/static/icons/statistics.png'
					}
				],
				// Banner相关
				bannerList: [],
				bannerForm: {
					id: null,
					image_url: '',
					link_url: '',
					sort_order: 0,
					status: true
				},
				showBannerPopup: false,
				bannerLoading: false,
				// 优惠券相关
				couponList: [],
				couponForm: {
					type: '', // 存储 value 值，如 'unlimited'
					typeLabel: '', // 存储显示文本，如 '无门槛'
					value: 0,
					min_amount: 0,
					expire_date: ''
				},
				showCouponPopup: false,
				couponLoading: false,
				couponTypeList: [{
						label: '无门槛',
						value: 'unlimited'
					},
					{
						label: '鱼竿类',
						value: 'rod'
					},
					{
						label: '鱼饵类',
						value: 'bait'
					},
					{
						label: '配件类',
						value: 'accessory'
					}
				],
				showTypePicker: false,
				showDatePicker: false,
				dateOptions: [], // 日期选项列表 [{ label: '2026-05-10', value: '2026-05-10' }]
				// 数据统计相关
				statistics: {
					overview: {},
					ordersTrend: [],
					productsTop: [],
					servicesTop: [],
					statusDistribution: [],
					userGrowth: []
				},
				loadingStats: false,

				// 视图切换标志
				showPieChart: true,
				showTrendChart: true,
				showBarChart: true,

				// 图表的配置项（可自定义外观）
				pieOpts: {
					legend: {
						position: 'bottom'
					},
					dataLabel: true,
					extra: {
						pie: {
							labelPosition: 'outside'
						}
					}
				},
				trendOpts: {
					xAxis: {
						rotateLabel: true
					},
					yAxis: {
						gridType: 'dash'
					},
					legend: {
						position: 'top'
					}
				},
				barOpts: {
					color: ["#f38b11"], // 设置条形图颜色
					xAxis: {
						rotateLabel: true
					},
					yAxis: {
						gridType: 'dash'
					},
					dataLabel: true
				},
				userGrowthOpts: {
					xAxis: {
						rotateLabel: true
					},
					yAxis: {
						gridType: 'dash'
					}
				},

				// 图表数据
				pieChartData: {},
				trendChartData: {},
				barChartData: {
					categories: [], // 由统计数据填充
					series: []
				},
				userGrowthChartData: {}
			};
		},
		onLoad() {
			this.checkAdminLogin();
			this.loadDashboardData();
			this.generateDateOptions(); // 生成日期选项
		},
		onShow() {
			// 若当前菜单为 banners 或 coupons，刷新数据（可能在其他地方修改后返回）
			if (this.activeMenu === 'banners') this.loadBanners();
			if (this.activeMenu === 'coupons') this.loadCoupons();
			this.loadDashboardData();
		},
		methods: {
			// 获取完整的图片URL
			getFullImageUrl(relativeUrl) {
				if (!relativeUrl) return '';
				if (relativeUrl.startsWith('http')) return relativeUrl;
				// 后端返回的相对路径已包含 /static/uploads/，直接拼接到 baseURL
				return uni.$imgUrl(relativeUrl);
			},

			// 预览图片
			previewImage(imageUrl, title = '图片预览') {
				if (!imageUrl) {
					uni.showToast({
						title: '图片不存在',
						icon: 'none'
					});
					return;
				}
				this.previewImageUrl = this.getFullImageUrl(imageUrl);
				this.previewImageTitle = title;
				this.showCustomPreview = true;
			},
			closeCustomPreview() {
				this.showCustomPreview = false;
				this.previewImageUrl = '';
				this.previewImageTitle = '';
			},
			// 生成日期选择
			generateDateOptions() {
				const options = [];
				const startDate = new Date();
				for (let i = 0; i <= 90; i++) { // 从今天起未来90天
					const date = new Date(startDate);
					date.setDate(startDate.getDate() + i);
					const year = date.getFullYear();
					const month = String(date.getMonth() + 1).padStart(2, '0');
					const day = String(date.getDate()).padStart(2, '0');
					const value = `${year}-${month}-${day}`;
					options.push({
						label: value,
						value: value
					});
				}
				this.dateOptions = options;
			},

			// 管理员请求辅助
			async adminRequest(url, options = {}) {
				const token = uni.getStorageSync('adminToken');
				if (!token) {
					uni.reLaunch({
						url: '/pages/admin/login'
					});
					throw new Error('未登录');
				}
				const fullUrl = uni.$imgUrl(url);
				const header = {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
					...options.headers
				};
				return new Promise((resolve, reject) => {
					uni.request({
						url: fullUrl,
						method: options.method || 'GET',
						data: options.data,
						header: header,
						success: (res) => {
							if (res.statusCode === 401 || (res.data && res.data.code === 401)) {
								uni.removeStorageSync('adminToken');
								uni.removeStorageSync('adminInfo');
								uni.reLaunch({
									url: '/pages/admin/login'
								});
								reject(new Error('未授权'));
							} else {
								resolve(res);
							}
						},
						fail: reject
					});
				});
			},

			// 检查管理员登录状态
			checkAdminLogin() {
				const token = uni.getStorageSync('adminToken');
				const adminInfo = uni.getStorageSync('adminInfo');
				if (!token || !adminInfo) {
					uni.redirectTo({
						url: '/pages/admin/login'
					});
				} else {
					this.adminInfo = adminInfo;
				}
			},
			// 加载数据统计
			async loadStatistics() {
				if (this.loadingStats) return;
				this.loadingStats = true;
				try {
					// 并发请求所有接口
					const [overviewRes, trendRes, productsRes, servicesRes, statusRes, userGrowthRes] = await Promise
						.all([
							this.adminRequest('/api/admin/statistics/overview'),
							this.adminRequest('/api/admin/statistics/orders/trend'),
							this.adminRequest('/api/admin/statistics/products/top'),
							this.adminRequest('/api/admin/statistics/services/top'),
							this.adminRequest('/api/admin/statistics/orders/status'),
							this.adminRequest('/api/admin/statistics/users/growth')
						]);

					if (overviewRes.data.code === 0) this.statistics.overview = overviewRes.data.data;
					if (trendRes.data.code === 0) this.statistics.ordersTrend = trendRes.data.data;
					if (productsRes.data.code === 0) this.statistics.productsTop = productsRes.data.data;
					if (servicesRes.data.code === 0) this.statistics.servicesTop = servicesRes.data.data;
					if (statusRes.data.code === 0) this.statistics.statusDistribution = statusRes.data.data;
					if (userGrowthRes.data.code === 0) this.statistics.userGrowth = userGrowthRes.data.data;

					// 设置颜色
					this.barChartData = {
						categories: this.statistics.productsTop.map(item => item.name),
						series: [{
							name: '销量',
							data: this.statistics.productsTop.map(item => item.sales),
							color: "#f38b11" // 动态设置颜色
						}]
					};

					// 数据加载完成后，格式化图表数据
					this.formatChartData();
				} catch (error) {
					console.error('加载统计数据失败', error);
					uni.showToast({
						title: '加载统计数据失败',
						icon: 'none'
					});
				} finally {
					this.loadingStats = false;
				}
			},

			// 格式化数据，供图表使用
			formatChartData() {
				// 1. 订单状态分布（饼图）
				if (this.statistics.statusDistribution.length) {
					this.pieChartData = {
						series: this.statistics.statusDistribution.map(item => ({
							name: item.name,
							data: item.value
						}))
					};
				}

				// 2. 订单趋势（折线图）
				if (this.statistics.ordersTrend.length) {
					this.trendChartData = {
						categories: this.statistics.ordersTrend.map(item => item.date.slice(5)),
						series: [{
							name: '订单数',
							data: this.statistics.ordersTrend.map(item => item.count)
						}]
					};
				}

				// 3. 热销商品TOP5（柱状图）
				if (this.statistics.productsTop.length) {
					this.barChartData = {
						categories: this.statistics.productsTop.map(item => item.name),
						series: [{
							name: '销量',
							data: this.statistics.productsTop.map(item => item.sales)
						}]
					};
				}

				// 4. 用户增长趋势（折线图）
				if (this.statistics.userGrowth.length) {
					this.userGrowthChartData = {
						categories: this.statistics.userGrowth.map(item => item.date.slice(5)),
						series: [{
							name: '新增用户',
							data: this.statistics.userGrowth.map(item => item.count)
						}]
					};
				}
			},

			// ----- 仪表盘相关 -----
			async loadDashboardData() {
				try {
					const [statsRes, recentRes] = await Promise.all([
						this.adminRequest('/api/admin/applications/stats'),
						this.adminRequest('/api/admin/applications/recent')
					]);
					if (statsRes.data.code === 0) {
						this.stats = statsRes.data.data;
						// 更新菜单徽章（待审核数量）
						this.menuList[1].badge = statsRes.data.data.pendingApplications;
					}
					if (recentRes.data.code === 0) {
						this.recentApplications = recentRes.data.data;
					}
					if (this.activeMenu === 'applications') this.loadApplications();
				} catch (error) {
					console.error('加载仪表盘数据失败:', error);
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					});
				}
			},

			// ----- 申请管理 -----
			async loadApplications() {
				try {
					const params = {
						page: this.currentPage,
						page_size: this.pageSize
					};
					if (this.searchKeyword) params.keyword = this.searchKeyword;
					const res = await this.adminRequest('/api/admin/applications', {
						data: params
					});
					if (res.data.code === 0) {
						this.applicationList = res.data.data.list;
						this.totalCount = res.data.data.total;
					} else {
						uni.showToast({
							title: res.data.message || '加载失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('加载申请列表失败:', error);
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					});
				}
			},

			showReviewDialog(application) {
				this.currentApplication = application;
				this.reviewAction = 'approve';
				this.rejectReason = '';
				this.showReviewPopup = true;
			},

			async handleReview() {
				if (this.reviewAction === 'reject' && !this.rejectReason.trim()) {
					uni.showToast({
						title: '请输入拒绝理由',
						icon: 'none'
					});
					return;
				}
				this.reviewLoading = true;
				try {
					const res = await this.adminRequest('/api/merchant/review', {
						method: 'POST',
						data: {
							applicationId: this.currentApplication.id,
							action: this.reviewAction,
							rejectReason: this.rejectReason
						}
					});
					if (res.data.code === 0) {
						uni.showToast({
							title: '审核成功',
							icon: 'success'
						});
						this.showReviewPopup = false;
						this.loadDashboardData();
					} else {
						uni.showToast({
							title: res.data.message || '审核失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('审核失败:', error);
					uni.showToast({
						title: '审核失败',
						icon: 'none'
					});
				} finally {
					this.reviewLoading = false;
				}
			},

			pageChange(page) {
				this.currentPage = page;
				this.loadApplications();
			},

			showApplicationDetail(application) {
				uni.showModal({
					title: '申请详情',
					content: `店铺名称：${application.shop_name}\n联系电话：${application.contact_phone}\n店铺地址：${application.shop_address}\n经营范围：${application.business_scope}\n申请时间：${this.formatTime(application.apply_time)}`,
					showCancel: false
				});
			},

			// ----- Banner管理 -----
			async loadBanners() {
				try {
					const res = await this.adminRequest('/api/admin/banners');
					if (res.data.code === 0) {
						this.bannerList = res.data.data.list || [];
					} else {
						uni.showToast({
							title: res.data.message || '加载失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('加载Banner失败', error);
					uni.showToast({
						title: '加载失败，请检查网络',
						icon: 'none'
					});
				}
			},

			showBannerDialog(item) {
				if (item) {
					this.bannerForm = {
						...item,
						status: item.status === 1 // 数字转布尔
					};
				} else {
					this.bannerForm = {
						id: null,
						image_url: '',
						link_url: '',
						sort_order: 0,
						status: true
					};
				}
				this.showBannerPopup = true;
			},

			async chooseBannerImage() {
				uni.chooseImage({
					count: 1,
					success: async (res) => {
						const file = res.tempFiles[0];
						uni.showLoading({
							title: '上传中...'
						});
						try {
							// 使用 uni.uploadFile 上传，但需要携带 adminToken
							const uploadRes = await new Promise((resolve, reject) => {
								uni.uploadFile({
									url: uni.$baseUrl + '/api/upload',
									filePath: file.path,
									name: 'file',
									header: {
										'Authorization': `Bearer ${uni.getStorageSync('adminToken')}`
									},
									success: (r) => resolve(r),
									fail: reject
								});
							});
							const result = JSON.parse(uploadRes.data);
							if (result.code === 0) {
								this.$set(this.bannerForm, 'image_url', result.data.url);
								uni.showToast({
									title: '上传成功',
									icon: 'success'
								});
							} else {
								uni.showToast({
									title: result.message || '上传失败',
									icon: 'none'
								});
							}
						} catch (error) {
							console.error('上传失败', error);
							uni.showToast({
								title: '上传失败',
								icon: 'none'
							});
						} finally {
							uni.hideLoading();
						}
					}
				});
			},

			async submitBanner() {
				if (!this.bannerForm.image_url) {
					uni.showToast({
						title: '请上传图片',
						icon: 'none'
					});
					return;
				}
				this.bannerLoading = true;
				const url = this.bannerForm.id ? `/api/admin/banners/${this.bannerForm.id}` : '/api/admin/banners';
				const method = this.bannerForm.id ? 'PUT' : 'POST';
				// 转换 status 为数字
				const submitData = {
					...this.bannerForm,
					status: this.bannerForm.status ? 1 : 0
				};
				try {
					const res = await this.adminRequest(url, {
						method,
						data: submitData
					});
					if (res.data.code === 0) {
						uni.showToast({
							title: '保存成功',
							icon: 'success'
						});
						this.showBannerPopup = false;
						this.loadBanners();
					} else {
						uni.showToast({
							title: res.data.message,
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('保存Banner失败', error);
					uni.showToast({
						title: '保存失败',
						icon: 'none'
					});
				} finally {
					this.bannerLoading = false;
				}
			},

			async deleteBanner(id) {
				uni.showModal({
					title: '确认删除',
					content: '删除后不可恢复，确定吗？',
					success: async (modalRes) => {
						if (modalRes.confirm) {
							try {
								const res = await this.adminRequest(`/api/admin/banners/${id}`, {
									method: 'DELETE'
								});
								if (res.data.code === 0) {
									uni.showToast({
										title: '删除成功',
										icon: 'success'
									});
									this.loadBanners();
								} else {
									uni.showToast({
										title: res.data.message,
										icon: 'none'
									});
								}
							} catch (error) {
								console.error('删除Banner失败', error);
								uni.showToast({
									title: '删除失败',
									icon: 'none'
								});
							}
						}
					}
				});
			},

			// ----- 优惠券管理 -----
			async loadCoupons() {
				try {
					const res = await this.adminRequest('/api/admin/coupons');
					if (res.data.code === 0) {
						this.couponList = res.data.data.list || [];
					} else {
						uni.showToast({
							title: res.data.message || '加载失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('加载优惠券失败', error);
					uni.showToast({
						title: '加载失败，请检查网络',
						icon: 'none'
					});
				}
			},

			showCouponDialog() {
				this.couponForm = {
					type: '',
					typeLabel: '',
					value: 0,
					min_amount: 0,
					expire_date: ''
				};
				this.showCouponPopup = true;
			},

			onTypePickerConfirm(e) {
				const index = e[0];
				const selected = this.couponTypeList[index];
				if (selected) {
					this.couponForm.type = selected.value;
					this.couponForm.typeLabel = selected.label;
				}
			},
			// 日期确认
			onDatePickerConfirm(e) {
				const index = e[0];
				const selected = this.dateOptions[index];
				if (selected) {
					this.couponForm.expire_date = selected.value;
				}
			},


			async submitCoupon() {
				if (!this.couponForm.type || !this.couponForm.value || !this.couponForm.min_amount || !this.couponForm
					.expire_date) {
					uni.showToast({
						title: '请填写完整信息',
						icon: 'none'
					});
					return;
				}

				// 校验最低消费不能小于面额
				const minAmount = parseFloat(this.couponForm.min_amount);
				const value = parseFloat(this.couponForm.value);
				if (minAmount < value) {
				    uni.showToast({ title: '最低消费金额不能小于优惠券面额', icon: 'none' });
				    return;
				}
				
				
				this.couponLoading = true;
				try {
					const res = await this.adminRequest('/api/admin/coupons', {
						method: 'POST',
						data: {
							type: this.couponForm.type,
							value: parseInt(this.couponForm.value),
							min_amount: parseInt(this.couponForm.min_amount),
							expire_date: this.couponForm.expire_date
						}
					});
					if (res.data.code === 0) {
						uni.showToast({
							title: '添加成功',
							icon: 'success'
						});
						this.showCouponPopup = false;
						this.loadCoupons();
					} else {
						uni.showToast({
							title: res.data.message,
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('添加优惠券失败', error);
					uni.showToast({
						title: '添加失败',
						icon: 'none'
					});
				} finally {
					this.couponLoading = false;
				}
			},

			async deleteCoupon(id) {
				uni.showModal({
					title: '确认删除',
					content: '删除后已领取用户的优惠券可能失效，确定吗？',
					success: async (modalRes) => {
						if (modalRes.confirm) {
							try {
								const res = await this.adminRequest(`/api/admin/coupons/${id}`, {
									method: 'DELETE'
								});
								if (res.data.code === 0) {
									uni.showToast({
										title: '删除成功',
										icon: 'success'
									});
									this.loadCoupons();
								} else {
									uni.showToast({
										title: res.data.message,
										icon: 'none'
									});
								}
							} catch (error) {
								console.error('删除优惠券失败', error);
								uni.showToast({
									title: '删除失败',
									icon: 'none'
								});
							}
						}
					}
				});
			},

			getCouponTypeName(type) {
				const map = {
					unlimited: '无门槛',
					rod: '鱼竿类',
					bait: '鱼饵类',
					accessory: '配件类'
				};
				return map[type] || type;
			},

			// 切换菜单
			switchMenu(menuKey) {
				this.activeMenu = menuKey;
				if (menuKey === 'applications') this.loadApplications();
				if (menuKey === 'banners') this.loadBanners();
				if (menuKey === 'coupons') this.loadCoupons();
				if (menuKey === 'statistics') this.loadStatistics();
			},

			showAdminManage() {
				uni.showToast({
					title: '管理员管理功能开发中',
					icon: 'none'
				});
			},

			showOperationLogs() {
				uni.showToast({
					title: '操作日志功能开发中',
					icon: 'none'
				});
			},

			logout() {
				uni.showModal({
					title: '确认退出',
					content: '确定要退出管理系统吗？',
					success: (res) => {
						if (res.confirm) {
							uni.removeStorageSync('adminToken');
							uni.removeStorageSync('adminInfo');
							uni.reLaunch({
								url: '/pages/admin/login'
							});
						}
					}
				});
			},

			formatTime(timeStr) {
				if (!timeStr) return '';
				const date = new Date(timeStr);
				return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
			},

			getStatusText(status) {
				const statusMap = {
					pending: '待审核',
					approved: '已通过',
					rejected: '已拒绝'
				};
				return statusMap[status] || status;
			},

			getStatusType(status) {
				const typeMap = {
					pending: 'warning',
					approved: 'success',
					rejected: 'error'
				};
				return typeMap[status] || 'info';
			}
		}
	};
</script>

<style scoped>
	/* 自定义图片预览弹窗样式 */
	.custom-preview {
		background: rgba(0, 0, 0, 0.9);
		border-radius: 0;
		overflow: hidden;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
		background: rgba(0, 170, 255, 0.8);
	}

	.preview-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #fff;
	}

	.close-icon {
		padding: 10rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.2);
		color: #fff;
	}

	.preview-content {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 40rpx;
		background: #000;
	}

	.full-preview-image {
		width: 100%;
		height: 100%;
		max-width: 100%;
		max-height: 100%;
		border-radius: 16rpx;
		box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.3);
	}

	.close-btn {
		width: 100%;
	}

	/* 图片显示区域样式（审核弹窗中的申请材料） */
	.image-display-section {
		margin-top: 30rpx;
		padding: 30rpx;
		background: #fff;
		border-radius: 24rpx;
		border-left: 4rpx solid #409eff;
	}

	.image-section-title {
		display: block;
		font-size: 30rpx;
		font-weight: 600;
		color: #333;
		margin-bottom: 24rpx;
		padding-bottom: 16rpx;
		border-bottom: 1rpx solid #e1e4e8;
	}

	.image-item {
		margin-bottom: 32rpx;
		padding: 20rpx;
		background: #fff;
		border-radius: 12rpx;
		border: 1rpx solid #e1e4e8;
	}

	.image-item:last-child {
		margin-bottom: 0;
	}

	.image-label {
		display: block;
		font-size: 26rpx;
		font-weight: 600;
		color: #333;
		margin-bottom: 16rpx;
	}

	.image-preview-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12rpx;
	}

	.preview-image {
		width: 300rpx;
		height: 200rpx;
		border-radius: 8rpx;
		border: 2rpx solid #e1e4e8;
		background: #fafafa;
	}

	.preview-image:active {
		opacity: 0.8;
		transform: scale(0.98);
	}

	.image-tip {
		font-size: 22rpx;
		color: #909399;
		text-align: center;
	}

	/* 分页按钮样式 */
	.pagination-btns {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 20rpx;
		margin-top: 30rpx;
	}

	.page-info {
		font-size: 26rpx;
		color: #666;
	}

	/* 页面整体布局 */
	.admin-dashboard {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: #f5f7fa;
	}

	/* 头部样式 */
	.admin-header {
		height: 80rpx;
		background: #fff;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 30rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
		z-index: 1000;
	}

	.header-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #333;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 20rpx;
	}

	.admin-info {
		font-size: 26rpx;
		color: #666;
	}

	.logout-btn {
		min-width: 120rpx;
	}

	/* 内容区域 */
	.admin-content {
		flex: 1;
		display: flex;
		overflow: hidden;
	}

	/* 侧边栏 */
	.admin-sidebar {
		width: 260rpx;
		background: #fff;
		border-right: 1rpx solid #eaeaea;
	}

	.sidebar-menu {
		padding: 20rpx 0;
	}

	.menu-item {
		display: flex;
		align-items: center;
		padding: 24rpx 30rpx;
		position: relative;
		cursor: pointer;
		transition: all 0.3s;
	}

	.menu-item:hover {
		background: #f5f7fa;
	}

	.menu-item.active {
		background: #409eff;
		color: #fff;
	}

	.menu-item.active .menu-text {
		color: #fff;
	}

	.menu-icon {
		width: 32rpx;
		height: 32rpx;
		margin-right: 20rpx;
	}

	.menu-item.active .menu-icon {
		filter: brightness(0) invert(1);
		/* 激活时图标变白 */
	}

	.menu-text {
		font-size: 28rpx;
		color: #333;
		flex: 1;
	}

	/* 主内容区 */
	.admin-main {
		flex: 1;
		padding: 30rpx;
		overflow-y: auto;
	}

	/* 仪表盘统计卡片 */
	.stats-cards {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 30rpx;
		margin-bottom: 40rpx;
	}

	.stat-card {
		background: #fff;
		border-radius: 16rpx;
		padding: 30rpx;
		display: flex;
		align-items: center;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
	}

	.stat-icon {
		width: 80rpx;
		height: 80rpx;
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 24rpx;
	}

	.stat-content {
		flex: 1;
	}

	.stat-number {
		display: block;
		font-size: 36rpx;
		font-weight: 600;
		color: #333;
		margin-bottom: 8rpx;
	}

	.stat-label {
		font-size: 24rpx;
		color: #666;
	}

	/* 最近申请区域 */
	.recent-applications {
		background: #fff;
		border-radius: 16rpx;
		padding: 30rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30rpx;
	}

	.section-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #333;
	}

	.application-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 0;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.application-item:last-child {
		border-bottom: none;
	}

	.app-info {
		flex: 1;
	}

	.shop-name {
		display: block;
		font-size: 28rpx;
		font-weight: 500;
		color: #333;
		margin-bottom: 8rpx;
	}

	.contact-phone,
	.apply-time {
		display: block;
		font-size: 24rpx;
		color: #666;
		margin-bottom: 4rpx;
	}

	/* 申请管理页面 */
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30rpx;
	}

	.page-title {
		font-size: 36rpx;
		font-weight: 600;
		color: #333;
	}

	.filter-bar {
		display: flex;
		align-items: center;
		gap: 20rpx;
	}

	.search-input {
		width: 400rpx;
	}

	/* 表格样式（申请管理） */
	.applications-table {
		background: #fff;
		border-radius: 16rpx;
		overflow: hidden;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
	}

	.table-header {
		display: grid;
		grid-template-columns: 2fr 1.5fr 1.5fr 1fr 1fr;
		padding: 24rpx 30rpx;
		background: #f5f7fa;
		font-weight: 600;
		color: #333;
		font-size: 26rpx;
	}

	.table-body {
		min-height: 200rpx;
	}

	.table-row {
		display: grid;
		grid-template-columns: 2fr 1.5fr 1.5fr 1fr 1fr;
		padding: 24rpx 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
		align-items: center;
	}

	.table-row:last-child {
		border-bottom: none;
	}

	.col-shop,
	.col-phone,
	.col-time,
	.col-status,
	.col-actions {
		font-size: 26rpx;
		text-align: center;
		color: #333;
	}

	.col-actions {
		width: 200rpx;
		display: flex;
		gap: 16rpx;
	}

	.empty-state {
		padding: 60rpx 30rpx;
		text-align: center;
	}

	/* 分页 */
	.pagination {
		margin-top: 40rpx;
		display: flex;
		justify-content: center;
	}

	/* 设置页面 */
	.settings-content {
		background: #fff;
		border-radius: 16rpx;
		overflow: hidden;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
	}

	/* 弹窗通用基础样式 */
	.banner-popup,
	.coupon-popup,
	.review-popup,
	.custom-preview {
		background: #fff;
		overflow: hidden;
		box-shadow: 0 20rpx 40rpx rgba(0, 0, 0, 0.15);
	}

	.popup-header {
		padding: 30rpx 30rpx 20rpx;
		border-bottom: 1rpx solid #f0f0f0;
		text-align: center;
		position: relative;
	}

	.popup-title {
		font-size: 34rpx;
		font-weight: 600;
		color: #1a1a1a;
		letter-spacing: 1px;
	}

	/* 审核弹窗专属主题 */
	.review-popup .popup-header {
		border-radius: 0;
		background: #a20903;
		border-bottom: none;
	}

	.review-popup .popup-header .popup-title {
		color: #fff;
	}

	.review-popup .popup-content {
		background: #f9fafc;
		padding: 30rpx;
	}

	.review-popup .application-detail {
		background: #fff;
		border-radius: 24rpx;
		padding: 24rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);
		margin-bottom: 30rpx;
	}

	.review-popup .image-display-section {
		background: #fff;
		border-radius: 24rpx;
		padding: 24rpx;
	}

	.review-popup .image-section-title {
		font-size: 28rpx;
		font-weight: 600;
		color: #5d7291;
		border-left: 6rpx solid #5d7291;
		padding-left: 20rpx;
	}

	.review-popup .action-buttons {
		gap: 24rpx;
	}

	.review-popup .action-btn {
		border-radius: 20rpx;
		transition: all 0.2s;
	}

	.review-popup .action-btn:active {
		transform: scale(0.98);
	}

	.review-popup .action-btn.active {
		border-width: 2rpx;
	}

	.review-popup .popup-footer {
		display: flex;
		gap: 20rpx;
		padding: 20rpx 30rpx 30rpx;

		button,
		.u-button {
			flex: 1;
			height: 80rpx;
			border-radius: 60rpx;
			border: none;
			font-size: 28rpx;
			font-weight: 500;
		}

		/* 移除 u-button 的伪元素边框 */
		.u-button::after {
			border: none;
		}

		.cancel-btn {
			background: #f5f5f5;
			color: #666;
			border: none !important;
		}
	}

	.review-popup .popup-footer button {
		height: 80rpx;
		border-radius: 60rpx;
	}

	/* Banner / 优惠券弹窗（通用表单弹窗） */
	.banner-popup .popup-header,
	.coupon-popup .popup-header {
		background: #fff;
		border-bottom: 2rpx solid #f0f0f0;
	}

	.banner-popup .popup-content,
	.coupon-popup .popup-content {
		padding: 40rpx 30rpx;
		max-height: 70vh;
		overflow-y: auto;
	}

	.banner-popup .form-item,
	.coupon-popup .form-item {
		margin-bottom: 36rpx;
	}

	.banner-popup .form-item .label,
	.coupon-popup .form-item .label {
		font-size: 28rpx;
		font-weight: 500;
		color: #333;
		margin-bottom: 16rpx;
		display: block;
	}

	.banner-popup .upload-area,
	.coupon-popup .upload-area {
		position: relative;
		display: inline-block;
	}

	.banner-popup .upload-area .preview-image {
		width: 340rpx;
		height: 200rpx;
		object-fit: cover;
		border-radius: 16rpx;
		background: #f5f5f5;
	}

	.banner-popup .upload-area .upload-btn {
		width: 200rpx;
		height: 200rpx;
		background: #fafafa;
		border-radius: 16rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border: 1rpx dashed #ccc;
		transition: all 0.2s;
	}

	.banner-popup .upload-area .upload-btn:active {
		background: #f0f0f0;
	}

	.banner-popup .upload-area .delete-img-btn,
	.coupon-popup .upload-area .delete-img-btn {
		position: absolute;
		top: -10rpx;
		right: -10rpx;
		background: #fff;
		border-radius: 50%;
		padding: 8rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
		z-index: 2;
	}

	.banner-popup .input,
	.banner-popup .picker,
	.coupon-popup .input,
	.coupon-popup .picker {
		background: #f5f7fa;
		border-radius: 16rpx;
		padding: 24rpx;
		font-size: 28rpx;
		width: 100%;
		border: none;
	}

	.banner-popup .u-switch,
	.coupon-popup .u-switch {
		transform: scale(0.9);
	}

	.banner-popup .popup-footer,
	.coupon-popup .popup-footer {
		display: flex;
		gap: 20rpx;
		padding: 20rpx 30rpx 30rpx;
		border-top: 1rpx solid #f0f0f0;
	}

	.banner-popup .popup-footer button,
	.coupon-popup .popup-footer button {
		flex: 1;
		height: 80rpx;
		font-size: 30rpx;
		font-weight: 500;
	}

	/* 优惠券弹窗表单项微调 */
	.coupon-popup .form-item .picker {
		background: #f5f7fa;
		display: flex;
		align-items: center;
		justify-content: space-between;
		color: #333;
	}

	/* 审核动作区域样式（审核弹窗内） */
	.action-title {
		display: block;
		font-size: 28rpx;
		font-weight: 600;
		color: #333;
		margin-bottom: 24rpx;
	}

	.action-buttons {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
		margin-bottom: 30rpx;
	}

	.action-btn {
		display: flex;
		align-items: center;
		padding: 24rpx;
		border: 2rpx solid #e4e7ed;
		border-radius: 12rpx;
		background: #fafafa;
		transition: all 0.3s ease;
		cursor: pointer;
		position: relative;
	}

	.action-btn:hover {
		background: #f0f9ff;
		border-color: #c6e2ff;
	}

	.action-btn.active {
		background: #f0f9ff;
		border-color: #409eff;
		box-shadow: 0 4rpx 12rpx rgba(64, 158, 255, 0.1);
	}

	.approve-btn.active {
		background: #f0f9f4;
		border-color: #67c23a;
		box-shadow: 0 4rpx 12rpx rgba(103, 194, 58, 0.1);
	}

	.reject-btn.active {
		background: #fef0f0;
		border-color: #f56c6c;
		box-shadow: 0 4rpx 12rpx rgba(245, 108, 108, 0.1);
	}

	.btn-icon {
		margin-right: 20rpx;
		flex-shrink: 0;
	}

	.btn-content {
		flex: 1;
	}

	.btn-title {
		display: block;
		font-size: 28rpx;
		font-weight: 600;
		color: #333;
		margin-bottom: 8rpx;
	}

	.btn-desc {
		display: block;
		font-size: 24rpx;
		color: #666;
	}

	.btn-check {
		flex-shrink: 0;
		margin-left: 16rpx;
	}

	/* 拒绝理由区域 */
	.reject-reason-section {
		background: #f8f9fa;
		border-radius: 12rpx;
		padding: 24rpx;
		border-left: 4rpx solid #f56c6c;
	}

	.reason-title {
		display: block;
		font-size: 26rpx;
		font-weight: 600;
		color: #f56c6c;
		margin-bottom: 16rpx;
	}

	.reason-input {
		margin-bottom: 12rpx;
	}

	.reason-tip {
		font-size: 22rpx;
		color: #999;
		display: block;
		text-align: center;
	}

	/* 确认按钮优化 */
	.cancel-btn {
		flex: 1;
	}

	.approve-confirm-btn {
		flex: 1;
		background: #67c23a !important;
		border-color: #67c23a !important;
	}

	.reject-confirm-btn {
		flex: 1;
		background: #f56c6c !important;
		border-color: #f56c6c !important;
	}

	/* 弹窗内容区域通用优化 */
	.popup-content {
		padding: 30rpx;
		max-height: 70vh;
		overflow-y: auto;
	}

	.application-detail {
		background: #f8f9fa;
		border-radius: 12rpx;
		padding: 24rpx;
		margin-bottom: 30rpx;
		border-left: 4rpx solid #409eff;
	}

	.detail-item {
		display: flex;
		margin-bottom: 16rpx;
		padding: 12rpx 0;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.detail-item:last-child {
		border-bottom: none;
		margin-bottom: 0;
	}

	.detail-item .label {
		font-weight: 600;
		color: #333;
		min-width: 160rpx;
		font-size: 26rpx;
	}

	.detail-item .value {
		flex: 1;
		color: #666;
		font-size: 26rpx;
		line-height: 1.4;
	}

	/* 表格样式（Banner / 优惠券列表） */
	.banners-table,
	.coupons-table {
		background: #fff;
		border-radius: 16rpx;
		overflow: auto;
	}

	.banners-table .table-header,
	.coupons-table .table-header {
		display: grid;
		grid-template-columns: 2fr 2fr 1fr 1fr 1.5fr;
		background: #f5f7fa;
		padding: 20rpx;
		font-weight: bold;
	}

	.banners-table .table-row,
	.coupons-table .table-row {
		display: grid;
		grid-template-columns: 2fr 2fr 1fr 1fr 1.5fr;
		padding: 20rpx;
		border-bottom: 1rpx solid #eee;
		align-items: center;
	}

	.banner-thumb {
		width: 120rpx;
		height: 80rpx;
		border-radius: 8rpx;
	}

	/* 表单通用样式（已在上面定义，补充删除按钮定位） */
	.delete-img-btn {
		position: absolute;
		top: -10rpx;
		right: -10rpx;
		background: #fff;
		border-radius: 50%;
		padding: 4rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
	}

	.coupon-popup .picker {
		background: #f5f7fa;
		border-radius: 16rpx;
		padding: 24rpx;
		font-size: 28rpx;
		color: #333;
		border: none;
	}

	.custom-select {
		background: #f5f7fa;
		border-radius: 16rpx;
		padding: 24rpx;
		font-size: 28rpx;
		color: #333;
		border: none;
		line-height: 1.5;
		cursor: pointer;
	}

	/* 数据分析页面样式 */
	.statistics-page {
		.section-card {
			background: #fff;
			border-radius: 16rpx;
			padding: 30rpx;
			margin-bottom: 30rpx;
			box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
		}

		.trend-table {
			.trend-row {
				display: grid;
				grid-template-columns: 2fr 1fr 1.5fr;
				padding: 16rpx 0;
				border-bottom: 1rpx solid #f0f0f0;
				font-size: 26rpx;

				&.header {
					font-weight: bold;
					color: #333;
				}
			}
		}

		.rank-list {
			.rank-item {
				display: flex;
				align-items: center;
				padding: 16rpx 0;
				border-bottom: 1rpx solid #f0f0f0;

				.rank-index {
					width: 60rpx;
					font-weight: bold;
					color: #f38b11;
				}

				.product-img {
					width: 80rpx;
					height: 80rpx;
					border-radius: 12rpx;
					margin-right: 20rpx;
				}

				.product-name {
					flex: 1;
					font-size: 28rpx;
				}

				.product-sales {
					font-size: 26rpx;
					color: #666;
				}
			}
		}

		.status-list {
			.status-item {
				display: flex;
				justify-content: space-between;
				padding: 16rpx 0;
				border-bottom: 1rpx solid #f0f0f0;
				font-size: 28rpx;
			}
		}

		.empty-tip {
			text-align: center;
			padding: 40rpx;
			color: #999;
		}
	}

	/* 表格样式（商品/钓场排行） */
	.rank-table {
		.rank-table-item {
			display: flex;
			align-items: center;
			padding: 20rpx 0;
			border-bottom: 1rpx solid #f0f0f0;

			.rank-index {
				width: 70rpx;
				font-size: 32rpx;
				font-weight: bold;
				color: #f38b11;
				text-align: center;
			}

			.rank-img {
				width: 100rpx;
				height: 100rpx;
				border-radius: 16rpx;
				margin-right: 24rpx;
				background: #f5f5f5;
			}

			.rank-info {
				flex: 1;

				.rank-name {
					font-size: 28rpx;
					font-weight: 500;
					display: block;
					margin-bottom: 8rpx;
				}

				.rank-stats {
					font-size: 26rpx;
					color: #666;
				}
			}
		}
	}
</style>