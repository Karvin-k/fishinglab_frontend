<template>
	<view class="fishing-service-edit">
		<u-navbar :title="isEdit ? '编辑钓场服务' : '发布钓场服务'" :bgColor="'#5d7291'" :title-color="'#fff'">
			<view slot="left" @click="goBack">
				<u-icon name="arrow-left" size="24" color="#fff" />
			</view>
		</u-navbar>

		<scroll-view scroll-y class="scroll-content">
			<view class="form-card">
				<!-- 服务名称 -->
				<view class="form-item">
					<view class="label">服务名称<text class="required">*</text></view>
					<input class="input" v-model="form.name" placeholder="请输入服务名称" />
				</view>

				<!-- 服务类型 -->
				<view class="form-item">
					<view class="label">服务类型<text class="required">*</text></view>
					<view class="radio-group">
						<label class="radio-label">
							<radio value="regular" :checked="form.service_type === 'regular'"
								@click="form.service_type = 'regular'" color="#5d7291" />
							<text>开钓服务</text>
						</label>
						<label class="radio-label">
							<radio value="competition" :checked="form.service_type === 'competition'"
								@click="form.service_type = 'competition'" color="#5d7291" />
							<text>比赛服务</text>
						</label>
					</view>
				</view>

				<!-- 价格 -->
				<view class="form-item">
					<view class="label">价格（元/天 或 元/人）<text class="required">*</text></view>
					<input class="input" v-model="form.price" type="digit" placeholder="请输入价格" />
				</view>

				<!-- 封面图（多张） -->
				<view class="form-item">
					<view class="label">封面图<text class="required">*</text></view>
					<view class="image-list">
						<view v-for="(img, idx) in form.cover_images" :key="idx" class="image-item">
							<image :src="fullImageUrl(img)" mode="aspectFill" class="cover-img"
								@click="previewImage(img)" />
							<view class="delete-icon" @click.stop="removeCoverImage(idx)">
								<u-icon name="close" size="20" color="#fff" />
							</view>
						</view>
						<view class="upload-btn" @click="chooseCoverImage" v-if="form.cover_images.length < 6">
							<u-icon name="plus" size="40" color="#ccc" />
							<text>添加图片</text>
						</view>
					</view>
					<text class="tip">最多6张，第一张将作为封面</text>
				</view>

				<!-- 详细地址 -->
				<view class="form-item">
					<view class="label">详细地址</view>
					<input class="input" v-model="form.address" placeholder="请输入详细地址" />
				</view>

				<!-- 关联鱼塘 -->
				<view class="form-item">
					<view class="label">关联鱼塘（可选）</view>
					<view class="selector" @click="showPondPicker = true">
						<text :class="{ placeholder: !form.pond_name }">{{ form.pond_name || '请选择鱼塘' }}</text>
						<u-icon name="arrow-down" size="24" color="#999" />
					</view>
				</view>

				<!-- 详情描述 -->
				<view class="form-item">
					<view class="label">详情描述</view>
					<textarea class="textarea" v-model="form.details" placeholder="详细介绍服务内容" />
				</view>

				<!-- 标签 -->
				<view class="form-item">
					<view class="label">标签（用空格分隔）</view>
					<input class="input" v-model="tagInput" placeholder="例如： 野钓 黑坑 巨物" />
					<view v-if="tags.length" class="tag-list">
						<text v-for="tag in tags" :key="tag" class="tag">#{{ tag }}#</text>
					</view>
				</view>

				<!-- 比赛专属字段 -->
				<view v-if="form.service_type === 'competition'" class="competition-fields">
					<view class="form-item">
						<view class="label">比赛名称</view>
						<input class="input" v-model="form.match_name" placeholder="请输入比赛名称" />
					</view>
					<view class="form-item">
						<view class="label">比赛详情</view>
						<textarea class="textarea" v-model="form.match_detail" placeholder="比赛规则、奖项等" />
					</view>
					<!-- 比赛日期 -->
					<view class="form-item">
						<view class="label">比赛日期</view>
						<picker mode="date" @change="onDateChange" :value="form.match_date" class="selector">
							<text :class="{ placeholder: !form.match_date }">{{ form.match_date || '请选择日期' }}</text>
							<u-icon name="arrow-down" size="24" color="#999" />
						</picker>
					</view>
					<!-- 比赛时间 -->
					<view class="form-item">
						<view class="label">比赛时间</view>
						<picker mode="time" @change="onTimeChange" :value="form.match_time" class="selector">
							<text :class="{ placeholder: !form.match_time }">{{ form.match_time || '请选择时间' }}</text>
							<u-icon name="arrow-down" size="24" color="#999" />
						</picker>
					</view>
					<view class="form-item inline">
						<view class="label">比赛已结束</view>
						<switch :checked="form.is_end" @change="e => form.is_end = e.detail.value" color="#5d7291" />
					</view>
				</view>

				<button class="submit-btn" @click="submit" :loading="submitting">提交</button>
			</view>
		</scroll-view>

		<!-- 鱼塘选择器 -->
		<u-picker mode="selector" :range="pondList" range-key="name" @confirm="onPondConfirm"
			v-model="showPondPicker" />
	</view>
