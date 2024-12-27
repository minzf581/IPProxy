<template>
  <div class="app-container">
    <!-- 搜索栏 -->
    <div class="filter-container">
      <el-form :inline="true" :model="queryParams" class="form-inline">
        <el-form-item label="资源类型">
          <el-select v-model="queryParams.resourceType" placeholder="选择资源类型" clearable>
            <el-option label="动态资源1" value="1" />
            <el-option label="动态资源2" value="2" />
            <el-option label="动态资源3" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单号">
          <el-input v-model="queryParams.orderId" placeholder="订单号" clearable />
        </el-form-item>
        <el-form-item label="代理商">
          <el-select v-model="queryParams.agentId" placeholder="选择代理商" clearable>
            <el-option
              v-for="agent in agentOptions"
              :key="agent.id"
              :label="agent.name"
              :value="agent.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="queryParams.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
          <el-button type="success" @click="handleAdd">开通资源</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 资源列表 -->
    <el-table
      v-loading="loading"
      :data="resourceList"
      border
      style="width: 100%"
    >
      <el-table-column label="资源ID" prop="id" width="80" />
      <el-table-column label="订单号" prop="orderId" width="180" />
      <el-table-column label="代理商" prop="agentName" />
      <el-table-column label="资源类型" width="100">
        <template #default="{ row }">
          动态资源{{ row.resourceType }}
        </template>
      </el-table-column>
      <el-table-column label="流量信息" width="200">
        <template #default="{ row }">
          <div>总流量：{{ row.totalTraffic }}GB</div>
          <div>已用：{{ row.usedTraffic }}GB</div>
          <div>剩余：{{ row.totalTraffic - row.usedTraffic }}GB</div>
        </template>
      </el-table-column>
      <el-table-column label="代理信息" width="200">
        <template #default="{ row }">
          <div>IP：{{ row.proxyIp }}</div>
          <div>端口：{{ row.proxyPort }}</div>
          <div>用户名：{{ row.username }}</div>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="到期时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.expireTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            size="small"
            @click="handleRenew(row)"
            :disabled="row.status === 'expired'"
          >续费</el-button>
          <el-button
            type="success"
            size="small"
            @click="handleAddTraffic(row)"
            :disabled="row.status !== 'active'"
          >加流量</el-button>
          <el-button
            type="warning"
            size="small"
            @click="handleViewPassword(row)"
          >查看密码</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.limit"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 开通资源对话框 -->
    <el-dialog
      title="开通动态资源"
      v-model="openDialogVisible"
      width="600px"
    >
      <el-form
        ref="openFormRef"
        :model="openForm"
        :rules="openRules"
        label-width="120px"
      >
        <el-form-item label="代理商" prop="agentId">
          <el-select
            v-model="openForm.agentId"
            placeholder="选择代理商"
            style="width: 100%"
          >
            <el-option
              v-for="agent in agentOptions"
              :key="agent.id"
              :label="agent.name"
              :value="agent.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="资源类型" prop="resourceType">
          <el-select
            v-model="openForm.resourceType"
            placeholder="选择资源类型"
            style="width: 100%"
          >
            <el-option label="动态资源1" value="1" />
            <el-option label="动态资源2" value="2" />
            <el-option label="动态资源3" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="流量配额(GB)" prop="traffic">
          <el-input-number
            v-model="openForm.traffic"
            :min="1"
            :step="1"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="有效期(天)" prop="duration">
          <el-input-number
            v-model="openForm.duration"
            :min="1"
            :step="1"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="openForm.remark"
            type="textarea"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="openDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitOpen">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDate } from '@/utils/format'
import { useResourceStore } from '@/stores/resource'
import { useAgentStore } from '@/stores/agent'

const resourceStore = useResourceStore()
const agentStore = useAgentStore()

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 10,
  resourceType: '',
  orderId: '',
  agentId: '',
  dateRange: []
})

// 列表数据
const loading = ref(false)
const resourceList = ref([])
const total = ref(0)
const agentOptions = ref([])

// 开通资源对话框
const openDialogVisible = ref(false)
const openFormRef = ref(null)
const openForm = reactive({
  agentId: '',
  resourceType: '',
  traffic: 100,
  duration: 30,
  remark: ''
})

