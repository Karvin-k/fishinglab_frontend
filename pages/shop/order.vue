<template>
	<view class="order-page">
		<!-- 自定义导航栏 -->
		<view class="custom-navbar">
			<view class="navbar-left" @click="handleBack">
				<u-icon name="arrow-left" size="24" color="#fff" />
			</view>
			<view class="navbar-title">确认订单</view>
			<view class="navbar-right"></view>
		</view>

		<!-- 商品列表（按店铺分组） -->
		<view class="merchant-groups">
			<view v-for="(group, merchantId) in groupedItems" :key="merchantId" class="card merchant-card">
				<view class="merchant-header">
					<text class="merchant-name">{{ merchantNameMap[merchantId] || '平台自营' }}</text>
				</view>
				<view class="product-list">
					<view v-for="(item, idx) in group" :key="idx" class="product-item">
						<image class="product-img" :src="getImageUrl(item.image)" mode="aspectFill"></image>
						<view class="product-info">
							<text class="name">{{ item.name }}</text>
							<text class="spec" v-if="item.attributes && item.attributes.length">
								规格：{{ item.attributes.join(' + ') }}
							</text>
							<view class="price-row">
								<text class="price">¥{{ item.unitPrice.toFixed(2) }}</text>
								<!-- 商品项：显示可编辑的数量选择器 -->
								<view class="quantity" v-if="item.item_type === 'product'">
									<text>数量</text>
									<u-number-box v-model="item.quantity" :min="1" :max="item.stock"
										@change="() => recalcTotal()" />
								</view>
								<!-- 服务项：显示固定数量（不可编辑） -->
								<view class="quantity" v-else>
									<text>数量：1</text>
								</view>
							</view>

							<!-- 服务预约信息（显示条件：服务项 + (不是纯服务单订单 OR 纯服务单订单但服务项数量>1)） -->
							<view
								v-if="item.item_type === 'service' && (orderType !== 'service' || orderItems.length > 1)"
								class="booking-info" :class="{ 'competition-booking': item.is_competition }">
								<!-- 普通服务：可编辑日期和场次 -->
								<view class="booking-row" v-if="!item.is_competition">
								    <text class="label">预约日期：</text>
								    <view style="flex:1; display: flex; align-items: center; justify-content: space-between;">
								        <picker mode="date" :value="item.service_date" :start="minDate" :end="maxDate"
								            @change="(e) => updateServiceDate(item, e.detail.value)">
								            <view class="booking-value">{{ item.service_date || '请选择日期' }}</view>
								        </picker>
								        <text class="date-hint">(未来10天)</text>
								    </view>
								</view>
								<!-- 普通服务：动态场次选择 -->
								<view class="booking-row"
									v-if="!item.is_competition && item.availableTimeSlots && item.availableTimeSlots.length > 0">
									<text class="label">场次：</text>
									<picker mode="selector" :range="item.availableTimeSlots" range-key="label"
										@change="(e) => updateServiceTimeSlot(item, e.detail.value)">
										<view class="booking-value">{{ item.service_time_slot || '请选择场次' }}</view>
									</picker>
								</view>
								<view class="booking-row" v-if="!item.is_competition && item.noSlotTip">
									<text class="label">场次：</text>
									<text class="booking-value no-slot">今日已无可预约场次，请选择其他日期</text>
								</view>
								<!-- 比赛服务：只读固定时间 -->
								<view class="booking-row" v-else-if="item.is_competition">
									<text class="label">比赛时间：</text>
									<text class="booking-value competition-time">{{ item.service_date }}	{{ item.service_time_slot }}</text>
								</view>
								<!-- 人数选择（通用） -->
								<view class="booking-row">
									<text class="label">人数：</text>
									<picker mode="selector" :range="peopleRange"
										@change="(e) => updateServicePeople(item, e.detail.value)">
										<view class="booking-value">{{ item.participant_count }}人</view>
									</picker>
								</view>
								<!-- 地址显示（区分比赛地址/服务地址） -->
								<view class="booking-row" v-if="item.address">
									<text class="label">{{ item.is_competition ? '比赛地址：' : '服务地址：' }}</text>
									<text class="booking-value">{{ item.address }}</text>
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- ========== 地址模块：根据订单内容分别显示 ========== -->
		<!-- 商品收货方式（如果包含商品） -->
		<view v-if="hasProduct" class="card address-card">
			<view class="section-title">收货方式（商品）</view>
			<view class="address-switch">
				<view class="switch-item" :class="{ active: addressType === 'delivery' }"
					@click="addressType = 'delivery'">📦 配送地址</view>
				<view class="switch-item" :class="{ active: addressType === 'pickup' }" @click="addressType = 'pickup'">
					📍 自提点（鱼塘）</view>
			</view>
			<!-- 配送地址表单 -->
			<view v-if="addressType === 'delivery'" class="delivery-form">
				<view class="smart-recognition">
					<textarea v-model="rawAddress" placeholder="粘贴地址信息，例如：13800138000 张三 广东省深圳市南山区..." class="raw-input"
						:auto-height="true" />
					<button class="smart-btn" @click="parseAddress">智能识别</button>
				</view>
				<u-input v-model="deliveryInfo.name" placeholder="收货人姓名" border class="form-input" />
				<u-input v-model="deliveryInfo.phone" placeholder="联系电话" type="number" border class="form-input" />
				<u-input v-model="deliveryInfo.address" placeholder="详细地址" border class="form-input" />
			</view>
			<!-- 自提点 -->
			<view v-else class="pickup-form">
				<u-cell-item :title="pondTitle" @click="pondHandler" :arrow="true"></u-cell-item>
				<u-cell-item :title="seatTitle" @click="seatHandler" :arrow="true" v-if="selectedPond"></u-cell-item>
			</view>
		</view>

		<!-- 纯服务且只有一个服务项时，显示简洁卡片（预约信息整体） -->
		<view v-if="orderType === 'service' && orderItems.length === 1" class="card service-form">
			<view class="section-title">预约信息</view>
			<!-- 比赛服务：固定时间卡片 -->
			<view v-if="isCompetition" class="competition-date-card">
				<view class="competition-date-label">比赛时间</view>
				<view class="competition-date-value">{{ formattedCompetitionTime }}</view>
			</view>
			<!-- 开钓服务：显示日期选择器 -->
			<view v-else class="selector-row">
			    <view class="label-wrapper">
			        <text class="label">预约日期</text>
			        <text class="date-hint">(未来10天)</text>
			    </view>
			    <scroll-view scroll-x class="scroll-selector" :show-scrollbar="false">
			        <view class="options-wrapper">
			            <view v-for="date in dateOptions" :key="date.value" class="option-item"
			                :class="{ active: orderItems[0].service_date === date.value }"
			                @click="setServiceDateForSingle(date.value)">
			                <text>{{ date.label }}</text>
			            </view>
			        </view>
			    </scroll-view>
			</view>
			<!-- 场次选择（仅开钓服务） -->
			<view v-if="!isCompetition" class="selector-row">
				<text class="label">场次</text>
				<scroll-view scroll-x class="scroll-selector" :show-scrollbar="false"
					v-if="availableTimeSlotsSingle.length > 0">
					<view class="options-wrapper">
						<view v-for="slot in availableTimeSlotsSingle" :key="slot.value" class="option-item"
							:class="{ active: orderItems[0].service_time_slot === slot.value }"
							@click="setServiceTimeSlotForSingle(slot.value)">
							<text>{{ slot.label }}</text>
						</view>
					</view>
				</scroll-view>
				<view v-else class="no-slot-tip">今日已无可预约场次，请选择其他日期</view>
			</view>
			<!-- 人数选择 -->
			<view class="selector-row">
				<text class="label">人数</text>
				<scroll-view scroll-x class="scroll-selector" :show-scrollbar="false">
					<view class="options-wrapper">
						<view v-for="num in peopleRange" :key="num" class="option-item"
							:class="{ active: orderItems[0].participant_count === num }"
							@click="setServicePeopleForSingle(num)">
							<text>{{ num }}人</text>
						</view>
					</view>
				</scroll-view>
			</view>
		</view>

		<!-- 订单摘要 -->
		<view class="card summary-card">
			<view class="section-title">订单摘要</view>
			<view class="summary-item">
				<text>商品总额</text>
				<text>¥{{ originalTotal.toFixed(2) }}</text>
			</view>
			<view class="summary-item" v-if="discountAmount > 0">
				<text>优惠券减免</text>
				<text>-¥{{ discountAmount.toFixed(2) }}</text>
			</view>
			<view class="summary-item">
				<text>运费</text>
				<text>¥0.00</text>
			</view>
			<view class="summary-item total">
				<text>实付金额</text>
				<text>¥{{ totalPrice.toFixed(2) }}</text>
			</view>
		</view>

		<!-- 优惠券区域 -->
		<view class="card coupon-card" @click="goToCouponSelect">
			<view class="section-title">优惠券</view>
			<view class="coupon-info-row">
				<view v-if="selectedCoupon" class="selected-coupon">
					<text>已使用优惠券：¥{{ selectedCoupon.value }} {{ selectedCoupon.condition }}</text>
				</view>
				<view v-else class="no-coupon-tip">点击选择优惠券</view>
				<u-icon name="arrow-right" size="28" color="#999"></u-icon>
			</view>
		</view>

		<!-- 支付方式 -->
		<view class="card payment-card">
			<view class="section-title">支付方式</view>
			<view class="payment-item">
				<view class="left">
					<u-icon name="rmb" size="32" color="#52c41a"></u-icon>
					<text>余额支付</text>
				</view>
				<view class="right">
					<text class="balance">余额：¥{{ userBalance }}</text>
				</view>
			</view>
		</view>

		<!-- 订单备注 -->
		<view class="card remark-card">
			<u-input v-model="remark" type="textarea" placeholder="订单备注（选填）" :auto-height="true" border />
		</view>

		<!-- 底部支付按钮 -->
		<view class="footer">
			<view class="total-price">
				<text>合计</text>
				<text class="price">¥{{ totalPrice.toFixed(2) }}</text>
			</view>
			<button class="pay-btn" @click="payNow">立即支付</button>
		</view>

		<!-- 鱼塘选择器 -->
		<u-picker mode="selector" @confirm="pondConfirm" v-model="pondStatus" :default-selector="[0]" :range="pondList"
			range-key="name" />
		<u-picker mode="selector" @confirm="seatConfirm" v-model="seatStatus" :default-selector="[0]" :range="seatList"
			range-key="name" />
	</view>
