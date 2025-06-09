const baseURL = 'http://127.0.0.1:5000'

const request = (options) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: baseURL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          if (res.data.code === 200) {
            resolve(res.data)
          } else {
            reject(new Error(res.data.message || '请求失败'))
          }
        } else if (res.statusCode === 401) {
          // 清除本地存储的登录信息
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          
          // 跳转到登录页
          wx.redirectTo({
            url: '/pages/index/index'
          })
          reject(new Error('登录已过期，请重新登录'))
        } else {
          reject(new Error(`${res.statusCode} ${res.data.message || '请求失败'}`))
        }
      },
      fail: (err) => {
        console.error('Request Failed:', err)
        reject(new Error('网络错误，请检查网络连接'))
      }
    })
  }).catch(err => {
    console.error('Request Error:', err)
    throw err
  })
}

export default request 