// 表单验证规则
const openRules = {
  agentId: [
    { required: true, message: '请选择代理商', trigger: 'change' }
  ],
  resourceType: [
    { required: true, message: '请选择资源类型', trigger: 'change' }
  ],
  traffic: [
    { required: true, message: '请输入流量配额', trigger: 'blur' },
    { type: 'number', min: 1, message: '流量必须大于0', trigger: 'blur' }
  ],
  duration: [
    { required: true, message: '请输入有效期', trigger: 'blur' },
    { type: 'number', min: 1, message: '有效期必须大于0', trigger: 'blur' }
  ]
}

// 获取资源列表
const getResourceList = async () => {
  loading.value = true
  try {
    const { data } = await resourceStore.getDynamicResources(queryParams)
    resourceList.value = data.items
    total.value = data.total
  } catch (error) {
    console.error('获取资源列表失败:', error)
    ElMessage.error('获取资源列表失败')
  } finally {
    loading.value = false
  }
}

// 获取代理商列表
const getAgentOptions = async () => {
  try {
    const { data } = await agentStore.getAgentOptions()
    agentOptions.value = data
  } catch (error) {
    console.error('获取代理商列表失败:', error)
  }
}

// 状态处理
const getStatusType = (status) => {
  const types = {
    active: 'success',
    expired: 'info',
    pending: 'warning',
    error: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    active: '正常',
    expired: '已过期',
    pending: '处理中',
    error: '异常'
  }
  return texts[status] || status
}

// 搜索
const handleSearch = () => {
  queryParams.page = 1
  getResourceList()
}

// 重置查询
const resetQuery = () => {
  queryParams.resourceType = ''
  queryParams.orderId = ''
  queryParams.agentId = ''
  queryParams.dateRange = []
  handleSearch()
}

// 开通资源
const handleAdd = () => {
  openForm.agentId = ''
  openForm.resourceType = ''
  openForm.traffic = 100
  openForm.duration = 30
  openForm.remark = ''
  openDialogVisible.value = true
}

// 续费
const handleRenew = async (row) => {
  try {
    await ElMessageBox.confirm('确认要续费该资源吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await resourceStore.renewDynamicResource({
      resourceId: row.id,
      duration: 30 // 默认续费30天
    })
    ElMessage.success('续费成功')
    getResourceList()
  } catch (error) {
    console.error('续费失败:', error)
    if (error !== 'cancel') {
      ElMessage.error('续费失败')
    }
  }
}

// 加流量
const handleAddTraffic = async (row) => {
  try {
    const { value: traffic } = await ElMessageBox.prompt('请输入要增加的流量（GB）', '加流量', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'number',
      inputValue: 10,
      inputValidator: (value) => value > 0,
      inputErrorMessage: '流量必须大于0'
    })
    
    await resourceStore.addDynamicTraffic({
      resourceId: row.id,
      traffic: Number(traffic)
    })
    ElMessage.success('加流量成功')
    getResourceList()
  } catch (error) {
    console.error('加流量失败:', error)
    if (error !== 'cancel') {
      ElMessage.error('加流量失败')
    }
  }
}

// 查看密码
const handleViewPassword = async (row) => {
  try {
    const { data } = await resourceStore.getDynamicPassword(row.id)
    ElMessageBox.alert(`代理密码：${data.password}`, '密码信息', {
      confirmButtonText: '确定',
      callback: () => {}
    })
  } catch (error) {
    console.error('获取密码失败:', error)
    ElMessage.error('获取密码失败')
  }
}

// 提交开通
const submitOpen = async () => {
  if (!openFormRef.value) return
  
  await openFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await resourceStore.openDynamicResource(openForm)
        ElMessage.success('开通成功')
        openDialogVisible.value = false
        getResourceList()
      } catch (error) {
        console.error('开通失败:', error)
        ElMessage.error('开通失败')
      }
    }
  })
}

// 分页
const handleSizeChange = (val) => {
  queryParams.limit = val
  getResourceList()
}

const handleCurrentChange = (val) => {
  queryParams.page = val
  getResourceList()
}

onMounted(() => {
  getResourceList()
  getAgentOptions()
})
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;
}

.filter-container {
  padding-bottom: 20px;
}

.pagination-container {
  padding: 20px 0;
}

.dialog-footer {
  text-align: right;
}
</style>
