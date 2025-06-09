// pages/detail/detail.js
import { detailAPI } from '../../api/detail'
const baseURL = 'http://127.0.0.1:5000'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    generatedContent: '',
    contentType: '',
    contentTypeText: '',
    currentPoetry: {},
    isPlaying: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    const { title, author } = options
    if (!title || !author) return
    
    try {
      console.log('Loading poetry with:', { title: decodeURIComponent(title), author: decodeURIComponent(author) })
      const res = await detailAPI.getPoetryDetail({
        title: decodeURIComponent(title),
        author: decodeURIComponent(author)
      })
      console.log('Poetry detail response:', res)

      // 直接使用后端返回的数据，进行字段映射
      this.setData({
        currentPoetry: {
          title: res.data.title, 
          author: res.data.author,
          dynasty: res.data.dynasty,
          content: res.data.content,
          grade: res.data.grade
        }
      })
    } catch (err) {
      console.error('Load detail error:', err)
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none'
      })
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    if (this.audioContext) {
      this.audioContext.destroy()
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadPoetryList(1)
    wx.stopPullDownRefresh()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  // 添加生成功能的处理方法
  async handleGenerate(e) {
    const type = e.currentTarget.dataset.type
    const { currentPoetry } = this.data
    
    if (!currentPoetry) {
      wx.showToast({
        title: '诗词数据加载失败',
        icon: 'none'
      })
      return
    }

    if (type !== this.data.contentType && this.audioContext) {
      this.audioContext.destroy()
      this.audioContext = null
      this.setData({ isPlaying: false })
    }

    wx.showLoading({ title: '生成中...' })
    try {
      console.log('Generating content:', { type, poetry: currentPoetry })
      const res = await detailAPI.generateContent(type, {
        title: currentPoetry.title,
        content: currentPoetry.content,
        author: currentPoetry.author
      })
      console.log('Generated content:', res.data)
      
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

  // 添加下载功能
  handleDownload() {
    const url = this.data.generatedContent
    if (!url) {
      wx.showToast({
        title: '没有可下载的内容',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '下载中...' })
    wx.downloadFile({
      url: url,
      success: (res) => {
        if (res.statusCode === 200) {
          wx.saveFile({
            tempFilePath: res.tempFilePath,
            success: () => {
              wx.showToast({
                title: '保存成功',
                icon: 'success'
              })
            },
            fail: () => {
              wx.showToast({
                title: '保存失败',
                icon: 'none'
              })
            }
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '下载失败',
          icon: 'none'
        })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  // 处理音频播放/暂停
  handleAudioPlay() {
    if (!this.audioContext) {
      this.audioContext = wx.createInnerAudioContext()
      this.audioContext.src = this.data.generatedContent
      
      // 监听播放结束
      this.audioContext.onEnded(() => {
        this.setData({ isPlaying: false })
      })
      
      // 监听错误
      this.audioContext.onError((err) => {
        console.error('Audio playback error:', err)
        wx.showToast({
          title: '音频播放失败',
          icon: 'none'
        })
        this.setData({ isPlaying: false })
      })
    }

    if (this.data.isPlaying) {
      this.audioContext.pause()
      this.setData({ isPlaying: false })
    } else {
      this.audioContext.play()
      this.setData({ isPlaying: true })
    }
  }
})