</template>

<script>
	import request from '@/common/request.js';
	import {
		uploadFile
	} from '@/common/request.js'; // 用于图片上传

	export default {
		data() {
			return {
				isEdit: false,
				id: null,
				form: {
					name: '',
					service_type: 'regular',
					price: '',
					cover_images: [],
					address: '',
					pond_id: null,
					pond_name: '',
					details: '',
					tags: [],
					match_name: '',
					match_detail: '',
					match_date: '',
					match_time: '',
					is_end: false
				},
				tagInput: '',
				pondList: [],
				showPondPicker: false,
				submitting: false,
				baseUrl: uni.$baseUrl
			}
		},
		computed: {
			tags() {
				return this.tagInput.split(/\s+/).filter(t => t.trim())
			}
		},
		onLoad(options) {
			if (options.id) {
				this.isEdit = true
				this.id = options.id
				this.fetchDetail()
			}
			this.loadPonds()
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
			previewImage(imgUrl) {
				uni.previewImage({
					urls: [this.fullImageUrl(imgUrl)]
				})
			},
			removeCoverImage(idx) {
				this.form.cover_images.splice(idx, 1)
			},
			async loadPonds() {
				try {
					const res = await request({
						url: '/api/pond/list',
						method: 'GET'
					});
					if (res.data.code === 0) this.pondList = res.data.data;
				} catch (error) {
					console.error('获取鱼塘列表失败', error);
				}
			},
			async fetchDetail() {
				uni.showLoading({
					title: '加载中...'
				});
				try {
					const res = await request({
						url: `/api/fishing/service/${this.id}`,
						method: 'GET'
					});
					uni.hideLoading();
					if (res.data.code === 0) {
						const data = res.data.data;
						let tags = data.tags || [];
						if (typeof tags === 'string') {
							try {
								tags = JSON.parse(tags);
							} catch (e) {
								tags = [];
							}
						}
						let match_date = '',
							match_time = '';
						if (data.match_time) {
							const parts = data.match_time.split(' ');
							match_date = parts[0];
							match_time = parts[1] ? parts[1].slice(0, 5) : '';
						}
						this.form = {
							name: data.name,
							service_type: data.service_type,
							price: data.price.toString(),
							cover_images: data.images || (data.cover_image ? [data.cover_image] : []),
							address: data.address,
							pond_id: data.pond_id,
							pond_name: data.pond_name,
							details: data.details,
							tags: tags,
							match_name: data.match_name || '',
							match_detail: data.match_detail || '',
							match_date: match_date,
							match_time: match_time,
							is_end: data.is_end || false
						};
						this.tagInput = this.form.tags.join(' ');
					} else {
						uni.showToast({
							title: res.data.msg || '加载失败',
							icon: 'none'
						});
					}
				} catch (error) {
					uni.hideLoading();
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					});
				}
			},
			async uploadImage(file) {
				uni.showLoading({
					title: '上传中...'
				});
				try {
					const res = await uploadFile({
						url: '/api/upload',
						filePath: file.path,
						name: 'file'
					});
					uni.hideLoading();
					const result = JSON.parse(res.data);
					if (result.code === 0) return result.data.url;
					else uni.showToast({
						title: '上传失败',
						icon: 'none'
					});
					return null;
				} catch (error) {
					console.error('上传失败', error);
					uni.showToast({
						title: '上传失败',
						icon: 'none'
					});
					return null;
				}
			},
			chooseCoverImage() {
				uni.chooseImage({
					count: 6 - this.form.cover_images.length,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: async (res) => {
						for (let tempFile of res.tempFiles) {
							const url = await this.uploadImage(tempFile)
							if (url) this.form.cover_images.push(url)
						}
					}
				})
			},
			onPondConfirm(e) {
				const pond = this.pondList[e[0]]
				this.form.pond_id = pond.id
				this.form.pond_name = pond.name
			},
			onDateChange(e) {
				this.form.match_date = e.detail.value
			},
			onTimeChange(e) {
				this.form.match_time = e.detail.value
			},
			async submit() {
				if (!this.form.name) return uni.showToast({
					title: '请填写服务名称',
					icon: 'none'
				})
				if (!this.form.price || parseFloat(this.form.price) <= 0) return uni.showToast({
					title: '请输入有效的价格',
					icon: 'none'
				})
				if (this.form.cover_images.length === 0) return uni.showToast({
					title: '请上传封面图',
					icon: 'none'
				})



				this.submitting = true;
				const url = this.isEdit ? `/api/merchant/fishing_services/${this.id}` :
					'/api/merchant/fishing_services';
				const method = this.isEdit ? 'PUT' : 'POST';
				const cover_image = this.form.cover_images[0] || '';
				let matchTimeForBackend = '';
				if (this.form.match_date && this.form.match_time) {
					matchTimeForBackend = `${this.form.match_date} ${this.form.match_time}:00`;
				}
				const postData = {
					name: this.form.name,
					service_type: this.form.service_type,
					price: parseFloat(this.form.price),
					cover_image: cover_image,
					cover_images: this.form.cover_images,
					address: this.form.address,
					pond_id: this.form.pond_id,
					details: this.form.details,
					tags: this.tags,
					match_name: this.form.match_name,
					match_detail: this.form.match_detail,
					match_time: matchTimeForBackend,
					is_end: this.form.is_end
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
							title: res.data.message || '操作失败',
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
	/* 样式保持不变 */
	.fishing-service-edit {
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

		.textarea {
			min-height: 160rpx;
		}

		.selector {
			display: flex;
			justify-content: space-between;
			align-items: center;

			.placeholder {
				color: #999;
			}
		}

		.radio-group {
			display: flex;
			gap: 40rpx;

			.radio-label {
				display: flex;
				align-items: center;
				gap: 12rpx;
				font-size: 28rpx;
				color: #333;
			}
		}

		&.inline {
			display: flex;
			align-items: center;
			justify-content: space-between;

			.label {
				margin-bottom: 0;
			}
		}
	}

	.image-list {
		display: flex;
		flex-wrap: wrap;
		gap: 20rpx;

		.image-item {
			position: relative;
			width: 180rpx;
			height: 180rpx;
			border-radius: 12rpx;
			overflow: hidden;

			.cover-img {
				width: 100%;
				height: 100%;
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

		.upload-btn {
			width: 180rpx;
			height: 180rpx;
			background: #fafafa;
			border-radius: 12rpx;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			border: 1rpx dashed #ccc;

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
		display: block;
	}

	.tag-list {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
		margin-top: 16rpx;

		.tag {
			background: #f0f0f0;
			padding: 8rpx 20rpx;
			border-radius: 60rpx;
			font-size: 26rpx;
			color: #5d7291;
		}
	}

	.competition-fields {
		margin-top: 10rpx;
		border-top: 1rpx solid #eee;
		padding-top: 20rpx;
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