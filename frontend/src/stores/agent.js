import { defineStore } from 'pinia'
import request from '@/utils/request'

export const useAgentStore = defineStore('agent', {
  state: () => ({
    // 状态
  }),

  actions: {
    getAgentOptions() {
      return request({
        url: '/api/agents/options',
        method: 'get'
      })
    }
  }
})
