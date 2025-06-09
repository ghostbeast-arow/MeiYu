import { databaseAPI } from '../../api/database'

Page({
  data: {
    selectedGrade: '',
    selectedDynasty: '',
    selectedAuthor: '',
    poetryList: [],
    currentPage: 1,
    per_page: 10,
    total: 0,
    isLoading: false,
    isLoadingMore: false,
    isRefreshing: false,
    hasMore: true,
    
    // 选项数据
    gradeOptions: [],
    dynastyOptions: [],
    authorOptions: [],
    
    // 选择器相关
    showPicker: false,
    pickerType: '',
    pickerTitle: '',
    pickerItems: [],
    pickerValue: [0],
    tempSelection: ''
  },

  async onLoad() {
    await this.loadInitialData()
  },

  // 加载初始数据和选项
  async loadInitialData() {
    wx.showLoading({ title: '加载中...' })
    try {
      // 获取所有选项数据
      const optionsRes = await databaseAPI.getOptions()
      const { grades, dynasties, authors } = optionsRes.data

      // 为每个选项添加"全部"选项
      this.setData({
        gradeOptions: [{ id: 0, name: '全部' }, ...grades],
        dynastyOptions: [{ id: 0, name: '全部' }, ...dynasties],
        authorOptions: [{ id: 0, name: '全部' }, ...authors]
      })

      // 加载诗词列表
      await this.loadPoetryList()
    } catch (err) {
      console.error('Load initial data error:', err)
      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 打开选择器
  openPicker(e) {
    const type = e.currentTarget.dataset.type
    let items = []
    let title = ''
    
    switch (type) {
      case 'grade':
        items = this.data.gradeOptions
        title = '选择年级'
        break
      case 'dynasty':
        items = this.data.dynastyOptions
        title = '选择朝代'
        break
      case 'author':
        items = this.data.authorOptions
        title = '选择作者'
        break
    }
    
    this.setData({
      showPicker: true,
      pickerType: type,
      pickerTitle: title,
      pickerItems: items,
      pickerValue: [0],
      tempSelection: this.data[`selected${type.charAt(0).toUpperCase() + type.slice(1)}`]
    })
  },

  // 选择器变化处理
  onPickerChange(e) {
    const index = e.detail.value[0]
    this.setData({
      tempSelection: this.data.pickerItems[index].name
    })
  },

  // 确认选择
  async confirmPicker() {
    const { pickerType, tempSelection } = this.data
    const key = `selected${pickerType.charAt(0).toUpperCase() + pickerType.slice(1)}`
    
    this.setData({
      [key]: tempSelection,
      showPicker: false
    })
    
    // 重新加载诗词列表
    await this.loadPoetryList(1)
  },

  // 关闭选择器
  closePicker() {
    this.setData({
      showPicker: false,
      tempSelection: ''
    })
  },

  // 加载诗词列表
  async loadPoetryList(page = 1) {
    if (this.data.isLoading) return
    
    if (page === 1) {
      wx.showLoading({ title: '加载中...' })
    }
    
    try {
      this.setData({ isLoading: true })
      
      const res = await databaseAPI.getPoetryList({
        page,
        per_page: this.data.per_page,
        grade: this.data.selectedGrade === '全部' ? '' : this.data.selectedGrade,
        dynasty: this.data.selectedDynasty === '全部' ? '' : this.data.selectedDynasty,
        author: this.data.selectedAuthor === '全部' ? '' : this.data.selectedAuthor
      })
      
      const poetryList = page === 1 ? res.data.items : [...this.data.poetryList, ...res.data.items]
      
      this.setData({
        poetryList,
        total: res.data.total,
        currentPage: page,
        hasMore: poetryList.length < res.data.total,
        isLoading: false,
        isLoadingMore: false,
        isRefreshing: false
      })
    } catch (err) {
      console.error('Load poetry list error:', err)
      this.setData({ 
        isLoading: false,
        isLoadingMore: false,
        isRefreshing: false,
        poetryList: page === 1 ? [] : this.data.poetryList
      })
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    } finally {
      if (page === 1) {
        wx.hideLoading()
      }
      wx.stopPullDownRefresh()
    }
  },

  // 下拉刷新
  async onRefresh() {
    if (this.data.isRefreshing) return
    this.setData({ isRefreshing: true })
    await this.loadPoetryList(1)
  },

  // 加载更多
  async onLoadMore() {
    if (this.data.isLoadingMore || !this.data.hasMore) return
    this.setData({ isLoadingMore: true })
    await this.loadPoetryList(this.data.currentPage + 1)
  },

  // 跳转到详情页
  navigateToDetail(e) {
    const index = e.currentTarget.dataset.index
    const poetry = this.data.poetryList[index]
    wx.navigateTo({
      url: `/pages/detail/detail?title=${encodeURIComponent(poetry.title)}&author=${encodeURIComponent(poetry.author)}`
    })
  }
}) 