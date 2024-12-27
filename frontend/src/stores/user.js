import { defineStore } from 'pinia'
import request from '@/utils/request'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token'),
    userInfo: JSON.parse(localStorage.getItem('userInfo') || '{}')
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    userName: (state) => state.userInfo.username || '',
    userAvatar: (state) => state.userInfo.avatar || ''
  },

  actions: {
    // 登录
    async login(data) {
      try {
        const res = await request({
          url: '/api/auth/login',
          method: 'post',
          data
        })
        
        const { token, user } = res.data
        this.token = token
        this.userInfo = user
        
        localStorage.setItem('token', token)
        localStorage.setItem('userInfo', JSON.stringify(user))
        
        return res
      } catch (error) {
        this.clearAuth()
        throw error
      }
    },

    // 登出
    async logout() {
      try {
        await request({
          url: '/api/auth/logout',
          method: 'post'
        })
      } catch (error) {
        console.error('登出失败:', error)
      } finally {
        this.clearAuth()
      }
    },

    // 获取用户信息
    async getUserInfo() {
      try {
        const res = await request({
          url: '/api/users/info',
          method: 'get'
        })
        
        this.userInfo = res.data
        localStorage.setItem('userInfo', JSON.stringify(res.data))
        
        return res
      } catch (error) {
        this.clearAuth()
        throw error
      }
    },

    // 更新用户信息
    async updateUserInfo(data) {
      const res = await request({
        url: '/api/users/info',
        method: 'put',
        data
      })
      
      this.userInfo = { ...this.userInfo, ...data }
      localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
      
      return res
    },

    // 修改密码
    async changePassword(data) {
      return request({
        url: '/api/users/password',
        method: 'put',
        data
      })
    },

    // 清除认证信息
    clearAuth() {
      this.token = null
      this.userInfo = {}
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    }
  }
})
