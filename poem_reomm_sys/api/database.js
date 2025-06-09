import request from '../utils/request'

// 添加防抖函数
const debounce = (fn, delay = 300) => {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

// 诗词数据库页面的 API
export const databaseAPI = {
  // 获取所有选项数据
  getOptions: () => {
    return request({
      url: '/poetry/options'
    })
  },

  // 获取诗词列表
  getPoetryList: (params) => {
    return request({
      url: '/poetry/list',
      data: params
    })
  }
} 