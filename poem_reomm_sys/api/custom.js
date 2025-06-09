import request from '../utils/request'

export const customAPI = {
  // 生成内容
  generateContent: (type, data) => {
    return request({
      url: `/generate/${type}`,
      method: 'POST',
      data
    })
  },

  // 下载内容
  downloadContent: (url) => {
    return new Promise((resolve, reject) => {
      wx.downloadFile({
        url,
        success: (res) => {
          if (res.statusCode === 200) {
            wx.saveFile({
              tempFilePath: res.tempFilePath,
              success: resolve,
              fail: reject
            })
          } else {
            reject(new Error('下载失败'))
          }
        },
        fail: reject
      })
    })
  }
} 