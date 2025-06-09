import request from '../utils/request'

export const indexAPI = {
  // 登录接口
  login: (data) => {
    return request({
      url: '/user/login',
      method: 'POST',
      data
    })
  },

  // 获取热点诗词
  getHotPoetry: (limit = 5) => {
    return request({
      url: '/poetry/hot',
      data: { limit }
    })
  }
} 