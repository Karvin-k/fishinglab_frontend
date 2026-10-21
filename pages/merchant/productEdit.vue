<template>
	<view class="product-edit">
		<u-navbar :title="isEdit ? '编辑商品' : '发布商品'" :bgColor="'#5d7291'" :title-color="'#fff'">
			<view slot="left" @click="goBack">
				<u-icon name="arrow-left" size="24" color="#fff" />
			</view>
		</u-navbar>

		<scroll-view scroll-y class="scroll-content">
			<view class="form-card">
				<!-- 商品名称 -->
				<view class="form-item">
					<view class="label">商品名称<text class="required">*</text></view>
					<input class="input" v-model="form.name" placeholder="请输入商品名称" />
				</view>

				<!-- 商品分类 -->
				<view class="form-item">
					<view class="label">商品分类<text class="required">*</text></view>
					<view class="selector" @click="showCategoryPicker = true">
						<text :class="{ placeholder: !form.categoryLabel }">{{ form.categoryLabel || '请选择分类' }}</text>
						<u-icon name="arrow-down" size="24" color="#999" />
					</view>
				</view>

				<!-- 价格和库存一行 -->
				<view class="form-row">
					<view class="form-item half">
						<view class="label">价格（元）<text class="required">*</text></view>
						<input class="input" v-model="form.price" type="digit" placeholder="请输入价格" />
					</view>
					<view class="form-item half">
						<view class="label">库存<text class="required">*</text></view>
						<input class="input" v-model="form.stock" type="number" placeholder="请输入库存" />
					</view>
				</view>

				<!-- 商品主图 -->
				<view class="form-item">
					<view class="label">商品主图<text class="required">*</text></view>
					<view class="upload-area">
						<view class="upload-box" @click="chooseMainImage">
							<image v-if="form.pic_url" :src="form.pic_url" mode="aspectFill" class="preview-image" />
							<view v-else class="upload-icon">
								<u-icon name="plus" size="40" color="#ccc" />
								<text>上传图片</text>
							</view>
						</view>
						<text class="tip">建议尺寸 750x750，支持 jpg/png</text>
					</view>
				</view>

				<!-- 商品详情图片（多图） -->
				<view class="form-item">
					<view class="label">商品详情图片</view>
					<view class="detail-images">
						<view v-for="(img, idx) in form.detailImages" :key="idx" class="detail-img-item">
							<image :src="fullImageUrl(img)" mode="aspectFill" class="detail-img" />
							<view class="delete-icon" @click="removeDetailImage(idx)">
								<u-icon name="close" size="20" color="#fff" />
							</view>
						</view>
						<view class="upload-detail-btn" @click="chooseDetailImage">
							<u-icon name="plus" size="32" color="#999" />
							<text>添加图片</text>
						</view>
					</view>
					<text class="tip">可上传多张，建议比例 1:1</text>
				</view>

				<!-- 热销推荐 -->
				<view class="form-item inline">
					<view class="label">热销推荐</view>
					<u-switch v-model="form.hot" />
				</view>

				<!-- 规格管理 -->
				<view class="spec-section">
					<view class="section-title">商品规格</view>
					<view v-for="(attr, idx) in form.attributes" :key="idx" class="spec-card">
						<view class="spec-header">
							<input class="spec-name" v-model="attr.name" placeholder="规格名称（如：尺寸）" />
							<u-icon name="close" size="28" color="#999" @click="removeAttribute(idx)" />
						</view>
						<view class="spec-values">
							<view v-for="(val, vIdx) in attr.values" :key="vIdx" class="spec-value-row">
								<input class="value-input" v-model="attr.values[vIdx]" placeholder="规格值" />
								<input class="price-input" v-model.number="attr.prices[vIdx]" type="digit"
									placeholder="价格" />
								<u-icon name="close" size="20" color="#ccc" @click="removeAttrValue(attr, vIdx)" />
							</view>
							<view class="add-value" @click="addAttrValue(attr)">
								<u-icon name="plus" size="20" /> 添加规格值
							</view>
						</view>
						<view class="spec-option">
							<text>绝对价格</text>
							<u-switch v-model="attr.is_absolute_price" size="24" />
							<text class="hint">（勾选后商品价格以此规格价格为准）</text>
						</view>
					</view>
					<view class="add-spec" @click="addAttribute">
						<u-icon name="plus" size="24" /> 添加规格
					</view>
				</view>

				<button class="submit-btn" @click="submitForm" :loading="submitting">提交商品</button>
			</view>
		</scroll-view>

		<!-- 分类选择器 -->
		<u-picker mode="selector" :range="categoryList" range-key="label" @confirm="onCategoryConfirm"
			v-model="showCategoryPicker" />
	</view>
