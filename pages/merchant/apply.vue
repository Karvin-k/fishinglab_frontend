<template>
	<view class="merchant-apply-container">
		<!-- 顶部导航 -->
		<u-navbar title="商家入驻" :border="true"></u-navbar>

		<scroll-view class="scroll-content" scroll-y>
			<!-- 申请说明 -->
			<view class="apply-notice">
				<u-icon name="info-circle" size="32" color="#5d7291"></u-icon>
				<text class="notice-text">请填写真实信息，我们将在1-3个工作日内完成审核</text>
			</view>

			<!-- 申请表单 -->
			<view class="apply-form">
				<u-form :model="formData" :rules="rules" ref="applyForm" label-width="150">
					<!-- 店铺基本信息 -->
					<view class="form-section">
						<view class="section-title">店铺基本信息</view>

						<u-form-item label="店铺名称" prop="shopName" border-bottom>
							<u-input v-model="formData.shopName" placeholder="请输入店铺名称" :border="false" />
						</u-form-item>

						<u-form-item label="联系电话" prop="contactPhone" border-bottom>
							<u-input v-model="formData.contactPhone" placeholder="请输入联系电话" :border="false"
								type="number" />
						</u-form-item>

						<u-form-item label="店铺地址" prop="shopAddress" border-bottom>
							<u-input v-model="formData.shopAddress" placeholder="请输入详细地址" :border="false" />
						</u-form-item>

						<u-form-item label="经营范围" prop="businessScope" border-bottom>
							<u-input v-model="formData.businessScope" placeholder="如：渔具销售、钓场服务等" :border="false" />
						</u-form-item>
					</view>

					<!-- 证件信息 -->
					<view class="form-section">
						<view class="section-title">证件信息</view>

						<!-- 营业执照 -->
						<view class="upload-item">
							<view class="upload-label">营业执照</view>
							<view class="upload-desc">请上传清晰的营业执照照片</view>
							<view class="upload-buttons">
								<u-button type="primary" size="mini" @click="chooseLicenseImage"
									:loading="uploadingLicense">
									{{ uploadingLicense ? '上传中...' : '选择营业执照' }}
								</u-button>
								<u-button type="error" size="mini" @click="removeLicenseImage"
									v-if="licenseImage">删除</u-button>
							</view>
							<view v-if="licenseImage" class="image-preview">
								<image :src="licenseImage" mode="aspectFit" class="preview-image"
									@error="onImageError('licenseImage')"></image>
							</view>
							<view class="upload-status" v-if="!licenseImage">
								<u-icon name="close-circle" color="#fa3534" size="28"></u-icon>
								<text class="status-text">未上传</text>
							</view>
							<view class="upload-status" v-else>
								<u-icon name="checkmark-circle" color="#19be6b" size="28"></u-icon>
								<text class="status-text">已上传</text>
							</view>
						</view>

						<!-- 身份证正面 -->
						<view class="upload-item">
							<view class="upload-label">身份证正面</view>
							<view class="upload-desc">请上传身份证人像面</view>
							<view class="upload-buttons">
								<u-button type="primary" size="mini" @click="chooseIdCardFrontImage"
									:loading="uploadingIdCardFront">
									{{ uploadingIdCardFront ? '上传中...' : '选择身份证正面' }}
								</u-button>
								<u-button type="error" size="mini" @click="removeIdCardFrontImage"
									v-if="idCardFront">删除</u-button>
							</view>
							<view v-if="idCardFront" class="image-preview">
								<image :src="idCardFront" mode="aspectFit" class="preview-image"
									@error="onImageError('idCardFront')"></image>
							</view>
							<view class="upload-status" v-if="!idCardFront">
								<u-icon name="close-circle" color="#fa3534" size="28"></u-icon>
								<text class="status-text">未上传</text>
							</view>
							<view class="upload-status" v-else>
								<u-icon name="checkmark-circle" color="#19be6b" size="28"></u-icon>
								<text class="status-text">已上传</text>
							</view>
						</view>

						<!-- 身份证反面 -->
						<view class="upload-item">
							<view class="upload-label">身份证反面</view>
							<view class="upload-desc">请上传身份证国徽面</view>
							<view class="upload-buttons">
								<u-button type="primary" size="mini" @click="chooseIdCardBackImage"
									:loading="uploadingIdCardBack">
									{{ uploadingIdCardBack ? '上传中...' : '选择身份证反面' }}
								</u-button>
								<u-button type="error" size="mini" @click="removeIdCardBackImage"
									v-if="idCardBack">删除</u-button>
							</view>
							<view v-if="idCardBack" class="image-preview">
								<image :src="idCardBack" mode="aspectFit" class="preview-image"
									@error="onImageError('idCardBack')"></image>
							</view>
							<view class="upload-status" v-if="!idCardBack">
								<u-icon name="close-circle" color="#fa3534" size="28"></u-icon>
								<text class="status-text">未上传</text>
							</view>
							<view class="upload-status" v-else>
								<u-icon name="checkmark-circle" color="#19be6b" size="28"></u-icon>
								<text class="status-text">已上传</text>
							</view>
						</view>
					</view>

					<!-- 补充说明 -->
					<view class="form-section">
						<view class="section-title">补充说明</view>
						<u-form-item prop="description" border-bottom>
							<u-input v-model="formData.description" placeholder="可在此补充说明店铺特色、经营理念等信息（选填）"
								:border="false" type="textarea" height="120" :autoHeight="true" />
						</u-form-item>
					</view>
				</u-form>

				<!-- 协议同意 -->
				<view class="agreement">
					<u-checkbox v-model="agreementChecked" shape="circle">
						我已阅读并同意
					</u-checkbox>
					<text class="agreement-link" @click="showAgreement = true">《商家入驻协议》</text>
				</view>

				<!-- 提交按钮 -->
				<view class="submit-section">
					<u-button type="primary" shape="circle" :loading="submitting" @click="handleSubmit"
						:disabled="!isFormComplete">
						{{ submitting ? '提交中...' : '提交申请' }}
					</u-button>

					<!-- 实时验证状态提示 -->
					<view class="validation-hint" v-if="showValidationHint && !isFormComplete">
						<u-icon name="info-circle" size="28" color="#ff9900"></u-icon>
						<text class="hint-text">{{ validationHintText }}</text>
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- 入驻协议弹窗 -->
		<u-popup v-model="showAgreement" mode="bottom" height="70%" border-radius="20">
			<view class="agreement-popup">
				<view class="popup-header">
					<text class="popup-title">商家入驻协议</text>
					<u-icon name="close" size="24" @click="showAgreement = false"></u-icon>
				</view>
				<scroll-view class="agreement-content" scroll-y>
					<text class="agreement-text">
						{{agreementContent}}
					</text>
				</scroll-view>
				<view class="popup-footer">
					<view class="agreement">
						<u-checkbox v-model="agreementChecked" shape="circle">
							我已阅读并同意
						</u-checkbox>
					</view>
					<u-button type="primary" @click="showAgreement = false">确定</u-button>
				</view>
			</view>
		</u-popup>

		<u-popup v-model="showStatusPopup" mode="center" width="80%" border-radius="16">
			<view class="status-popup">
				<u-icon :name="statusConfig.icon" size="60" :color="statusConfig.color"></u-icon>
				<text class="status-title">{{ statusConfig.title }}</text>
				<text class="status-desc">{{ statusConfig.desc }}</text>
				<u-button type="primary" @click="handleStatusConfirm" :plain="statusConfig.type === 'error'">
					{{ statusConfig.buttonText }}
				</u-button>
			</view>
		</u-popup>
	</view>
