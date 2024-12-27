import { defineStore } from 'pinia'
import request from '@/utils/request'

export const useStatisticsStore = defineStore('statistics', {
  state: () => ({
    // 状态
  }),

  actions: {
    getStatistics() {
      return request({
        url: '/api/statistics',
        method: 'get'
      })
    },

    getTrafficTrend(params) {
      return request({
        url: '/api/statistics/traffic',
        method: 'get',
        params
      })
    },

    getResourceDistribution(params) {
      return request({
        url: '/api/statistics/distribution',
        method: 'get',
        params
      })
    },

    getRecentOrders() {
      return request({
        url: '/api/statistics/orders',
        method: 'get'
      })
    },

    getSystemAlerts() {
      return request({
        url: '/api/statistics/alerts',
        method: 'get'
      })
    }
  }
})
