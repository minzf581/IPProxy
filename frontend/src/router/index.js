import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue'

const routes = [
  {
    path: '/login',
    component: () => import('@/views/login/index.vue'),
    hidden: true
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '首页', icon: 'dashboard' }
      }
    ]
  },
  {
    path: '/user',
    component: Layout,
    redirect: '/user/list',
    meta: { title: '用户管理', icon: 'user' },
    children: [
      {
        path: 'list',
        name: 'UserList',
        component: () => import('@/views/user/list.vue'),
        meta: { title: '用户列表' }
      },
      {
        path: 'dynamic',
        name: 'DynamicResource',
        component: () => import('@/views/user/dynamic.vue'),
        meta: { title: '动态资源管理' }
      },
      {
        path: 'static',
        name: 'StaticResource',
        component: () => import('@/views/user/static.vue'),
        meta: { title: '静态资源管理' }
      }
    ]
  },
  {
    path: '/agent',
    component: Layout,
    redirect: '/agent/list',
    meta: { title: '代理商管理', icon: 'shop' },
    children: [
      {
        path: 'list',
        name: 'AgentList',
        component: () => import('@/views/agent/list.vue'),
        meta: { title: '代理商列表' }
      },
      {
        path: 'resource',
        name: 'AgentResource',
        component: () => import('@/views/agent/resource.vue'),
        meta: { title: '资源管理' }
      }
    ]
  },
  {
    path: '/resource',
    component: Layout,
    redirect: '/resource/dynamic',
    meta: { title: '资源开通', icon: 'connection' },
    children: [
      {
        path: 'dynamic',
        name: 'OpenDynamic',
        component: () => import('@/views/resource/dynamic.vue'),
        meta: { title: '动态IP开通' }
      },
      {
        path: 'static',
        name: 'OpenStatic',
        component: () => import('@/views/resource/static.vue'),
        meta: { title: '静态IP开通' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
