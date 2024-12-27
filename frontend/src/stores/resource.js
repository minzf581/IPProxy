import { defineStore } from 'pinia'
import request from '@/utils/request'

export const useResourceStore = defineStore('resource', {
  state: () => ({
    // 状态
  }),

  actions: {
    // 动态资源相关
    getDynamicResources(params) {
      return request({
        url: '/api/resources/dynamic',
        method: 'get',
        params
      })
    },

    openDynamicResource(data) {
      return request({
        url: '/api/resources/dynamic',
        method: 'post',
        data
      })
    },

    renewDynamicResource(data) {
      return request({
        url: '/api/resources/dynamic/renew',
        method: 'post',
        data
      })
    },

    addDynamicTraffic(data) {
      return request({
        url: '/api/resources/dynamic/traffic',
        method: 'post',
        data
      })
    },

    getDynamicPassword(id) {
      return request({
        url: `/api/resources/dynamic/${id}/password`,
        method: 'get'
      })
    },

    // 静态资源相关
    getStaticResources(params) {
      return request({
        url: '/api/resources/static',
        method: 'get',
        params
      })
    },

    openStaticResource(data) {
      return request({
        url: '/api/resources/static',
        method: 'post',
        data
      })
    },

    renewStaticResource(data) {
      return request({
        url: '/api/resources/static/renew',
        method: 'post',
        data
      })
    },

    getStaticPassword(id) {
      return request({
        url: `/api/resources/static/${id}/password`,
        method: 'get'
      })
    },

    releaseStaticResource(id) {
      return request({
        url: `/api/resources/static/${id}`,
        method: 'delete'
      })
    },

    checkStaticIp(ip) {
      return request({
        url: '/api/resources/static/check-ip',
        method: 'get',
        params: { ip }
      })
    }
  }
})
