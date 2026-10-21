<template>
  <view class="edit-shop">
    <u-navbar title="编辑店铺信息" :bgColor="'#5d7291'" :title-color="'#fff'" :back-text="'返回'"></u-navbar>
    <view class="form-card">
      <view class="form-item">
        <view class="label">店铺头像</view>
        <view class="upload-box" @click="chooseAvatar">
          <image v-if="form.avatar" :src="getImageUrl(form.avatar)" mode="aspectFill" class="avatar-img" />
          <view v-else class="upload-icon">
            <u-icon name="plus" size="40" color="#ccc" />
            <text>上传头像</text>
          </view>
        </view>
      </view>
	  
      <view class="form-item">
        <view class="label">店铺名称</view>
        <textarea 
          class="input" 
          v-model="form.shopName" 
          placeholder="请输入店铺名称"
          :auto-height="true"
          :show-confirm-bar="false"
          style="min-height: 50rpx;"
        />
      </view>
	  
      <view class="form-item">
        <view class="label">店铺简介</view>
        <textarea class="textarea" v-model="form.description" placeholder="请输入店铺简介" :auto-height="true" />
      </view>
      <view class="form-item">
        <view class="label">店铺介绍</view>
        <textarea class="textarea" v-model="form.intro" placeholder="请输入店铺介绍" :auto-height="true" />
      </view>
      <view class="form-item">
        <view class="label">介绍图片（多图）</view>
        <view class="detail-images">
          <view v-for="(img, idx) in form.introImages" :key="idx" class="detail-img-item">
            <image :src="getImageUrl(img)" mode="aspectFill" class="detail-img" />
            <view class="delete-icon" @click="removeIntroImage(idx)">
              <u-icon name="close" size="20" color="#fff" />
            </view>
          </view>
          <view class="upload-detail-btn" @click="chooseIntroImage">
            <u-icon name="plus" size="32" color="#999" />
            <text>添加图片</text>
          </view>
        </view>
      </view>
      <button class="submit-btn" @click="submitForm" :loading="submitting">保存修改</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      form: {
        avatar: '',
        shopName: '',
        description: '',
        intro: '',
        introImages: []
      },
      submitting: false,
      baseUrl: uni.$baseUrl
    }
  },
  onLoad() {
    this.fetchShopInfo()
  },
  methods: {
    getImageUrl(url) {
      if (!url) return ''
      if (url.startsWith('http') || url.startsWith('data:')) return url
      return this.baseUrl + url
    },
    async fetchShopInfo() {
      const merchantId = this.$store.state.vuex_user_info?.id
      const res = await uni.request({
        url: `${uni.$baseUrl}/api/shop/info?merchantId=${merchantId}`,
        method: 'GET'
      })
      if (res[1].data.code === 0) {
        this.form = res[1].data.data
      }
    },
    async uploadImage(filePath) {
      uni.showLoading({ title: '上传中...' })
      try {
        const [err, uploadRes] = await uni.uploadFile({
          url: `${this.baseUrl}/api/upload`,
          filePath: filePath,
          name: 'file'
        })
        uni.hideLoading()
        if (err) throw err
        const result = JSON.parse(uploadRes.data)
        if (result.code === 0) {
          return result.data.url
        } else {
          uni.showToast({ title: '上传失败', icon: 'none' })
          return null
        }
      } catch (error) {
        console.error('上传失败', error)
        uni.showToast({ title: '上传失败', icon: 'none' })
        return null
      }
    },
    chooseAvatar() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: async (res) => {
          const url = await this.uploadImage(res.tempFiles[0].path)
          if (url) this.form.avatar = url
        }
      })
    },
    chooseIntroImage() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: async (res) => {
          const url = await this.uploadImage(res.tempFiles[0].path)
          if (url) this.form.introImages.push(url)
        }
      })
    },
    removeIntroImage(index) {
      this.form.introImages.splice(index, 1)
    },
    async submitForm() {
      if (!this.form.shopName) return uni.showToast({ title: '请填写店铺名称', icon: 'none' })
      const merchantId = this.$store.state.vuex_user_info?.id
      this.submitting = true
      const res = await uni.request({
        url: uni.$baseUrl + '/api/shop/info',
        method: 'PUT',
        data: { merchantId, ...this.form }
      })
      this.submitting = false
      if (res[1].data.code === 0) {
        uni.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => uni.navigateBack(), 1500)
      } else {
        uni.showToast({ title: res[1].data.message, icon: 'none' })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// 核心修改1：移除外层padding，背景改为白色，铺满全屏
.edit-shop {
  background: #fff; // 原#f5f5f5改为白色
  min-height: 100vh;
  padding: 0 !important; // 移除所有内边距
  box-sizing: border-box;
}

// 核心修改2：移除表单卡片的内边距，保留圆角（可选）
.form-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 0 30rpx !important; // 仅保留左右少量间距，上下无间距（如需完全无间距则设为0）
  box-sizing: border-box;
}

.form-item {
  margin-bottom: 40rpx;
  padding-top: 30rpx; // 补充顶部间距，避免内容贴顶
  .label {
    font-size: 28rpx;
    font-weight: 500;
    margin-bottom: 20rpx;
    color: #333;
  }
  // 核心修改3：强化input可交互属性，修复无法输入问题
  .input {
    background: #f9f9f9;
    border-radius: 16rpx;
    padding: 20rpx;
    width: 100%;
    box-sizing: border-box;
    font-size: 28rpx;
    color: #333;
    border: none;
    pointer-events: auto !important; // 强制可点击
    z-index: 999 !important; // 提高层级，避免被遮挡
    appearance: none; // 移除原生样式干扰
    outline: none; // 移除聚焦外边框
  }
  .textarea {
    background: #f9f9f9;
    border-radius: 16rpx;
    padding: 20rpx;
    width: 100%;
    box-sizing: border-box;
    font-size: 28rpx;
    color: #333;
    border: none;
    pointer-events: auto;
    z-index: 2;
    min-height: 160rpx;
  }
  .upload-box {
    width: 160rpx;
    height: 160rpx;
    background: #f9f9f9;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 1rpx solid #eee;
    .avatar-img {
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
        background: rgba(0,0,0,0.5);
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
}

.submit-btn {
  background: #f38b11;
  color: #fff;
  border-radius: 60rpx;
  height: 88rpx;
  line-height: 88rpx;
  font-size: 32rpx;
  margin-top: 60rpx;
  margin-bottom: 30rpx; // 补充底部间距，避免按钮贴底
  width: 100%;
  border: none;
}
</style>