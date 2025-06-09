// app.js
App({
  globalData: {
    isLoggedIn: false
  },

  onLaunch() {
    // 检查登录状态
    wx.checkSession({
      success: () => {
        const token = wx.getStorageSync('token')
        if (token) {
          this.globalData.isLoggedIn = true
        }
      },
      fail: () => {
        // session 已过期，需要重新登录
        this.globalData.isLoggedIn = false
        wx.removeStorageSync('token')
      }
    })
  },

  onError(err) {
    console.error('App Error:', err)
    wx.hideLoading()
  }
})
