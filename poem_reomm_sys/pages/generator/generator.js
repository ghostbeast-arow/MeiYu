// pages/generator/generator.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    type: '', // image, audio, video
    generationType: '',
    poetry: null,
    isGenerating: true,
    generatedContent: '',
    error: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const { type, poetry } = options
    const typeMap = {
      'image': '图片',
      'audio': '音乐',
      'video': '视频'
    }

    this.setData({
      type,
      generationType: typeMap[type],
      poetry: JSON.parse(decodeURIComponent(poetry))
    })

    this.generateContent()
  },

  generateContent() {
    const { type, poetry } = this.data
    
    this.setData({ isGenerating: true })
    
    console.log('Generating Content Request:', {
      type,
      poetry
    })
    
    wx.request({
      url: `http://127.0.0.1:5000/generate/${type}`,
      method: 'POST',
      data: {
        title: poetry.title,
        content: poetry.content,
        author: poetry.author
      },
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        console.log('Raw Response:', res)
        
        try {
          const responseData = res.data
          console.log('Parsed Response:', responseData)
          
          if (responseData && responseData.url) {
            const fileUrl = `http://127.0.0.1:5000${responseData.url}`
            
            this.setData({
              generatedContent: fileUrl,
              isGenerating: false,
              error: ''
            })

            if (type === 'audio') {
              const audioContext = wx.createInnerAudioContext()
              audioContext.src = fileUrl
              audioContext.play()
            }
          } else if (responseData && responseData.data && responseData.data.url) {
            const fileUrl = `http://127.0.0.1:5000${responseData.data.url}`
            
            this.setData({
              generatedContent: fileUrl,
              isGenerating: false,
              error: ''
            })

            if (type === 'audio') {
              const audioContext = wx.createInnerAudioContext()
              audioContext.src = fileUrl
              audioContext.play()
            }
          } else {
            console.error('Invalid Response Format:', responseData)
            this.setData({
              error: '服务器响应格式错误',
              isGenerating: false
            })
          }
        } catch (error) {
          console.error('Response Parsing Error:', error)
          this.setData({
            error: '响应解析失败',
            isGenerating: false
          })
        }
      },
      fail: (err) => {
        console.error('Request Failed:', err)
        
        this.setData({
          error: '网络请求失败',
          isGenerating: false
        })
        
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      }
    })
  },

  handleDownload() {
    const { type, generatedContent } = this.data
    
    if (!generatedContent) {
      wx.showToast({
        title: '没有可下载的内容',
        icon: 'none'
      })
      return
    }
    
    console.log('Starting Download:', {
      type,
      url: generatedContent
    })

    wx.downloadFile({
      url: generatedContent,
      success: (res) => {
        console.log('Download Response:', res)
        
        if (res.statusCode === 200) {
          const fileType = type === 'image' ? 'png' : 
                          type === 'audio' ? 'mp3' : 'mp4'
          
          wx.saveFile({
            tempFilePath: res.tempFilePath,
            success: (saveRes) => {
              console.log('Save Success:', saveRes)
              wx.showToast({
                title: '保存成功',
                icon: 'success'
              })
            },
            fail: (err) => {
              console.error('Save Failed:', err)
              wx.showToast({
                title: '保存失败: ' + err.errMsg,
                icon: 'none'
              })
            }
          })
        } else {
          console.error('Download Status Error:', res.statusCode)
          wx.showToast({
            title: '下载失败: 状态码 ' + res.statusCode,
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.error('Download Failed:', err)
        wx.showToast({
          title: '下载失败: ' + err.errMsg,
          icon: 'none'
        })
      }
    })
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

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

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

  }
})