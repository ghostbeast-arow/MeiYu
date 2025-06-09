// index.js
import { indexAPI } from '../../api/index'

const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
const app = getApp()

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    hotPoetryList: [],
    isRefreshing: false,
    showIntro: false,
    currentIntroPage: 0,
    introPages: [
      "你好呀！我是一个AI古诗词小程序，可以推荐古诗词，并根据古诗词生成优美的音乐、图片和视频。我就像一位活泼的小小文学家，随时准备带你领略诗词之美！",
      "每当你感到困惑时，我会精心挑选最适合的古诗词与你分享。不仅如此，我还能把诗词变成悦耳的音乐、唯美的图片，甚至是生动的视频！",
      "我最擅长的是理解诗词的意境和情感。比如'床前明月光'，我就能想象出皎洁的月光洒在地上的美景，然后把它变成一幅唯美的画面。",
      "和我一起学习古诗词，保证让你觉得既有趣又轻松！我会用现代的方式演绎传统文化，让每一首诗都活起来！让我们一起开启这段奇妙的诗词之旅吧～"
    ]
  },

  onLoad() {
    // 检查登录状态
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    if (token && userInfo) {
      this.setData({ 
        isLoggedIn: true,
        userInfo: userInfo
      })
      this.loadHotPoetry()
    }
  },

  // 加载热点诗词
  async loadHotPoetry() {
    try {
      const res = await indexAPI.getHotPoetry(5)
      console.log('Hot Poetry Data:', res.data)
      
      const poetryList = res.data?.items || []
      
      if (!poetryList.length) {
        this.setData({ 
          hotPoetryList: [],
          isRefreshing: false
        })
        wx.showToast({
          title: '暂无热门诗词',
          icon: 'none'
        })
        return
      }
      
      this.setData({
        hotPoetryList: poetryList,
        isRefreshing: false
      })
    } catch (err) {
      console.error('Failed to load hot poetry:', err)
      this.setData({ 
        hotPoetryList: [],
        isRefreshing: false
      })
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    }
  },

  // 下拉刷新处理
  async onRefresh() {
    if (this.data.isRefreshing) return
    this.setData({ isRefreshing: true })
    await this.loadHotPoetry()
  },

  handleLogin() {
    // 先检查用户是否已授权
    wx.getSetting({
      success: (settingRes) => {
        if (!settingRes.authSetting['scope.userInfo']) {
          // 如果未授权，先请求用户授权
          wx.showModal({
            title: '需要您的授权',
            content: '我们需要获取您的基本信息来提供更好的服务体验',
            success: (modalRes) => {
              if (modalRes.confirm) {
                this.requestUserProfile()
              } else {
                wx.showToast({
                  title: '需要授权才能使用完整功能',
                  icon: 'none'
                })
              }
            }
          })
        } else {
          // 已授权，直接获取用户信息
          this.requestUserProfile()
        }
      }
    })
  },

  // 请求用户信息
  requestUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (userRes) => {
        wx.showLoading({ title: '登录中...' })
        
        // 获取登录码
        wx.login({
          success: async (loginRes) => {
            try {
              if (!loginRes.code) {
                throw new Error('获取登录码失败')
              }

              // 调用后端登录接口
              const loginResult = await indexAPI.login({
                code: loginRes.code,
                encryptedData: userRes.encryptedData,
                iv: userRes.iv
              })

              if (loginResult.data.success) {
                this.handleLoginSuccess(loginResult)
                // 保存授权状态
                wx.setStorageSync('hasUserAuth', true)
              } else {
                throw new Error(loginResult.data.message || '登录失败')
              }
            } catch (err) {
              console.error('Login failed:', err)
              wx.showToast({
                title: err.message || '登录失败，请重试',
                icon: 'none'
              })
            } finally {
              wx.hideLoading()
            }
          },
          fail: (err) => {
            console.error('wx.login failed:', err)
            wx.hideLoading()
            wx.showToast({
              title: '登录失败，请重试',
              icon: 'none'
            })
          }
        })
      },
      fail: (err) => {
        console.error('Get user profile failed:', err)
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        })
      }
    })
  },

  navigateToPoetry() {
    wx.navigateTo({
      url: '/pages/detail/detail'
    })
  },

  navigateToGenerator(e) {
    const type = e.currentTarget.dataset.type
    wx.navigateTo({
      url: `/pages/generator/generator?type=${type}`
    })
  },

  navigateToDetail(e) {
    const index = e.currentTarget.dataset.index
    const poetry = this.data.hotPoetryList[index]
    
    wx.navigateTo({
      url: `/pages/detail/detail?title=${encodeURIComponent(poetry.title)}&author=${encodeURIComponent(poetry.author)}`
    })
  },

  showIntroduction() {
    this.setData({
      showIntro: true,
      currentIntroPage: 0
    })
  },

  closeIntroduction() {
    this.setData({
      showIntro: false
    })
  },

  handleIntroSwiperChange(e) {
    this.setData({
      currentIntroPage: e.detail.current
    })
  },

  navigateToDatabase() {
    wx.navigateTo({
      url: '/pages/database/database',
      fail: (err) => {
        console.error('导航失败：', err)
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        })
      }
    })
  },

  navigateToCustom() {
    console.log('准备跳转到自定义诗词页面');
    wx.navigateTo({
      url: '/pages/custom/custom',
      success: (res) => {
        console.log('跳转成功', res);
      },
      fail: (err) => {
        console.error('跳转失败', err);
        // 显示具体错误信息
        wx.showToast({
          title: '跳转失败：' + err.errMsg,
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 登录成功后的处理
  handleLoginSuccess(loginResult) {
    // 保存登录信息
    wx.setStorageSync('token', loginResult.data.token)
    wx.setStorageSync('userInfo', loginResult.data.userInfo)
    
    // 先更新登录态
    this.setData({ 
      isLoggedIn: true,
      userInfo: loginResult.data.userInfo
    }, () => {
      // 登录状态更新后再加载数据
      this.loadHotPoetry()
    })

    // 首次登录显示介绍
    if (!wx.getStorageSync('hasShownIntro')) {
      setTimeout(() => {
        this.setData({
          showIntro: true,
          currentIntroPage: 0
        })
        wx.setStorageSync('hasShownIntro', true)
      }, 1000)
    }
  },

  navigateToPage(e) {
    const page = e.currentTarget.dataset.page
    wx.navigateTo({
      url: `/pages/${page}/${page}`
    })
  }
})
