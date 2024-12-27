<template>
  <div class="app-container">
    <!-- 搜索栏 -->
    <div class="filter-container">
      <el-form :inline="true" :model="queryParams" class="form-inline">
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
        <el-form-item label="IP地址">
          <el-input v-model="queryParams.ip" placeholder="IP地址" clearable />
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
      <el-table-column label="IP信息" width="200">
        <template #default="{ row }">
          <div>IP：{{ row.ip }}</div>
          <div>端口：{{ row.port }}</div>
          <div>ISP：{{ row.isp }}</div>
        </template>
      </el-table-column>
      <el-table-column label="地理位置" width="180">
        <template #default="{ row }">
          <div>{{ row.country }}</div>
          <div>{{ row.province }} {{ row.city }}</div>
        </template>
      </el-table-column>
      <el-table-column label="代理信息" width="180">
        <template #default="{ row }">
          <div>用户名：{{ row.username }}</div>
          <div>带宽：{{ row.bandwidth }}Mbps</div>
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
            type="warning"
            size="small"
            @click="handleViewPassword(row)"
          >查看密码</el-button>
          <el-button
            type="danger"
            size="small"
            @click="handleRelease(row)"
            :disabled="row.status === 'expired'"
          >释放</el-button>
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
      title="开通静态资源"
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
        <el-form-item label="IP地址" prop="ip">
          <el-input v-model="openForm.ip" placeholder="请输入指定的IP地址">
            <template #append>
              <el-button @click="handleCheckIp">检查可用性</el-button>
            </template>
          </el-input>
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

    <!-- 续费对话框 -->
    <el-dialog
      title="续费静态资源"
      v-model="renewDialogVisible"
      width="400px"
    >
      <el-form
        ref="renewFormRef"
        :model="renewForm"
        :rules="renewRules"
        label-width="120px"
      >
        <el-form-item label="续费时长(天)" prop="duration">
          <el-input-number
            v-model="renewForm.duration"
            :min="1"
            :step="1"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="renewForm.remark"
            type="textarea"
            placeholder="请输入续费备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="renewDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitRenew">确定</el-button>
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
  orderId: '',
  agentId: '',
  ip: '',
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
  ip: '',
  duration: 30,
  remark: ''
})

// 续费对话框
const renewDialogVisible = ref(false)
const renewFormRef = ref(null)
const renewForm = reactive({
  resourceId: '',
  duration: 30,
  remark: ''
})

// 表单验证规则
const openRules = {
  agentId: [
    { required: true, message: '请选择代理商', trigger: 'change' }
  ],
  ip: [
    { required: true, message: '请输入IP地址', trigger: 'blur' },
    { pattern: /^(\d{1,3}\.){3}\d{1,3}$/, message: '请输入正确的IP地址格式', trigger: 'blur' }
  ],
  duration: [
    { required: true, message: '请输入有效期', trigger: 'blur' },
    { type: 'number', min: 1, message: '有效期必须大于0', trigger: 'blur' }
  ]
}

const renewRules = {
  duration: [
    { required: true, message: '请输入续费时长', trigger: 'blur' },
    { type: 'number', min: 1, message: '续费时长必须大于0', trigger: 'blur' }
  ]
}

// 获取资源列表
const getResourceList = async () => {
  loading.value = true
  try {
    const { data } = await resourceStore.getStaticResources(queryParams)
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
  queryParams.orderId = ''
  queryParams.agentId = ''
  queryParams.ip = ''
  queryParams.dateRange = []
  handleSearch()
}

// 开通资源
const handleAdd = () => {
  openForm.agentId = ''
  openForm.ip = ''
  openForm.duration = 30
  openForm.remark = ''
  openDialogVisible.value = true
}

// 检查IP可用性
const handleCheckIp = async () => {
  if (!openForm.ip) {
    ElMessage.warning('请先输入IP地址')
    return
  }
  
  try {
    const { data } = await resourceStore.checkStaticIp(openForm.ip)
    if (data.available) {
      ElMessage.success('该IP可用')
    } else {
      ElMessage.warning('该IP不可用')
    }
  } catch (error) {
    console.error('检查IP失败:', error)
    ElMessage.error('检查IP失败')
  }
}

// 续费
const handleRenew = (row) => {
  renewForm.resourceId = row.id
  renewForm.duration = 30
  renewForm.remark = ''
  renewDialogVisible.value = true
}

// 查看密码
const handleViewPassword = async (row) => {
  try {
    const { data } = await resourceStore.getStaticPassword(row.id)
    ElMessageBox.alert(`代理密码：${data.password}`, '密码信息', {
      confirmButtonText: '确定',
      callback: () => {}
    })
  } catch (error) {
    console.error('获取密码失败:', error)
    ElMessage.error('获取密码失败')
  }
}

// 释放资源
const handleRelease = async (row) => {
  try {
    await ElMessageBox.confirm('确认要释放该资源吗？此操作不可恢复！', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await resourceStore.releaseStaticResource(row.id)
    ElMessage.success('释放成功')
    getResourceList()
  } catch (error) {
    console.error('释放失败:', error)
    if (error !== 'cancel') {
      ElMessage.error('释放失败')
    }
  }
}

// 提交开通
const submitOpen = async () => {
  if (!openFormRef.value) return
  
  await openFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await resourceStore.openStaticResource(openForm)
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

// 提交续费
const submitRenew = async () => {
  if (!renewFormRef.value) return
  
  await renewFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await resourceStore.renewStaticResource(renewForm)
        ElMessage.success('续费成功')
        renewDialogVisible.value = false
        getResourceList()
      } catch (error) {
        console.error('续费失败:', error)
        ElMessage.error('续费失败')
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
