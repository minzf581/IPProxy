import {
  DashboardOutlined,
  UserOutlined,
  OrderedListOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons';

// 管理员菜单配置
export const adminMenuConfig = [
  {
    key: 'dashboard',
    label: '仪表盘',
    icon: <DashboardOutlined />,
    path: '/dashboard'
  },
  {
    key: 'account',
    label: '账户管理',
    icon: <TeamOutlined />,
    children: [
      {
        key: 'account/agent',
        label: '代理商管理',
        path: '/account/agent'
      },
      {
        key: 'account/users',
        label: '用户管理',
        path: '/account/users'
      }
    ]
  },
  {
    key: 'order',
    label: '订单管理',
    icon: <OrderedListOutlined />,
    children: [
      {
        key: 'order/dynamic',
        label: '动态订单',
        path: '/order/dynamic'
      },
      {
        key: 'order/static',
        label: '静态订单',
        path: '/order/static'
      },
      {
        key: 'order/agent',
        label: '代理订单',
        path: '/order/agent'
      }
    ]
  },
  {
    key: 'settings',
    label: '系统设置',
    icon: <SettingOutlined />,
    path: '/settings'
  }
];

// 代理商菜单配置
export const agentMenuConfig = [
  {
    key: 'dashboard',
    label: '仪表盘',
    icon: <DashboardOutlined />,
    path: '/dashboard'
  },
  {
    key: 'users',
    label: '用户管理',
    icon: <UserOutlined />,
    path: '/users'
  },
  {
    key: 'order',
    label: '订单管理',
    icon: <OrderedListOutlined />,
    children: [
      {
        key: 'order/dynamic',
        label: '动态订单',
        path: '/order/dynamic'
      },
      {
        key: 'order/static',
        label: '静态订单',
        path: '/order/static'
      },
      {
        key: 'order/balance',
        label: '额度记录',
        path: '/order/balance'
      }
    ]
  },
  {
    key: 'settings',
    label: '系统设置',
    icon: <SettingOutlined />,
    path: '/settings'
  }
]; 