</template>

<script>
	import request from '@/common/request.js';

	export default {
		data() {
			return {
				isEdit: false,
				productId: null,
				form: {
					name: '',
					category: '',
					categoryLabel: '',
					price: 0,
					stock: 0,
					pic_url: '',
					detail: '',
					hot: false,
					attributes: [],
					detailImages: []
				},
				categoryList: [{
						label: '鱼竿',
						value: 'rod'
					},
					{
						label: '鱼饵',
						value: 'bait'
					},
					{
						label: '配件',
						value: 'accessory'
					}
				],
				showCategoryPicker: false,
				submitting: false,
				baseUrl: uni.$baseUrl
			}
		},
		onLoad(options) {
			if (options.id) {
				this.isEdit = true
				this.productId = options.id
				this.fetchProductDetail()
			}
		},
		methods: {
			goBack() {
				uni.navigateBack()
			},
			fullImageUrl(url) {
				if (!url) return ''
				if (url.startsWith('http') || url.startsWith('data:')) return url
				return this.baseUrl + url
			},
			async fetchProductDetail() {
				const res = await request({
					url: `/api/goods/detail/${this.productId}`,
					method: 'GET'
				});
				if (res.data.code === 0) {
					const data = res.data.data
					this.form = {
						name: data.name,
						category: data.category,
						categoryLabel: this.getCategoryLabel(data.category),
						price: data.price,
						stock: data.stock,
						pic_url: this.fullImageUrl(data.pic_url),
						detail: data.detail,
						hot: data.hot,
						attributes: data.attributes.map(attr => ({
							name: attr.name,
							values: [...attr.values],
							prices: [...attr.prices],
							is_absolute_price: attr.is_absolute_price
						})),
						detailImages: data.images || []
					}
				} else {
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					})
				}
			},
			getCategoryLabel(value) {
				const item = this.categoryList.find(c => c.value === value)
				return item ? item.label : ''
			},
			onCategoryConfirm(e) {
				const index = e[0]
				this.form.category = this.categoryList[index].value
				this.form.categoryLabel = this.categoryList[index].label
			},
			// 上传图片通用方法
			async uploadImage(file) {
				uni.showLoading({
					title: '上传中...'
				})
				try {
					const [err, uploadRes] = await uni.uploadFile({
						url: `${this.baseUrl}/api/upload`,
						filePath: file.path,
						name: 'file'
					})
					uni.hideLoading()
					if (err) throw err
					const result = JSON.parse(uploadRes.data)
					if (result.code === 0) {
						return result.data.url // 返回相对路径
					} else {
						uni.showToast({
							title: '上传失败',
							icon: 'none'
						})
						return null
					}
				} catch (error) {
					console.error('上传失败', error)
					uni.showToast({
						title: '上传失败',
						icon: 'none'
					})
					return null
				}
			},
			// 选择主图
			chooseMainImage() {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: async (res) => {
						const tempFile = res.tempFiles[0]
						const url = await this.uploadImage(tempFile)
						if (url) {
							this.form.pic_url = this.fullImageUrl(url) // 存储完整URL
						}
					}
				})
			},
			// 选择详情图片
			chooseDetailImage() {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: async (res) => {
						const tempFile = res.tempFiles[0]
						const url = await this.uploadImage(tempFile)
						if (url) {
							this.form.detailImages.push(url) // 存储相对路径
						}
					}
				})
			},
			removeDetailImage(index) {
				this.form.detailImages.splice(index, 1)
			},
			addAttribute() {
				this.form.attributes.push({
					name: '',
					values: [],
					prices: [],
					is_absolute_price: false
				})
			},
			removeAttribute(index) {
				this.form.attributes.splice(index, 1)
			},
			addAttrValue(attr) {
				attr.values.push('')
				attr.prices.push(0)
			},
			removeAttrValue(attr, idx) {
				attr.values.splice(idx, 1)
				attr.prices.splice(idx, 1)
			},
			async submitForm() {
				if (!this.form.name) return uni.showToast({
					title: '请填写商品名称',
					icon: 'none'
				})
				if (!this.form.category) return uni.showToast({
					title: '请选择分类',
					icon: 'none'
				})
				const priceNum = parseFloat(this.form.price)
				const stockNum = parseInt(this.form.stock)
				if (isNaN(priceNum) || priceNum <= 0) return uni.showToast({
					title: '请输入有效的价格',
					icon: 'none'
				})
				if (isNaN(stockNum) || stockNum < 0) return uni.showToast({
					title: '请输入有效的库存',
					icon: 'none'
				})
				if (!this.form.pic_url) return uni.showToast({
					title: '请上传商品主图',
					icon: 'none'
				})

				const user_id = this.$store.state.vuex_user_info?.id;
				if (!user_id) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					})
					return
				}

				// 主图URL转换为相对路径（如有需要）
				let relativePicUrl = this.form.pic_url.replace(this.baseUrl, '');
				if (!relativePicUrl.startsWith('/')) relativePicUrl = '/' + relativePicUrl;
				this.submitting = true;
				const url = this.isEdit ? `/api/merchant/products/${this.productId}` : '/api/merchant/products';
				const method = this.isEdit ? 'PUT' : 'POST';
				const postData = {
					name: this.form.name,
					category: this.form.category,
					price: parseFloat(this.form.price),
					stock: parseInt(this.form.stock),
					detail: this.form.detail,
					pic_url: relativePicUrl,
					hot: this.form.hot,
					detail_images: this.form.detailImages, // 已经是相对路径
					attributes: this.form.attributes
				};

				try {
					const res = await request({
						url,
						method,
						data: postData
					});
					if (res.data.code === 0) {
						uni.showToast({
							title: this.isEdit ? '更新成功' : '发布成功',
							icon: 'success'
						});
						setTimeout(() => uni.navigateBack(), 1500);
					} else {
						uni.showToast({
							title: res.data.message,
							icon: 'none'
						});
					}
				} catch (error) {
					uni.showToast({
						title: '提交失败',
						icon: 'none'
					});
				} finally {
					this.submitting = false;
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	/* 统一提示文字样式 */
	.tip {
		font-size: 24rpx;
		color: #999;
		margin-top: 15rpx;
		display: block;
		text-align: left;
		width: 100%;
	}

	.detail-images {
		display: flex;
		flex-wrap: wrap;
		gap: 20rpx;

		.detail-img-item {
			position: relative;
			width: 160rpx;
			height: 160rpx;
			border-radius: 12rpx;
			overflow: hidden;

			.detail-img {
				width: 100%;
				height: 100%;
				background: #f9f9f9;
			}

			.delete-icon {
				position: absolute;
				top: 8rpx;
				right: 8rpx;
				background: rgba(0, 0, 0, 0.5);
				border-radius: 50%;
				width: 40rpx;
				height: 40rpx;
				display: flex;
				align-items: center;
				justify-content: center;
			}
		}

		.upload-detail-btn {
			width: 160rpx;
			height: 160rpx;
			background: #f9f9f9;
			border-radius: 12rpx;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 12rpx;
			font-size: 24rpx;
			color: #999;
			border: 1rpx dashed #ddd;
		}
	}

	.product-edit {
		background-color: #ffffff;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.scroll-content {
		flex: 1;
		padding: 0;
	}

	.form-card {
		background: #ffffff;
		padding: 30rpx;
		margin: 0;
		box-sizing: border-box;
	}

	.form-item {
		margin-bottom: 30rpx;
		width: 100%;
		box-sizing: border-box;

		.label {
			font-size: 28rpx;
			font-weight: 500;
			color: #333;
			margin-bottom: 15rpx;

			.required {
				color: #f38b11;
				margin-left: 8rpx;
			}
		}

		.input,
		.selector,
		.textarea {
			width: 100%;
			box-sizing: border-box;
			background: #fafafa;
			border-radius: 12rpx;
			padding: 22rpx;
			font-size: 28rpx;
			color: #333;
			border: none;
			min-height: 80rpx;
		}

		.selector {
			display: flex;
			justify-content: space-between;
			align-items: center;

			.placeholder {
				color: #999;
			}
		}

		.textarea {
			min-height: 160rpx;
		}

		&.inline {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 30rpx;

			.label {
				margin-bottom: 0;
			}
		}
	}

	.form-row {
		display: flex;
		gap: 20rpx;
		box-sizing: border-box;

		.form-item.half {
			flex: 1;
			margin-bottom: 30rpx;
			box-sizing: border-box;
		}
	}

	.upload-area {
		display: flex;
		flex-direction: column;
		align-items: flex-start;

		.upload-box {
			width: 180rpx;
			height: 180rpx;
			background: #fafafa;
			border-radius: 12rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			border: 1rpx solid #eee;
			margin: 0;

			.preview-image {
				width: 100%;
				height: 100%;
			}

			.upload-icon {
				display: flex;
				flex-direction: column;
				align-items: center;

				text {
					font-size: 24rpx;
					color: #999;
					margin-top: 8rpx;
				}
			}
		}

		.tip {
			font-size: 24rpx;
			color: #999;
			margin-top: 15rpx;
			text-align: left;
			width: 100%;
		}
	}

	.spec-section {
		margin: 30rpx 0;

		.section-title {
			font-size: 32rpx;
			font-weight: 600;
			margin-bottom: 20rpx;
			padding-left: 15rpx;
			border-left: 6rpx solid #5d7291;
		}

		.spec-card {
			background: #fafafa;
			border-radius: 12rpx;
			padding: 20rpx;
			margin-bottom: 20rpx;
			box-sizing: border-box;

			.spec-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 20rpx;

				.spec-name {
					flex: 1;
					background: #fff;
					border-radius: 12rpx;
					padding: 15rpx;
					font-size: 28rpx;
					margin-right: 15rpx;
					min-height: 70rpx;
				}
			}

			.spec-value-row {
				display: flex;
				gap: 15rpx;
				margin-bottom: 15rpx;

				.value-input {
					flex: 2;
					background: #fff;
					border-radius: 12rpx;
					padding: 15rpx;
					font-size: 26rpx;
					min-height: 70rpx;
				}

				.price-input {
					flex: 1;
					background: #fff;
					border-radius: 12rpx;
					padding: 15rpx;
					font-size: 26rpx;
					min-height: 70rpx;
				}
			}

			.add-value {
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 10rpx;
				background: #fff;
				border: 1rpx solid #5d7291;
				border-radius: 12rpx;
				padding: 18rpx;
				color: #5d7291;
				font-size: 26rpx;
				margin: 10rpx 0;
			}

			.spec-option {
				display: flex;
				align-items: center;
				gap: 10rpx;
				margin-top: 20rpx;
				font-size: 24rpx;
				color: #666;
			}
		}

		.add-spec {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 12rpx;
			background: #fff;
			border: 2rpx dashed #5d7291;
			border-radius: 20rpx;
			padding: 24rpx;
			color: #5d7291;
			font-size: 28rpx;
			margin-top: 10rpx;
		}
	}

	.submit-btn {
		width: 100%;
		background: #f38b11;
		color: #fff;
		border-radius: 12rpx;
		height: 88rpx;
		line-height: 88rpx;
		font-size: 32rpx;
		font-weight: 500;
		margin-top: 40rpx;
		border: none;
	}
</style>