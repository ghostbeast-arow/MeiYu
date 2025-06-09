import request from '../utils/request'

// 诗词详情页面的 API
export const detailAPI = {
  // 获取诗词详情
  getPoetryDetail: (params) => {
    return request({
      url: '/poetry/detail',
      data: params
    })
  },

  // 生成内容
  generateContent: (type, data) => {
    return request({
      url: `/generate/${type}`,
      method: 'POST',
      data
    })
  }
} 