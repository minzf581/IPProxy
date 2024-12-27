<template>
  <div class="dashboard-container">
    <!-- 顶部数据卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <template #header>
            <div class="card-header">
              <span>账户余额</span>
              <el-tag type="success">实时</el-tag>
            </div>
          </template>
          <div class="card-body">
            <div class="amount">¥{{ statistics.balance.toFixed(2) }}</div>
            <div class="trend" :class="{ up: statistics.balanceTrend > 0, down: statistics.balanceTrend < 0 }">
              {{ statistics.balanceTrend > 0 ? '+' : '' }}{{ statistics.balanceTrend }}%
              <el-icon><CaretTop v-if="statistics.balanceTrend > 0"/><CaretBottom v-else/></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <template #header>
            <div class="card-header">
              <span>动态资源总量</span>
              <el-tag type="warning">{{ statistics.dynamicTotal }}个</el-tag>
            </div>
          </template>
          <div class="card-body">
            <div class="amount">{{ statistics.dynamicActive }}个</div>
            <div class="subtitle">当前可用</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <template #header>
            <div class="card-header">
              <span>静态资源总量</span>
              <el-tag type="primary">{{ statistics.staticTotal }}个</el-tag>
            </div>
          </template>
          <div class="card-body">
            <div class="amount">{{ statistics.staticActive }}个</div>
            <div class="subtitle">当前可用</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <template #header>
            <div class="card-header">
              <span>本月订单数</span>
              <el-tag type="info">总计</el-tag>
            </div>
          </template>
          <div class="card-body">
            <div class="amount">{{ statistics.monthlyOrders }}</div>
            <div class="trend" :class="{ up: statistics.orderTrend > 0, down: statistics.orderTrend < 0 }">
              {{ statistics.orderTrend > 0 ? '+' : '' }}{{ statistics.orderTrend }}%
              <el-icon><CaretTop v-if="statistics.orderTrend > 0"/><CaretBottom v-else/></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>流量使用趋势</span>
              <el-radio-group v-model="trafficChartType" size="small">
                <el-radio-button label="week">周</el-radio-button>
                <el-radio-button label="month">月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container">
            <v-chart :option="trafficChartOption" autoresize />
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>资源分布</span>
              <el-select v-model="resourceChartType" size="small" style="width: 120px">
                <el-option label="按地区" value="region" />
                <el-option label="按ISP" value="isp" />
              </el-select>
            </div>
          </template>
          <div class="chart-container">
            <v-chart :option="resourceChartOption" autoresize />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 实时监控 -->
    <el-row :gutter="20" class="monitor-row">
      <el-col :span="12">
        <el-card shadow="hover" class="monitor-card">
          <template #header>
            <div class="card-header">
              <span>最近订单</span>
              <el-button type="text" @click="refreshOrders">刷新</el-button>
            </div>
          </template>
          <el-table :data="recentOrders" style="width: 100%" :max-height="300">
            <el-table-column label="订单号" prop="orderId" width="180" />
            <el-table-column label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="row.type === 'dynamic' ? 'success' : 'warning'">
                  {{ row.type === 'dynamic' ? '动态' : '静态' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="金额" prop="amount" width="120">
              <template #default="{ row }">
                ¥{{ row.amount.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getOrderStatusType(row.status)">
                  {{ getOrderStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="时间" prop="createTime">
              <template #default="{ row }">
                {{ formatDate(row.createTime) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="monitor-card">
          <template #header>
            <div class="card-header">
              <span>系统告警</span>
              <el-button type="text" @click="refreshAlerts">刷新</el-button>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(alert, index) in systemAlerts"
              :key="index"
              :type="getAlertType(alert.level)"
              :timestamp="formatDate(alert.time)"
            >
              {{ alert.message }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { formatDate } from '@/utils/format'
import { useStatisticsStore } from '@/stores/statistics'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const statisticsStore = useStatisticsStore()

// 统计数据
const statistics = reactive({
  balance: 0,
  balanceTrend: 0,
  dynamicTotal: 0,
  dynamicActive: 0,
  staticTotal: 0,
  staticActive: 0,
  monthlyOrders: 0,
  orderTrend: 0
})

// 图表配置
const trafficChartType = ref('week')
const resourceChartType = ref('region')

// 流量趋势图配置
const trafficChartOption = reactive({
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['动态资源', '静态资源']
  },
  xAxis: {
    type: 'category',
    data: []
  },
  yAxis: {
    type: 'value',
    name: '流量 (GB)'
  },
  series: [
    {
      name: '动态资源',
      type: 'line',
      smooth: true,
      data: []
    },
    {
      name: '静态资源',
      type: 'line',
      smooth: true,
      data: []
    }
  ]
})

// 资源分布图配置
const resourceChartOption = reactive({
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 'left'
  },
  series: [
    {
      name: '资源分布',
      type: 'pie',
      radius: ['50%', '70%'],
      avoidLabelOverlap: false,
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '20',
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: []
    }
  ]
})

// 最近订单
const recentOrders = ref([])
const systemAlerts = ref([])

// 获取统计数据
const getStatistics = async () => {
  try {
    const { data } = await statisticsStore.getStatistics()
    Object.assign(statistics, data)
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 获取流量趋势数据
const getTrafficTrend = async () => {
  try {
    const { data } = await statisticsStore.getTrafficTrend({
      type: trafficChartType.value
    })
    trafficChartOption.xAxis.data = data.dates
    trafficChartOption.series[0].data = data.dynamic
    trafficChartOption.series[1].data = data.static
  } catch (error) {
    console.error('获取流量趋势数据失败:', error)
  }
}

// 获取资源分布数据
const getResourceDistribution = async () => {
  try {
    const { data } = await statisticsStore.getResourceDistribution({
      type: resourceChartType.value
    })
    resourceChartOption.series[0].data = data
  } catch (error) {
    console.error('获取资源分布数据失败:', error)
  }
}

// 获取最近订单
const getRecentOrders = async () => {
  try {
    const { data } = await statisticsStore.getRecentOrders()
    recentOrders.value = data
  } catch (error) {
    console.error('获取最近订单失败:', error)
  }
}

// 获取系统告警
const getSystemAlerts = async () => {
  try {
    const { data } = await statisticsStore.getSystemAlerts()
    systemAlerts.value = data
  } catch (error) {
    console.error('获取系统告警失败:', error)
  }
}

// 刷新数据
const refreshOrders = () => {
  getRecentOrders()
}

const refreshAlerts = () => {
  getSystemAlerts()
}

// 状态处理函数
const getOrderStatusType = (status) => {
  const types = {
    success: 'success',
    pending: 'warning',
    failed: 'danger'
  }
  return types[status] || 'info'
}

const getOrderStatusText = (status) => {
  const texts = {
    success: '成功',
    pending: '处理中',
    failed: '失败'
  }
  return texts[status] || status
}

const getAlertType = (level) => {
  const types = {
    error: 'danger',
    warning: 'warning',
    info: 'info'
  }
  return types[level] || 'info'
}

// 监听图表类型变化
watch(trafficChartType, () => {
  getTrafficTrend()
})

watch(resourceChartType, () => {
  getResourceDistribution()
})

// 初始化
onMounted(() => {
  getStatistics()
  getTrafficTrend()
  getResourceDistribution()
  getRecentOrders()
  getSystemAlerts()

  // 定时刷新数据
  setInterval(() => {
    getStatistics()
    getRecentOrders()
    getSystemAlerts()
  }, 60000) // 每分钟刷新一次
})
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 20px;
  
  .data-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .card-body {
      text-align: center;
      padding: 20px 0;
      
      .amount {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 10px;
      }
      
      .subtitle {
        color: #666;
        font-size: 14px;
      }
      
      .trend {
        font-size: 14px;
        
        &.up {
          color: #67c23a;
        }
        
        &.down {
          color: #f56c6c;
        }
        
        .el-icon {
          margin-left: 5px;
        }
      }
    }
  }
  
  .chart-row {
    margin-top: 20px;
    
    .chart-card {
      .chart-container {
        height: 300px;
      }
    }
  }
  
  .monitor-row {
    margin-top: 20px;
    
    .monitor-card {
      .el-table {
        margin-top: 10px;
      }
      
      .el-timeline {
        margin-top: 10px;
        padding-left: 0;
      }
    }
  }
}
</style>