</template>

<script>
	export default {
		onLoad() {
			// 确保状态同步
			this.$store.dispatch('initializeStore')

			console.log('apply.vue - Vuex用户信息:', this.vuex_user_info)
			console.log('apply.vue - 登录状态:', this.isLoginStatus)

			this.userId = this.getCurrentUserId()
			if (this.userId) {
				// 检查是否已有申请记录
				this.checkApplicationStatus()
				// 加载协议内容
				this.loadAgreementContent()
			} else {
				console.log('用户未登录或用户信息不完整')
				uni.showToast({
					title: '请先登录',
					icon: 'none'
				})

				uni.navigateTo({
					url: '/pages/mine/mine'
				})
			}
		},
		data() {
			return {
				// 验证提示相关
				showValidationHint: false,
				validationHintText: '',

				// 其他原有数据
				agreementContent: '正在加载协议内容...',
				baseURL: uni.$baseUrl,
				uploadAction: uni.$baseUrl + '/api/upload',

				// 上传状态
				uploadingLicense: false,
				uploadingIdCardFront: false,
				uploadingIdCardBack: false,

				// 表单数据
				formData: {
					shopName: '',
					contactPhone: '',
					shopAddress: '',
					businessScope: '',
					description: ''
				},

				// 表单验证规则
				rules: {
					shopName: [{
							required: true,
							message: '请输入店铺名称',
							trigger: 'blur'
						},
						{
							min: 2,
							max: 30,
							message: '店铺名称长度为2-30个字符',
							trigger: 'blur'
						}
					],
					contactPhone: [{
							required: true,
							message: '请输入联系电话',
							trigger: 'blur'
						},
						{
							pattern: /^1[3-9]\d{9}$/,
							message: '请输入正确的手机号码',
							trigger: 'blur'
						}
					],
					shopAddress: [{
							required: true,
							message: '请输入店铺地址',
							trigger: 'blur'
						},
						{
							min: 5,
							max: 100,
							message: '地址长度为5-100个字符',
							trigger: 'blur'
						}
					],
					businessScope: [{
						required: true,
						message: '请输入经营范围',
						trigger: 'blur'
					}]
				},

				// 图片上传相关
				licenseImage: '',
				idCardFront: '',
				idCardBack: '',

				// 协议相关
				agreementChecked: false,
				showAgreement: false,

				// 提交状态
				submitting: false,

				// 状态弹窗
				showStatusPopup: false,
				statusConfig: {
					type: 'success',
					icon: 'checkmark-circle',
					color: '#19be6b',
					title: '提交成功',
					desc: '我们将在1-3个工作日内完成审核，请耐心等待',
					buttonText: '确定'
				}
			}
		},

		computed: {
			isLoginStatus() {
				return this.$store.state.isLoginStatus
			},
			vuex_user_info() {
				return this.$store.state.vuex_user_info
			},
			isFormComplete() {
				const basicInfoComplete = this.formData.shopName &&
					this.formData.contactPhone &&
					this.formData.shopAddress &&
					this.formData.businessScope;

				const imagesComplete = !!this.licenseImage &&
					!!this.idCardFront &&
					!!this.idCardBack;

				return basicInfoComplete && imagesComplete && this.agreementChecked;
			},
			missingFields() {
				const missing = [];
				if (!this.formData.shopName) missing.push('店铺名称');
				if (!this.formData.contactPhone) missing.push('联系电话');
				if (!this.formData.shopAddress) missing.push('店铺地址');
				if (!this.formData.businessScope) missing.push('经营范围');
				if (!this.licenseImage) missing.push('营业执照');
				if (!this.idCardFront) missing.push('身份证正面');
				if (!this.idCardBack) missing.push('身份证反面');
				if (!this.agreementChecked) missing.push('协议同意');
				return missing;
			}
		},

		watch: {
			// 监听表单变化，实时更新验证提示
			missingFields: {
				handler(newVal) {
					if (newVal.length > 0) {
						this.validationHintText = `请完善以下信息：${newVal.join('、')}`;
						this.showValidationHint = true;
					} else {
						this.showValidationHint = false;
					}
				},
				deep: true,
				immediate: true
			}
		},

		methods: {
			// 图片加载错误处理
			onImageError(imageType) {
				console.error(`${imageType} 图片加载失败:`, this[imageType]);
				uni.showToast({
					title: `${imageType} 图片加载失败`,
					icon: 'none'
				});
			},
			// 加载协议内容
			async loadAgreementContent() {
				try {
					// 使用相对路径访问 static 目录下的文件
					const [err, res] = await uni.request({
						url: '/static/agreement.txt',
						method: 'GET'
					})

					if (err) {
						console.error('加载协议失败:', err)
						this.agreementContent = '加载协议内容失败，请稍后重试'
						return
					}

					if (res.statusCode === 200) {
						this.agreementContent = res.data
						console.log('协议内容加载成功')
					} else {
						console.error('加载协议失败，状态码:', res.statusCode)
						this.agreementContent = '加载协议内容失败，请稍后重试'
					}
				} catch (error) {
					console.error('加载协议异常:', error)
					this.agreementContent = '加载协议内容失败，请稍后重试'
				}
			},

			// 检查申请状态
			async checkApplicationStatus() {
				try {
					console.log('开始检查申请状态，用户ID:', this.userId)

					const [err, response] = await uni.request({
						url: uni.$baseUrl + '/api/merchant/application_status',
						method: 'GET',
						data: {
							user_id: this.userId
						}
					})

					console.log('请求错误:', err)
					console.log('完整响应:', response)

					if (err) {
						console.error('请求失败:', err)
						return
					}

					console.log('响应状态码:', response.statusCode)
					console.log('响应数据:', response.data)

					if (response.statusCode !== 200) {
						console.error('服务器错误，状态码:', response.statusCode)
						return
					}

					const res = response.data
					console.log('解析后的数据:', res)

					if (res && res.code === 0 && res.data) {
						const applicationData = res.data
						console.log('申请状态:', applicationData.merchant_status)

						// 只有当状态是 pending 或 approved 时才跳转到状态页面
						if (applicationData.merchant_status === 'pending' || applicationData.merchant_status ===
							'approved') {
							console.log('申请正在审核中或已通过，跳转到状态页面')
							uni.redirectTo({
								url: '/pages/merchant/applyStatus'
							})
						} else if (applicationData.merchant_status === 'rejected') {
							console.log('申请被拒绝，允许重新申请，显示申请表单')
							// 预填充之前提交的数据，方便用户修改
							this.prefillFormData(applicationData)
						} else {
							console.log('未知状态，显示申请表单')
						}
					} else {
						console.log('没有申请记录，显示申请表单')
					}
				} catch (error) {
					console.error('检查申请状态失败:', error)
				}
			},

			// 预填充表单数据
			prefillFormData(applicationData) {
				this.formData = {
					shopName: applicationData.shop_name || '',
					contactPhone: applicationData.contact_phone || '',
					shopAddress: applicationData.shop_address || '',
					businessScope: applicationData.business_scope || '',
					description: applicationData.description || ''
				}

				// 如果有拒绝原因，显示给用户参考
				if (applicationData.reject_reason) {
					setTimeout(() => {
						uni.showModal({
							title: '上次申请被拒绝原因',
							content: applicationData.reject_reason,
							showCancel: false,
							confirmText: '我知道了'
						})
					}, 500)
				}
			},
			async loadData() {
				try {
					console.log('加载用户申请数据...')
					const userId = this.getCurrentUserId()

					// 添加获取用户已有申请数据的逻辑
					// 例如：
					// const response = await uni.request({
					//   url: `${this.baseURL}/api/merchant/application/${userId}`,
					//   method: 'GET'
					// })

					// if (response.data.code === 0 && response.data.data) {
					//   // 填充表单数据
					//   this.formData = { ...response.data.data }
					// }

					console.log('用户申请数据加载完成')
				} catch (error) {
					console.error('加载申请数据失败:', error)
				}
			},
			getCurrentUserId() {
				// 同时检查 Vuex 和本地存储
				let userInfo = this.vuex_user_info || uni.getStorageSync('vuex_user_info')
				console.log('获取用户信息:', userInfo)

				if (userInfo && userInfo.id) {
					return userInfo.id
				} else {
					return null
				}
			},
			checkUserLoginStatus() {
				try {
					const userInfo = uni.getStorageSync('userInfo');
					console.log('当前存储的用户信息:', userInfo);

					if (!userInfo || !userInfo.id) {
						console.warn('用户未登录或用户信息不完整');
						uni.showToast({
							title: '请先登录',
							icon: 'none'
						});
						setTimeout(() => {
							uni.navigateTo({
								url: '/pages/login/login'
							});
						}, 1500);
						return false;
					}

					console.log('用户已登录，用户ID:', userInfo.id);
					return true;
				} catch (e) {
					console.error('读取用户信息失败:', e);
					return false;
				}
			},
			// 选择营业执照图片
			chooseLicenseImage() {
				this.chooseImage('licenseImage', 'uploadingLicense');
			},

			// 选择身份证正面图片
			chooseIdCardFrontImage() {
				this.chooseImage('idCardFront', 'uploadingIdCardFront');
			},

			// 选择身份证反面图片
			chooseIdCardBackImage() {
				this.chooseImage('idCardBack', 'uploadingIdCardBack');
			},

			// 统一的图片选择方法
			// 统一的图片选择方法
			chooseImage(imageType, uploadingType) {
				console.log(`📱 选择${imageType}图片`);

				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: async (res) => {
						console.log('图片选择成功:', res);
						const tempFile = res.tempFiles[0];

						if (tempFile) {
							try {
								this[uploadingType] = true;

								const uploadedUrl = await this.uploadFileToServer(tempFile.path);

								// 确保URL是绝对路径
								let finalUrl = uploadedUrl;
								if (!finalUrl.startsWith('http')) {
									finalUrl = `${this.baseURL}${finalUrl}`;
								}

								// 更新数据
								this[imageType] = finalUrl;

								console.log(`🎉 ${imageType} 上传成功:`, finalUrl);
								console.log(`📸 ${imageType} 完整预览URL:`, finalUrl);

								uni.showToast({
									title: '上传成功',
									icon: 'success'
								});

							} catch (error) {
								uni.showToast({
									title: `上传失败: ${error.message}`,
									icon: 'none'
								});
								console.error(`${imageType} 上传失败:`, error);
							} finally {
								this[uploadingType] = false;
							}
						}
					},
					fail: (err) => {
						console.log('图片选择失败:', err);
						uni.showToast({
							title: '图片选择失败',
							icon: 'none'
						});
					}
				});
			},

			// 删除图片的方法
			removeLicenseImage() {
				this.licenseImage = '';
			},

			removeIdCardFrontImage() {
				this.idCardFront = '';
			},

			removeIdCardBackImage() {
				this.idCardBack = '';
			},

			// 上传文件到服务器
			async uploadFileToServer(filePath) {
				return new Promise((resolve, reject) => {
					uni.uploadFile({
						url: this.uploadAction,
						filePath: filePath,
						name: 'file',

						success: (uploadRes) => {
							console.log('上传接口响应状态:', uploadRes.statusCode);
							console.log('上传接口响应数据:', uploadRes.data);

							try {
								const res = JSON.parse(uploadRes.data);
								if (res.code === 0 && res.data && res.data.url) {
									// 将相对路径转换为绝对路径
									let imageUrl = res.data.url;
									if (!imageUrl.startsWith('http')) {
										// 如果是相对路径，添加基础URL
										imageUrl = `${this.baseURL}${imageUrl}`;
									}
									resolve(imageUrl);
								} else {
									reject(new Error(res.message || '服务器上传失败'));
								}
							} catch (e) {
								console.error('响应解析错误:', e);
								reject(new Error('服务器响应格式错误'));
							}
						},
						fail: (error) => {
							console.error('上传请求失败:', error);
							reject(new Error('网络连接失败，请检查服务器地址或网络连接'));
						}
					});
				});
			},

			// 获取当前用户ID
			// getCurrentUserId() {
			// 	try {
			// 		const userInfo = uni.getStorageSync('userInfo');
			// 		console.log('获取用户ID - 存储的用户信息:', userInfo);

			// 		if (!userInfo) {
			// 			console.warn('未找到用户信息，使用默认ID: 1');
			// 			return '1';
			// 		}

			// 		if (!userInfo.id) {
			// 			console.warn('用户信息中没有id字段，用户信息结构:', userInfo);
			// 			return '1';
			// 		}

			// 		console.log('使用用户ID:', userInfo.id);
			// 		return userInfo.id.toString(); // 确保返回字符串
			// 	} catch (e) {
			// 		console.error('获取用户ID异常:', e);
			// 		return '1';
			// 	}
			// },

			// 提交申请
			// 提交申请
			async handleSubmit() {
				// 如果表单未完成，显示详细提示
				if (!this.isFormComplete) {
					this.showDetailedValidationHint();
					return;
				}

				// 获取用户ID
				const userId = this.getCurrentUserId();
				if (!userId) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					setTimeout(() => {
						uni.navigateTo({
							url: '/pages/login/login'
						});
					}, 1500);
					return;
				}

				this.submitting = true;

				try {
					const submitData = {
						userId: userId,
						shopName: this.formData.shopName,
						contactPhone: this.formData.contactPhone,
						shopAddress: this.formData.shopAddress,
						businessScope: this.formData.businessScope,
						description: this.formData.description,
						licenseImage: this.licenseImage,
						idCardFront: this.idCardFront,
						idCardBack: this.idCardBack
					};

					console.log('提交商家申请数据:', submitData);

					const response = await new Promise((resolve, reject) => {
						uni.request({
							url: `${this.baseURL}/api/merchant/apply`,
							method: 'POST',
							data: submitData,
							header: {
								'Content-Type': 'application/json',
								'User-ID': userId
							},
							success: (res) => resolve(res),
							fail: (err) => reject(err)
						});
					});

					const res = response.data;

					if (res.code === 0) {
						// 提交成功，显示成功提示并跳转到状态页面
						console.log('申请提交成功，跳转到状态页面');
						this.showSuccessPopup();

						// 延迟跳转，让用户看到成功提示
						setTimeout(() => {
							uni.redirectTo({
								url: '/pages/merchant/applyStatus'
							});
						}, 1500);

					} else if (res.code === 409) {
						// 如果是申请状态相关的错误，显示具体原因
						if (res.data && res.data.current_status) {
							let errorMsg = '提交失败：';
							switch (res.data.current_status) {
								case 'pending':
									errorMsg += '您的申请正在审核中，请耐心等待';
									// 如果是审核中状态，直接跳转到状态页面
									setTimeout(() => {
										uni.redirectTo({
											url: '/pages/merchant/applyStatus'
										});
									}, 1500);
									break;
								case 'approved':
									errorMsg += '您已经是商家，无需再次申请';
									break;
								default:
									errorMsg += res.message || '未知错误';
							}
							this.showErrorPopup(errorMsg);
						} else {
							this.showErrorPopup(res.message || '提交失败');
						}
					} else {
						this.showErrorPopup(res.message || '提交失败');
					}

				} catch (error) {
					console.error('提交申请失败:', error);
					this.showErrorPopup('网络错误，请检查服务器连接');
				} finally {
					this.submitting = false;
				}
			},

			// 显示详细的验证提示
			showDetailedValidationHint() {
				if (this.missingFields.length > 0) {
					uni.showToast({
						title: `请完善${this.missingFields.join('、')}`,
						icon: 'none',
						duration: 3000
					});
				}
			},

			// 重置表单
			resetForm() {
				this.formData = {
					shopName: '',
					contactPhone: '',
					shopAddress: '',
					businessScope: '',
					description: ''
				};
				this.licenseImage = '';
				this.idCardFront = '';
				this.idCardBack = '';
				this.agreementChecked = false;

				// 重置表单验证
				if (this.$refs.applyForm) {
					this.$refs.applyForm.resetFields();
				}
			},

			// 显示成功弹窗
			showSuccessPopup() {
				this.statusConfig = {
					type: 'success',
					icon: 'checkmark-circle',
					color: '#19be6b',
					title: '提交成功',
					desc: '申请已提交，我们将在1-3个工作日内完成审核',
					buttonText: '查看申请状态'
				};
				this.showStatusPopup = true;
			},

			// 显示错误弹窗
			showErrorPopup(message) {
				this.statusConfig = {
					type: 'error',
					icon: 'close-circle',
					color: '#fa3534',
					title: '提交失败',
					desc: message,
					buttonText: '重新填写'
				};
				this.showStatusPopup = true;
			},

			// 状态弹窗确认
			handleStatusConfirm() {
				this.showStatusPopup = false;
				if (this.statusConfig.type === 'success') {
					// 成功提交后跳转到状态页面
					uni.redirectTo({
						url: '/pages/merchant/applyStatus'
					});
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.merchant-apply-container {
		height: 100vh;
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
		display: flex;
		flex-direction: column;
	}

	.scroll-content {
		flex: 1;
		padding: 20rpx;
	}

	.apply-notice {
		display: flex;
		align-items: center;
		background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
		padding: 24rpx;
		border-radius: 16rpx;
		margin-bottom: 30rpx;
		border-left: 6rpx solid #1976d2;
		box-shadow: 0 2rpx 12rpx rgba(25, 118, 210, 0.1);

		.notice-text {
			margin-left: 16rpx;
			font-size: 26rpx;
			color: #1976d2;
			font-weight: 500;
		}
	}

	.apply-form {
		background: #fff;
		border-radius: 20rpx;
		padding: 32rpx;
		box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.06);
	}

	.form-section {
		margin-bottom: 48rpx;

		.section-title {
			font-size: 34rpx;
			font-weight: 600;
			color: #2c3e50;
			margin-bottom: 32rpx;
			padding-left: 16rpx;
			border-left: 8rpx solid #5d7291;
			background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
			padding: 20rpx 24rpx;
			border-radius: 12rpx;
		}
	}

	.upload-item {
		margin-bottom: 48rpx;
		padding: 24rpx;
		background: #f8f9fa;
		border-radius: 16rpx;
		border: 1rpx solid #e9ecef;

		.upload-label {
			font-size: 30rpx;
			color: #2c3e50;
			margin-bottom: 12rpx;
			font-weight: 600;
		}

		.upload-desc {
			font-size: 24rpx;
			color: #6c757d;
			margin-bottom: 24rpx;
			line-height: 1.5;
		}

		.upload-buttons {
			display: flex;
			gap: 20rpx;
			margin-bottom: 24rpx;
			flex-wrap: wrap;
		}

		.upload-status {
			display: flex;
			align-items: center;
			margin-top: 16rpx;
			padding: 12rpx 16rpx;
			background: white;
			border-radius: 8rpx;
			border: 1rpx solid #e9ecef;

			.status-text {
				margin-left: 12rpx;
				font-size: 24rpx;
				font-weight: 500;
			}
		}
	}

	.agreement {
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 48rpx 0;
		font-size: 26rpx;
		padding: 24rpx;
		background: #f8f9fa;
		border-radius: 12rpx;

		.agreement-link {
			color: #1976d2;
			margin-left: 8rpx;
			font-weight: 500;
			text-decoration: underline;
		}
	}

	.submit-section {
		padding: 24rpx 0;

		.validation-hint {
			display: flex;
			align-items: center;
			justify-content: center;
			margin-top: 24rpx;
			padding: 24rpx;
			background: #fff8e6;
			border-radius: 12rpx;
			border: 1rpx solid #ffd591;
			animation: fadeIn 0.3s ease-in;

			.hint-text {
				margin-left: 16rpx;
				font-size: 26rpx;
				color: #fa8c16;
				font-weight: 500;
			}
		}

		::v-deep .u-button {
			height: 96rpx;
			font-size: 32rpx;
			font-weight: 600;
			transition: all 0.3s ease;
			background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
			box-shadow: 0 4rpx 16rpx rgba(25, 118, 210, 0.3);

			&--disabled {
				background: #bdbdbd !important;
				box-shadow: none;
			}

			&--loading {
				opacity: 0.8;
			}
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10rpx);
		}

		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.agreement-popup {
		height: 100%;
		display: flex;
		flex-direction: column;
		background: #fff;

		.popup-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 32rpx 40rpx;
			border-bottom: 1rpx solid #e9ecef;
			background: #f8f9fa;
			flex-shrink: 0; // 防止头部被压缩

			.popup-title {
				font-size: 34rpx;
				font-weight: 600;
				color: #2c3e50;
			}
		}

		.agreement-content {
			flex: 1;
			padding: 40rpx;
			background: #fff;
			box-sizing: border-box; // 确保padding包含在高度内
			overflow: hidden; // 确保内容不溢出容器

			.agreement-text {
				font-size: 28rpx;
				line-height: 1.6; // 调整行高
				color: #495057;
				word-wrap: break-word; // 允许单词内换行
				word-break: break-all; // 强制换行（中英文都适用）
				white-space: pre-wrap; // 保留空格和换行，但允许自动换行
				overflow-wrap: break-word; // 现代浏览器的换行属性
				display: block;
				width: 100%;
			}
		}

		.popup-footer {
			padding: 32rpx 40rpx;
			border-top: 1rpx solid #e9ecef;
			background: #f8f9fa;
			display: flex;
			flex-direction: column;
			gap: 24rpx;
			flex-shrink: 0; // 防止底部被压缩

			.agreement {
				background: transparent;
				margin: 0;
				padding: 0;
			}
		}
	}

	.status-popup {
		padding: 60rpx 40rpx;
		text-align: center;
		background: #fff;
		border-radius: 20rpx;

		.status-title {
			display: block;
			font-size: 36rpx;
			font-weight: 600;
			margin: 32rpx 0 24rpx;
			color: #2c3e50;
		}

		.status-desc {
			display: block;
			font-size: 28rpx;
			color: #6c757d;
			margin-bottom: 48rpx;
			line-height: 1.6;
		}
	}

	.image-preview {
		margin-top: 24rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20rpx;
		background: #f8f9fa;
		padding: 20rpx;
		border-radius: 12rpx;
		border: 1rpx dashed #e9ecef;
	}

	.preview-image {
		width: 100%;
		max-width: 400rpx;
		height: 300rpx;
		border-radius: 12rpx;
		border: 2rpx solid #e9ecef;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
		background-color: #fff; // 添加背景色，确保图片区域可见
	}

	// 如果图片加载失败，显示占位符
	.preview-image:after {
		content: '图片加载失败';
		display: flex;
		align-items: center;
		justify-content: center;
		color: #999;
		font-size: 24rpx;
	}
</style>