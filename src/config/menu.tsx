import {
  DashboardOutlined,
  UserOutlined,
  OrderedListOutlined,
  SettingOutlined,
  TeamOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
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
    key: 'products',
    label: '产品管理',
    icon: <AppstoreOutlined />,
    children: [
      {
        key: 'products/dynamic',
        label: '动态代理',
        path: '/products/dynamic'
      },
      {
        key: 'products/static',
        label: '静态代理',
        path: '/products/static'
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

// 代理商和用户菜单配置
export const businessMenuConfig = [
  {
    key: 'dashboard',
    label: '仪表盘',
    icon: <DashboardOutlined />,
    path: '/dashboard'
  },
  {
    key: 'business',
    label: '业务开通',
    icon: <ShoppingCartOutlined />,
    children: [
      {
        key: 'business/dynamic',
        label: '动态代理业务',
        path: '/business/dynamic'
      },
      {
        key: 'business/static',
        label: '静态代理业务',
        path: '/business/static'
      }
    ]
  },
  {
    key: 'products',
    label: '产品管理',
    icon: <AppstoreOutlined />,
    children: [
      {
        key: 'products/dynamic',
        label: '动态代理',
        path: '/products/dynamic'
      },
      {
        key: 'products/static',
        label: '静态代理',
        path: '/products/static'
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