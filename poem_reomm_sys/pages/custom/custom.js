import { customAPI } from '../../api/custom'
const baseURL = 'http://127.0.0.1:5000'

Page({
  data: {
    title: '',
    content: '',
    generatedContent: '',
    contentType: '',
    contentTypeText: ''
  },

  onLoad() {
    this.setData({ isLoading: false })
  },

  handleTitleInput(e) {
    this.setData({
      title: e.detail.value
    })
  },

  handleContentInput(e) {
    this.setData({
      content: e.detail.value
    })
  },

  async handleGenerate(e) {
    const type = e.currentTarget.dataset.type
    const { title, content } = this.data
    
    if (!title || !content) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '生成中...' })
    try {
      const res = await customAPI.generateContent(type, {
        title,
        content
      })
      
      this.setData({
        generatedContent: `${baseURL}${res.data.url}`,
        contentType: type,
        contentTypeText: type === 'image' ? '图片' : type === 'audio' ? '音频' : '视频'
      })
    } catch (err) {
      console.error('Generate error:', err)
      wx.showToast({
        title: err.message || '生成失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  handleDownload() {
    if (!this.data.generatedContent) return
    
    wx.showLoading({ title: '下载中...' })
    customAPI.downloadContent(this.data.generatedContent)
      .then(res => {
        wx.showToast({
          title: '下载成功',
          icon: 'success'
        })
      })
      .catch(err => {
        wx.showToast({
          title: '下载失败',
          icon: 'none'
        })
      })
      .finally(() => {
        wx.hideLoading()
      })
  },

  onError(error) {
    console.error('页面错误：', error);
    wx.showToast({
      title: '页面出错，请重试',
      icon: 'none'
    });
  },

  onShow() {
    console.log('页面显示');
  },

  onHide() {
    console.log('页面隐藏');
  },

  onUnload() {
    console.log('页面卸载');
  }
}) 