</template>

<script>
	import request from '@/common/request.js';
	
	export default {
		data() {
			return {
				isHandlingBack: false,
				orderItems: [],
				merchantNameMap: {},
				addressType: 'pickup',
				rawAddress: '',
				deliveryInfo: {
					name: '',
					phone: '',
					address: ''
				},
				pondList: [],
				selectedPond: null,
				pondTitle: '选择鱼塘',
				seatList: [],
				selectedSeat: null,
				seatTitle: '选择钓位',
				pondStatus: false,
				seatStatus: false,
				selectedCoupon: null,
				discountAmount: 0,
				userBalance: 0,
				orderCreated: false,
				currentOrderId: null,
				remark: '',
				orderType: 'product', // product / service / mixed
				// 注意：预约信息不再使用订单级变量，全部从 orderItems 中的服务项对象读取
				// 但为了支持纯服务单订单的简洁卡片，保留 dateOptions 等辅助数据
				dateOptions: [], // 日期选项 [{ label: '4月21日', value: '2026-04-21' }]
				peopleRange: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
				timeSlots: [
				    { label: '上午场 (8:30-12:00)', value: '上午场', startTime: "08:30" },
				    { label: '下午场 (13:00-17:00)', value: '下午场', startTime: "13:00" },
				    { label: '夜场 (18:00-22:00)', value: '夜场', startTime: "18:00" }
				],
				isCompetition: false, // 记录是否为比赛服务（仅用于纯服务单订单）
			}
		},
		computed: {
			// 用于独立卡片的场次可用性（基于 orderItems[0] 的 service_date 计算）
			availableTimeSlotsSingle() {
				if (!this.orderItems.length || this.orderItems[0].item_type !== 'service') return [];
				const item = this.orderItems[0];
				if (item.is_competition) return [];
				return this.getAvailableSlotsForDate(item.service_date);
			},
			// 统一格式化比赛时间
			formattedCompetitionTime() {
				if (!this.orderItems.length || this.orderItems[0].item_type !== 'service') return '';
				const item = this.orderItems[0];
				if (!item.is_competition) return '';
				const date = item.service_date || '';
				const time = item.service_time_slot || '';
				return time ? `${date} ${time}` : date;
			},
			// 日期选择器的最小/最大限制
			minDate() {
				const today = new Date();
				return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
			},
			maxDate() {
				const max = new Date();
				max.setDate(max.getDate() + 10);
				return `${max.getFullYear()}-${String(max.getMonth() + 1).padStart(2,'0')}-${String(max.getDate()).padStart(2,'0')}`;
			},
			// 以下为原有计算属性
			groupedItems() {
				const groups = {};
				this.orderItems.forEach(item => {
					const mid = item.merchant_id || 0;
					if (!groups[mid]) groups[mid] = [];
					groups[mid].push(item);
				});
				return groups;
			},
			originalTotal() {
				return this.orderItems.reduce((sum, item) => {
					let price = item.unitPrice || 0;
					let qty = item.item_type === 'service' ? (item.participant_count || 1) : (item.quantity || 1);
					return sum + price * qty;
				}, 0);
			},
			totalPrice() {
				let total = this.originalTotal - this.discountAmount;
				return total < 0 ? 0 : total;
			},
			hasProduct() {
				return this.orderItems.some(item => item.item_type === 'product');
			},
			hasService() {
				return this.orderItems.some(item => item.item_type === 'service');
			},
			// 重新声明 timeSlotLabels 用于选择器（若有使用）
			timeSlotLabels() {
				return this.timeSlots.map(slot => slot.label);
			}
		},
		watch: {
			orderItems: {
				deep: true,
				handler() {
					this.loadMerchantNames();
				}
			}
		},
		onLoad(options) {
			// 解析订单项（与之前相同，但注意保存 is_competition 等字段）
			if (options.orderItems) {
				try {
					let items = JSON.parse(decodeURIComponent(options.orderItems));
					this.orderItems = items.map(item => {
						if (item.item_type === 'product') {
							return {
								id: item.product_id,
								name: item.product_name,
								image: item.image || item.product_image,
								unitPrice: item.unit_price || item.unitPrice || 0,
								quantity: item.quantity || 1,
								stock: item.stock || 0,
								attributes: item.attributes || [],
								merchant_id: item.merchant_id,
								category: item.category || '',
								item_type: 'product'
							};
						} else {
							// 服务项
							const qty = item.participant_count || 1;
							return {
								id: item.service_id,
								name: item.name,
								image: item.image,
								unitPrice: item.unit_price || item.unitPrice || 0,
								quantity: 1,
								participant_count: qty,
								service_date: item.service_date || '',
								service_time_slot: item.service_time_slot || '',
								merchant_id: item.merchant_id,
								address: item.address || '',
								item_type: 'service',
								is_competition: item.is_competition || false,
								// 动态场次列表（懒加载）
								availableTimeSlots: null,
								noSlotTip: false
							};
						}
					});
				} catch (e) {
					console.error('解析订单数据失败', e);
				}
			} else if (options.orderItem) {
				// 单商品/单服务
				try {
					let item = JSON.parse(decodeURIComponent(options.orderItem));
					if (item.item_type === 'product') {
						this.orderItems = [{
							id: item.product_id || item.id,
							name: item.product_name || item.name,
							image: item.image || item.product_image,
							unitPrice: item.unit_price || item.unitPrice || 0,
							quantity: item.quantity || 1,
							stock: item.stock || 0,
							attributes: item.attributes || [],
							merchant_id: item.merchant_id,
							category: item.category || '',
							item_type: 'product'
						}];
					} else {
						const qty = item.participant_count || 1;
						this.orderItems = [{
							id: item.service_id,
							name: item.name,
							image: item.image,
							unitPrice: item.unit_price || item.unitPrice || 0,
							quantity: 1,
							participant_count: qty,
							service_date: item.service_date || '',
							service_time_slot: item.service_time_slot || '',
							merchant_id: item.merchant_id,
							address: item.address || '',
							item_type: 'service',
							is_competition: item.is_competition || false,
							availableTimeSlots: null,
							noSlotTip: false
						}];
					}
				} catch (e) {
					console.error('解析订单数据失败', e);
				}
			} else {
				uni.showToast({
					title: '无商品信息',
					icon: 'none'
				});
			}

			if (!this.orderItems.length) return;

			// 判断订单类型
			const hasProduct = this.orderItems.some(i => i.item_type === 'product');
			const hasService = this.orderItems.some(i => i.item_type === 'service');
			if (hasService && !hasProduct) this.orderType = 'service';
			else if (hasProduct && !hasService) this.orderType = 'product';
			else this.orderType = 'mixed';

			// 生成日期选项
			this.generateDateOptions();

			// 如果是纯服务单订单且只有一个服务项，设置比赛标志（用于卡片样式）
			if (this.orderType === 'service' && this.orderItems.length === 1) {
				this.isCompetition = this.orderItems[0].is_competition || false;
			}

			// 为每个非比赛服务项初始化可用场次
			this.orderItems.forEach(item => {
				if (item.item_type === 'service' && !item.is_competition) {
					this.refreshServiceAvailableSlots(item);
				}
			});

			this.getUserBalance();
			this.getPondList();
			uni.$on('couponSelected', this.handleCouponSelected);
		},
		onUnload() {
			uni.$off('couponSelected', this.handleCouponSelected);
		},
		onShow() {
			const pages = getCurrentPages();
			const prevPage = pages[pages.length - 2];
			if (prevPage && prevPage.$vm && prevPage.$vm.selectedCouponData !== undefined) {
				const couponData = prevPage.$vm.selectedCouponData;
				if (couponData) {
					this.selectedCoupon = couponData;
					this.discountAmount = couponData.value;
				} else {
					this.selectedCoupon = null;
					this.discountAmount = 0;
				}
				delete prevPage.$vm.selectedCouponData;
			}
		},
		methods: {
			getImageUrl(url) {
				if (!url) return '';
				if (url.startsWith('http') || url.startsWith('data:')) return url;
				return uni.$imgUrl(url);
			},
			getCurrentUserId() {
				let userInfo = this.$store.state.vuex_user_info || uni.getStorageSync('vuex_user_info');
				return userInfo?.id || null;
			},
			recalcTotal() {
				this.discountAmount = this.selectedCoupon ? this.selectedCoupon.value : 0;
			},
			// ========== 预约信息相关（服务项操作） ==========
			// 根据日期计算可用场次
			getAvailableSlotsForDate(dateStr) {
			    if (!dateStr) return [];
			    const selectedDate = new Date(dateStr);
			    const today = new Date();
			    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
			    const selectedStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
			    const isToday = selectedStart.getTime() === todayStart.getTime();
			    const now = new Date();
			    const currentMinutes = now.getHours() * 60 + now.getMinutes();
			
			    return this.timeSlots.filter(slot => {
			        if (!isToday) return true;
			        // 解析开始时间（格式 "HH:MM"）
			        const [hour, minute] = slot.startTime.split(':').map(Number);
			        const slotStartMinutes = hour * 60 + minute;
			        return currentMinutes < slotStartMinutes;
			    });
			},
			// 刷新某个服务项的可用场次列表
			refreshServiceAvailableSlots(item) {
				if (item.item_type !== 'service' || item.is_competition) return;
				const available = this.getAvailableSlotsForDate(item.service_date);
				this.$set(item, 'availableTimeSlots', available);
				// 判断是否为今天（使用字符串比较，更可靠）
				const todayStr = new Date().toISOString().slice(0, 10);
				const isToday = item.service_date === todayStr;
				this.$set(item, 'noSlotTip', available.length === 0 && isToday);
				// 如果当前已选场次不在可用列表中，清空
				if (item.service_time_slot && !available.some(slot => slot.value === item.service_time_slot)) {
					this.$set(item, 'service_time_slot', '');
				}
			},
			// 更新服务项的日期
			updateServiceDate(item, date) {
				this.$set(item, 'service_date', date);
				this.$set(item, 'service_time_slot', ''); // 清空场次
				this.refreshServiceAvailableSlots(item);
				this.recalcTotal();
			},
			// 更新服务项的场次（混合订单内嵌选择器）
			updateServiceTimeSlot(item, index) {
				if (item.availableTimeSlots && item.availableTimeSlots.length > index) {
					this.$set(item, 'service_time_slot', item.availableTimeSlots[index].value);
					this.recalcTotal();
				}
			},
			// 更新服务项的人数
			updateServicePeople(item, index) {
				this.$set(item, 'participant_count', this.peopleRange[index]);
				this.recalcTotal();
			},
			// 纯服务单订单卡片专用：设置日期
			setServiceDateForSingle(dateValue) {
				if (this.orderItems[0] && this.orderItems[0].item_type === 'service') {
					this.updateServiceDate(this.orderItems[0], dateValue);
				}
			},
			// 纯服务单订单卡片专用：设置场次
			setServiceTimeSlotForSingle(slotValue) {
				if (this.orderItems[0] && this.orderItems[0].item_type === 'service') {
					this.$set(this.orderItems[0], 'service_time_slot', slotValue);
					this.recalcTotal();
				}
			},
			// 纯服务单订单卡片专用：设置人数
			setServicePeopleForSingle(num) {
				if (this.orderItems[0] && this.orderItems[0].item_type === 'service') {
					this.$set(this.orderItems[0], 'participant_count', num);
					this.recalcTotal();
				}
			},
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
			},
			onPeopleChange(e) {
				this.participantCount = parseInt(this.peopleRange[e.detail.value]);
			},
			validateAddress() {
				// 判断订单中是否包含商品
				const hasProduct = this.orderItems.some(item => item.item_type === 'product');
				// 如果包含商品，则需要校验收货方式
				if (hasProduct) {
					if (this.addressType === 'delivery') {
						if (!this.deliveryInfo.name || !this.deliveryInfo.phone || !this.deliveryInfo.address) {
							uni.showToast({
								title: '请完整填写收货地址',
								icon: 'none'
							});
							return false;
						}
						if (!/^1[3-9]\d{9}$/.test(this.deliveryInfo.phone)) {
							uni.showToast({
								title: '手机号格式不正确',
								icon: 'none'
							});
							return false;
						}
					} else {
						if (!this.selectedPond || !this.selectedSeat) {
							uni.showToast({
								title: '请选择自提点（鱼塘和钓位）',
								icon: 'none'
							});
							return false;
						}
					}
				}
				// 对每个非比赛服务项检查场次是否已选
				const serviceItems = this.orderItems.filter(item => item.item_type === 'service' && !item.is_competition);
				for (let item of serviceItems) {
				    if (!item.service_time_slot) {
				        uni.showToast({
				            title: `请为“${item.name}”选择场次`,
				            icon: 'none'
				        });
				        return false;
				    }
				}
				return true;
			},
			async loadMerchantNames() {
				const merchantIds = [...new Set(this.orderItems.map(item => item.merchant_id).filter(id => id && !this
					.merchantNameMap[id]))];
				for (const mid of merchantIds) {
					try {
						const res = await uni.request({
							url: `${uni.$baseUrl}/api/shop/info?merchantId=${mid}`,
							method: 'GET'
						});
						if (res[1].data.code === 0) this.$set(this.merchantNameMap, mid, res[1].data.data.shopName);
					} catch (e) {
						console.error('获取商家名称失败', e);
					}
				}
			},
			buildOrderData() {
				const items = this.orderItems.map(item => {
					if (item.item_type === 'product') {
						return {
							item_type: 'product',
							product_id: item.id,
							product_name: item.name,
							product_image: item.image,
							product_attributes: item.attributes || [],
							quantity: item.quantity,
							unit_price: item.unitPrice,
							total_price: item.unitPrice * item.quantity
						};
					} else {
						// 服务项：直接使用自身属性，不再依赖订单级变量
						return {
							item_type: 'service',
							service_id: item.id,
							unit_price: item.unitPrice,
							quantity: 1,
							participant_count: item.participant_count || 1,
							service_date: item.service_date || '',
							service_time_slot: item.service_time_slot || ''
						};
					}
				});
				const hasProduct = this.orderItems.some(i => i.item_type === 'product');
				const shouldUsePickup = hasProduct && this.addressType === 'pickup';
				const serviceAddress = this.orderItems.find(i => i.item_type === 'service')?.address || '';

				return {
					// user_id: userId,
					items: items,
					item_type: this.orderType === 'service' ? 'service' : 'product',
					service_date: null, // 不再使用订单级
					service_time_slot: null,
					participant_count: null,
					address_type: this.orderType === 'service' ? 'delivery' : this.addressType,
					delivery_info: this.orderType === 'service' ? {
						address: serviceAddress
					} : (this.addressType === 'delivery' ? this.deliveryInfo : null),
					pond_id: shouldUsePickup ? this.selectedPond?.id : null,
					seat_id: shouldUsePickup ? (this.selectedSeat?.seat_id || this.selectedSeat?.id) : null,
					user_coupon_id: this.selectedCoupon?.id,
					remark: this.remark
				};
			},
			// 再次购买（区分商品和服务）
			async rebuyOrder(order) {
				if (!order.items || order.items.length === 0) {
					uni.showToast({
						title: '无商品/服务可购买',
						icon: 'none'
					});
					return;
				}
				const firstItem = order.items[0];
				if (order.item_type === 'service') {
					uni.navigateTo({
						url: `/pages/shop/pond-detail?id=${firstItem.service_id}`
					});
				} else {
					uni.navigateTo({
						url: `/pages/shop/detail?id=${firstItem.product_id}`
					});
				}
			},
			// 返回处理（物理返回键和自定义按钮）
			onBackPress() {
				this.handleBack();
				return true;
			},
			handleBack() {
				if (this.isHandlingBack) return;
				this.isHandlingBack = true;
				if (this.orderCreated) {
					uni.switchTab({
						url: '/pages/shop/shop'
					});
					this.isHandlingBack = false;
					return;
				}
				uni.showModal({
					title: '提示',
					content: '是否保存当前订单？',
					confirmText: '保存',
					cancelText: '不保存',
					success: (res) => {
						this.isHandlingBack = false;
						if (res.confirm) {
							this.createOrderOnly();
						} else {
							uni.switchTab({
								url: '/pages/shop/shop'
							});
						}
					},
					fail: () => {
						this.isHandlingBack = false;
					}
				});
			},
			// 只创建订单，不支付
			async createOrderOnly() {
				// 地址校验
				if (!this.validateAddress()) {
					return; // 校验不通过，不保存订单
				}
				const orderData = this.buildOrderData();
				uni.showLoading({
					title: '保存订单中...'
				});
				try {
					const res = await request({
					    url: '/api/orders',
					    method: 'POST',
					    data: orderData
					});
					if (res.data.code === 0) {
						this.orderCreated = true;
						this.currentOrderId = res.data.data.order_id;
						uni.hideLoading();
						uni.showToast({
							title: '订单已保存',
							icon: 'success',
							duration: 1500
						});
						// 延时 1.5 秒后跳转到 shop 页面
						setTimeout(() => {
							uni.switchTab({
								url: '/pages/shop/shop'
							});
						}, 1500);
					} else {
						uni.hideLoading();
						uni.showToast({
							title: res.data.message || '保存失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('创建订单失败', error);
					uni.hideLoading();
					uni.showToast({
						title: '创建订单失败',
						icon: 'none'
					});
				}
			},
			// 粘贴地址 智能识别地址（兼容中英文姓名、任意顺序、中文+字母姓名、地址在前）
			parseAddress() {
				let text = this.rawAddress.trim();
				if (!text) {
					uni.showToast({
						title: '请输入地址信息',
						icon: 'none'
					});
					return;
				}

				// 1. 全局预处理：全角转半角、清理乱码、统一空格
				text = text
					.replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
					.replace(/[，。、；：？！‘’“”（）【】《》…—]/g, ' ')
					.replace(/\s+/g, ' ')
					.trim();

				// 2. 精准提取11位手机号（唯一固定特征，绝对不跑偏）
				const phoneReg = /1[3-9]\d{9}/g;
				const phoneMatch = text.match(phoneReg);
				const phone = phoneMatch ? phoneMatch[0] : '';
				// 移除手机号，剩余纯文本（地址+姓名）
				let noPhoneText = phone ? text.replace(phoneReg, '').trim() : text;
				if (!noPhoneText) {
					uni.showToast({
						title: '未识别到姓名和地址',
						icon: 'none'
					});
					return;
				}

				// 规则：1-10字符短文本 + 包含中文/英文 + 允许中间1个空格（杜绝长地址匹配）
				const nameReg = /^([\u4e00-\u9fa5a-zA-Z]{1,5}\s?[\u4e00-\u9fa5a-zA-Z]{1,4})$/;
				let name = '';
				let address = '';

				// 3. 智能拆分：姓名一定是短文本，地址一定是长文本（绝对不混淆）
				const parts = noPhoneText.split(' ').filter(Boolean); // 按空格拆分所有片段
				for (let i = 0; i < parts.length; i++) {
					// 遍历找【短姓名】，剩下所有片段拼接为【长地址】
					const part = parts[i].trim();
					if (nameReg.test(part) && !name) {
						name = part; // 命中短姓名
					} else {
						address += part + ' '; // 剩余全是地址
					}
				}

				// 4. 最终清理
				address = address.replace(/\s+/g, ' ').trim();

				// 5. 赋值到表单
				this.deliveryInfo = {
					phone: phone || this.deliveryInfo.phone,
					name: name || this.deliveryInfo.name,
					address: address || this.deliveryInfo.address
				};

				// 6. 友好提示
				if (phone && name && address) {
					uni.showToast({
						title: '识别成功',
						icon: 'success'
					});
				} else {
					const miss = [];
					if (!phone) miss.push('手机号');
					if (!name) miss.push('姓名');
					if (!address) miss.push('地址');
					uni.showToast({
						title: `请补充：${miss.join('、')}`,
						icon: 'none',
						duration: 2500
					});
				}
			},

			// 处理事件监听
			handleCouponSelected(coupon) {
				console.log('收到优惠券事件:', coupon);
				if (coupon) {
					this.selectedCoupon = coupon;
					this.discountAmount = coupon.value;
					this.total_price = this.originalTotal - this.discountAmount;
					if (this.total_price < 0) this.total_price = 0;
				} else {
					this.selectedCoupon = null;
					this.discountAmount = 0;
					this.total_price = this.originalTotal;
				}
			},
			async getUserBalance() {
				const userInfo = this.$store.state.vuex_user_info;
				if (userInfo) this.userBalance = userInfo.balance || 0;
			},
			async refreshUserBalance() {
			    try {
			        const res = await request({
			            url: '/api/user/info',
			            method: 'GET'
			        });
			        if (res.data.code === 0) {
			            const newInfo = res.data.data;
			            this.$store.commit('setUserInfo', newInfo);
			            uni.setStorageSync('vuex_user_info', newInfo);
			            this.userBalance = newInfo.balance || 0;
			        }
			    } catch (error) {
			        console.error('刷新用户余额失败', error);
			    }
			},
			valChange(e) {
				this.goods_number = e.value;
				this.originalTotal = this.unit_price * this.goods_number;
				// 如果已选优惠券，重新计算总价
				if (this.selectedCoupon) {
					this.total_price = this.originalTotal - this.selectedCoupon.value;
					if (this.total_price < 0) this.total_price = 0;
				} else {
					this.total_price = this.originalTotal;
				}
			},
			async getPondList() {
				try {
					const res = await this.$u.api.getPondList();
					if (res.code === 0) this.pondList = res.data;
				} catch (error) {
					console.error('获取鱼塘列表失败', error);
				}
			},
			pondHandler() {
				if (this.pondList.length === 0) {
					uni.showToast({
						title: '暂无鱼塘',
						icon: 'none'
					});
					return;
				}
				this.pondStatus = true;
			},
			async pondConfirm([index]) {
				this.selectedPond = this.pondList[index];
				this.pondTitle = this.selectedPond.name;
				this.selectedSeat = null;
				this.seatTitle = '选择钓位';
				try {
					const res = await this.$u.api.getSeatByPondId({
						id: this.selectedPond.id
					});
					if (res.code === 0) this.seatList = res.data.seats;
				} catch (error) {
					console.error('获取钓位失败', error);
				}
			},
			seatHandler() {
				if (!this.selectedPond) {
					uni.showToast({
						title: '请先选择鱼塘',
						icon: 'none'
					});
					return;
				}
				if (this.seatList.length === 0) {
					uni.showToast({
						title: '该鱼塘暂无钓位',
						icon: 'none'
					});
					return;
				}
				this.seatStatus = true;
			},
			seatConfirm([index]) {
				this.selectedSeat = this.seatList[index];
				const seatName = this.selectedSeat.name;
				this.seatTitle = `${seatName}钓位`;
			},
			goToCouponSelect() {
				// 传递总金额和商品类别（多商品时传空字符串，只支持全品类优惠券）
				const category = this.orderItems.length === 1 ? (this.orderItems[0].category || '') : '';
				uni.navigateTo({
					url: `/pages/shop/couponSelect?totalAmount=${this.originalTotal}&category=${category}&selectedId=${this.selectedCoupon?.id || ''}`
				});
			},
			async payNow() {
				// 1. 地址校验（复用 validateAddress 方法）
				if (!this.validateAddress()) {
					return; // 校验不通过，不继续支付
				}

				// 2. 余额校验
				if (this.userBalance < this.totalPrice) {
					uni.showModal({
						title: '余额不足',
						content: '您的余额不足，是否前往充值？',
						confirmText: '去充值',
						success: (res) => {
							if (res.confirm) uni.navigateTo({
								url: '/pages/mine/balance'
							});
						}
					});
					return;
				}

				const userId = this.getCurrentUserId();
				if (!userId) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					return;
				}

				// 3. 创建订单（如果尚未创建）
				if (!this.orderCreated) {
					const orderData = this.buildOrderData();
					uni.showLoading({
						title: '提交订单中...'
					});
					try {
						const res = await request({
						    url: '/api/orders',
						    method: 'POST',
						    data: orderData
						});
						if (res.data.code === 0) {
							this.orderCreated = true;
							this.currentOrderId = res.data.data.order_id;
						} else {
							uni.showToast({
								title: res.data.message || '创建订单失败',
								icon: 'none'
							});
							return;
						}
					} catch (error) {
						console.error('创建订单失败', error);
						uni.showToast({
							title: '创建订单失败',
							icon: 'none'
						});
						return;
					} finally {
						uni.hideLoading();
					}
				}

				// 4. 支付
				uni.showLoading({
					title: '支付中...'
				});
				try {
					const res = await request({
					    url: `/api/orders/${this.currentOrderId}/pay`,
					    method: 'POST',
					    data: {}
					});
					
					if (res.data.code === 0) {
						uni.showToast({
							title: '支付成功',
							icon: 'success',
							duration: 1500
						});
						await this.refreshUserBalance();
						setTimeout(() => {
							uni.switchTab({
								url: '/pages/shop/shop'
							});
						}, 1500);
					} else {
						uni.showToast({
							title: res.data.message || '支付失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('支付失败', error);
					uni.showToast({
						title: '支付失败，请稍后重试',
						icon: 'none'
					});
				} finally {
					uni.hideLoading();
				}
			},
			// 预约日期选择
			onDateChange(e) {
				this.serviceDate = e.detail.value;
			},
			// 场次选择
			onTimeSlotChange(e) {
				this.serviceTimeSlot = this.timeSlotOptions[e.detail.value];
			}
		}
	}
</script>

<style lang="scss" scoped>
	.order-page {
		background-color: #f8f8f8;
		min-height: 100vh;
		padding-top: 88rpx;
		padding-bottom: 120rpx;
	}

	.custom-navbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 999;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 30rpx;
		height: 88rpx;
		background-color: #5d7291;
		color: #fff;

		.navbar-left,
		.navbar-right {
			width: 60rpx;
		}

		.navbar-title {
			font-size: 34rpx;
			font-weight: bold;
		}
	}

	.service-address {
		font-size: 24rpx;
		color: #666;
		margin-top: 12rpx;
		display: block;
	}

	.fixed-address {
		background: #f9f9f9;
		border-radius: 12rpx;
		padding: 20rpx;
		font-size: 28rpx;
		color: #333;
	}

	.card {
		background: #fff;
		margin: 20rpx;
		border-radius: 24rpx;
		padding: 30rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
	}

	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		margin-bottom: 24rpx;
		padding-left: 16rpx;
		border-left: 6rpx solid #5d7291;
	}

	/* 商家分组卡片 */
	.merchant-card {
		padding: 0;
		overflow: hidden;

		.merchant-header {
			padding: 24rpx 30rpx;
			background-color: #fafafa;
			border-bottom: 1rpx solid #eee;

			.merchant-name {
				font-size: 32rpx;
				font-weight: bold;
				color: #1a1a1a;
			}
		}

		.product-list {
			padding: 0 30rpx;

			.product-item {
				display: flex;
				padding: 30rpx 0;
				border-bottom: 1rpx solid #f0f0f0;

				&:last-child {
					border-bottom: none;
				}

				.product-img {
					width: 160rpx;
					height: 160rpx;
					border-radius: 16rpx;
					margin-right: 24rpx;
				}

				.product-info {
					flex: 1;

					.name {
						font-size: 30rpx;
						font-weight: 500;
						display: block;
						margin-bottom: 8rpx;
					}

					.spec {
						font-size: 24rpx;
						color: #999;
						margin-bottom: 12rpx;
						display: block;
					}

					.price-row {
						display: flex;
						justify-content: space-between;
						align-items: center;

						.price {
							color: #f38b11;
							font-size: 32rpx;
							font-weight: bold;
						}

						.quantity {
							display: flex;
							align-items: center;
							gap: 16rpx;
							font-size: 28rpx;
							color: #666;

							// 服务项文本样式
							text {
								font-weight: normal;
							}
						}
					}
				}
			}
		}
	}

	/* 地址切换、摘要、优惠券等 */
	.address-switch {
		display: flex;
		gap: 20rpx;
		margin-bottom: 20rpx;

		.switch-item {
			flex: 1;
			text-align: center;
			padding: 20rpx 0;
			background-color: #f5f5f5;
			border-radius: 60rpx;
			font-size: 28rpx;
			color: #666;
			transition: all 0.2s;

			&.active {
				background-color: #5d7291;
				color: #fff;
				font-weight: bold;
			}
		}
	}

	.delivery-form,
	.pickup-form {
		margin-top: 20rpx;
	}

	.form-input {
		margin-bottom: 20rpx;
	}

	.summary-card .summary-item {
		display: flex;
		justify-content: space-between;
		font-size: 28rpx;
		color: #666;
		margin-bottom: 16rpx;

		&.total {
			margin-top: 16rpx;
			padding-top: 16rpx;
			border-top: 1rpx solid #eee;
			font-weight: bold;
			font-size: 32rpx;
			color: #333;

			text:last-child {
				color: #f38b11;
			}
		}
	}

	.coupon-card .coupon-info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;

		.selected-coupon {
			font-size: 28rpx;
			color: #5d7291;
		}

		.no-coupon-tip {
			font-size: 28rpx;
			color: #999;
		}
	}

	.payment-card .payment-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16rpx 0;

		.left {
			display: flex;
			align-items: center;
			gap: 16rpx;
			font-size: 30rpx;
		}

		.right .balance {
			font-size: 28rpx;
			color: #52c41a;
		}
	}

	.remark-card {
		padding: 20rpx;
	}

	/* 预约信息表单样式 */
	.service-form {
		.selector-row {
			margin-bottom: 40rpx;

			.label {
				font-size: 30rpx;
				font-weight: 500;
				color: #1a1a1a;
				margin-bottom: 20rpx;
				display: block;
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
	}

	.no-slot-tip {
		background: #fef0e6;
		color: #f38b11;
		border-radius: 16rpx;
		padding: 20rpx;
		font-size: 26rpx;
		text-align: center;
	}

	.footer {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: #fff;
		padding: 20rpx 30rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);

		.total-price {
			font-size: 28rpx;
			color: #666;

			.price {
				font-size: 40rpx;
				font-weight: bold;
				color: #f38b11;
				margin-left: 16rpx;
			}
		}

		.pay-btn {
			background: #f38b11;
			color: #fff;
			border-radius: 60rpx;
			height: 80rpx;
			line-height: 80rpx;
			padding: 0 40rpx;
			margin-right: 20rpx;
			font-size: 32rpx;
			font-weight: bold;
			border: none;
		}
	}

	.smart-recognition {
		margin-bottom: 20rpx;

		.raw-input {
			width: 100%;
			background: #f9f9f9;
			border-radius: 16rpx;
			padding: 20rpx;
			font-size: 28rpx;
			min-height: 120rpx;
			margin-bottom: 20rpx;
			box-sizing: border-box;
		}

		.smart-btn {
			background: #5d7291;
			color: #fff;
			border-radius: 60rpx;
			height: 70rpx;
			line-height: 70rpx;
			font-size: 28rpx;
			margin-bottom: 20rpx;
			width: 100%;
		}
	}

	.people-selector {
		background: #f5f7fa;
		border-radius: 60rpx;
		padding: 8rpx 24rpx;
		font-size: 26rpx;
		color: #333;
		text-align: center;
		min-width: 100rpx;
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

	.booking-info {
		margin-top: 20rpx;
		padding: 20rpx;
		background-color: #f9f9f9;
		border-radius: 16rpx;

		.booking-row {
			display: flex;
			align-items: center;
			margin-bottom: 16rpx;

			&:last-child {
				margin-bottom: 0;
			}

			.label {
				width: 140rpx;
				font-size: 28rpx;
				color: #666;
			}

			.booking-value {
				flex: 1;
				font-size: 28rpx;
				color: #333;
				padding: 8rpx 0;
				border-bottom: 1rpx dashed #ddd;
			}

			.competition-time {
				color: #f38b11;
				font-weight: bold;
			}
		}

		&.competition-booking {
			background-color: #fff6e8;
			border-left: 6rpx solid #f38b11;
		}
	}

	.booking-value.no-slot {
		color: #f38b11;
		background: #fef0e6;
		padding: 8rpx 16rpx;
		border-radius: 8rpx;
		display: inline-block;
	}
	
	.date-hint {
	    font-size: 24rpx;
	    color: #999;
	    margin-left: 16rpx;
	}
	
	.label-wrapper {
	    display: flex;
	    align-items: baseline;
	    margin-bottom: 20rpx;
	    .label {
	        font-size: 30rpx;
	        font-weight: 500;
	        color: #1a1a1a;
	        margin-right: 12rpx;
	    }
	    .date-hint {
	        font-size: 24rpx;
	        color: #999;
	    }
	}
</style>