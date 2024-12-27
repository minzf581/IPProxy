<template>
  <div class="app-container">
    <!-- 搜索栏 -->
    <div class="filter-container">
      <el-form :inline="true" :model="queryParams" class="form-inline">
        <el-form-item label="代理商">
          <el-input
            v-model="queryParams.agentName"
            placeholder="代理商名称"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="状态" clearable>
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
          <el-button type="success" @click="handleAdd">新增代理商</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 代理商列表 -->
    <el-table
      v-loading="loading"
      :data="agentList"
      border
      style="width: 100%"
    >
      <el-table-column label="代理商ID" prop="id" width="80" />
      <el-table-column label="代理商名称" prop="username" />
      <el-table-column label="联系邮箱" prop="email" />
      <el-table-column label="账户余额" width="120">
        <template #default="{ row }">
          <el-tooltip :content="'动态IP: ' + row.dynamicBalance + '\n静态IP: ' + row.staticBalance">
            <span>¥{{ (row.dynamicBalance + row.staticBalance).toFixed(2) }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="动态资源">
        <template #default="{ row }">
          <div>总量：{{ row.dynamicTotal }}GB</div>
          <div>已用：{{ row.dynamicUsed }}GB</div>
        </template>
      </el-table-column>
      <el-table-column label="静态资源">
        <template #default="{ row }">
          <div>总量：{{ row.staticTotal }}个</div>
          <div>已用：{{ row.staticUsed }}个</div>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'">
            {{ row.status === 'active' ? '正常' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="380" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button type="success" size="small" @click="handleRecharge(row)">充值</el-button>
          <el-button type="warning" size="small" @click="handleResource(row)">资源配置</el-button>
          <el-button
            :type="row.status === 'active' ? 'danger' : 'success'"
            size="small"
            @click="handleToggleStatus(row)"
          >
            {{ row.status === 'active' ? '禁用' : '启用' }}
          </el-button>
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

    <!-- 代理商表单对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="500px"
    >
      <el-form
        ref="agentFormRef"
        :model="agentForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="代理商名称" prop="username">
          <el-input v-model="agentForm.username" placeholder="请输入代理商名称" />
        </el-form-item>
        <el-form-item label="联系邮箱" prop="email">
          <el-input v-model="agentForm.email" placeholder="请输入联系邮箱" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="dialogType === 'add'">
          <el-input
            v-model="agentForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="agentForm.remark"
            type="textarea"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 充值对话框 -->
    <el-dialog
      title="账户充值"
      v-model="rechargeDialogVisible"
      width="500px"
    >
      <el-form
        ref="rechargeFormRef"
        :model="rechargeForm"
        :rules="rechargeRules"
        label-width="120px"
      >
        <el-form-item label="充值类型" prop="type">
          <el-radio-group v-model="rechargeForm.type">
            <el-radio label="dynamic">动态IP</el-radio>
            <el-radio label="static">静态IP</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="充值金额" prop="amount">
          <el-input-number
            v-model="rechargeForm.amount"
            :min="0"
            :precision="2"
            :step="100"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="rechargeForm.remark"
            type="textarea"
            placeholder="请输入充值备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="rechargeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitRecharge">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 资源配置对话框 -->
    <el-dialog
      title="资源配置"
      v-model="resourceDialogVisible"
      width="600px"
    >
      <el-form
        ref="resourceFormRef"
        :model="resourceForm"
        :rules="resourceRules"
        label-width="120px"
      >
        <el-tabs v-model="activeResourceTab">
          <el-tab-pane label="动态IP配置" name="dynamic">
            <el-form-item label="流量限制" prop="dynamicLimit">
              <el-input-number
                v-model="resourceForm.dynamicLimit"
                :min="0"
                :step="10"
                style="width: 200px"
              />
              <span class="unit">GB/月</span>
            </el-form-item>
            <el-form-item label="并发数限制" prop="dynamicConcurrent">
              <el-input-number
                v-model="resourceForm.dynamicConcurrent"
                :min="0"
                :step="1"
                style="width: 200px"
              />
            </el-form-item>
            <el-form-item label="IP白名单">
              <el-select
                v-model="resourceForm.dynamicWhitelist"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="请输入IP地址"
                style="width: 100%"
              >
                <el-option
                  v-for="ip in resourceForm.dynamicWhitelist"
                  :key="ip"
                  :label="ip"
                  :value="ip"
                />
              </el-select>
            </el-form-item>
          </el-tab-pane>
          <el-tab-pane label="静态IP配置" name="static">
            <el-form-item label="IP数量限制" prop="staticLimit">
              <el-input-number
                v-model="resourceForm.staticLimit"
                :min="0"
                :step="1"
                style="width: 200px"
              />
            </el-form-item>
            <el-form-item label="IP白名单">
              <el-select
                v-model="resourceForm.staticWhitelist"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="请输入IP地址"
                style="width: 100%"
              >
                <el-option
                  v-for="ip in resourceForm.staticWhitelist"
                  :key="ip"
                  :label="ip"
                  :value="ip"
                />
              </el-select>
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="resourceDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitResource">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDate } from '@/utils/format'
import { useAgentStore } from '@/stores/agent'

const agentStore = useAgentStore()

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 10,
  agentName: '',
  status: ''
})

// 列表数据
const loading = ref(false)
const agentList = ref([])
const total = ref(0)

// 表单对话框
const dialogVisible = ref(false)
const dialogType = ref('add')
const dialogTitle = computed(() => dialogType.value === 'add' ? '新增代理商' : '编辑代理商')
const agentFormRef = ref(null)
const agentForm = reactive({
  username: '',
  email: '',
  password: '',
  remark: ''
})

// 充值对话框
const rechargeDialogVisible = ref(false)
const rechargeFormRef = ref(null)
const rechargeForm = reactive({
  agentId: '',
  type: 'dynamic',
  amount: 0,
  remark: ''
})

// 资源配置对话框
const resourceDialogVisible = ref(false)
const resourceFormRef = ref(null)
const activeResourceTab = ref('dynamic')
const resourceForm = reactive({
  agentId: '',
  dynamicLimit: 0,
  dynamicConcurrent: 0,
  dynamicWhitelist: [],
  staticLimit: 0,
  staticWhitelist: []
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入代理商名称', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入联系邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ]
}

const rechargeRules = {
  type: [{ required: true, message: '请选择充值类型', trigger: 'change' }],
  amount: [
    { required: true, message: '请输入充值金额', trigger: 'blur' },
    { type: 'number', min: 0, message: '金额必须大于0', trigger: 'blur' }
  ]
}

const resourceRules = {
  dynamicLimit: [
    { required: true, message: '请输入流量限制', trigger: 'blur' },
    { type: 'number', min: 0, message: '限制必须大于0', trigger: 'blur' }
  ],
  staticLimit: [
    { required: true, message: '请输入IP数量限制', trigger: 'blur' },
    { type: 'number', min: 0, message: '限制必须大于0', trigger: 'blur' }
  ]
}

// 获取代理商列表
const getAgentList = async () => {
  loading.value = true
  try {
    const { data } = await agentStore.getAgentList(queryParams)
    agentList.value = data.items
    total.value = data.total
  } catch (error) {
    console.error('获取代理商列表失败:', error)
    ElMessage.error('获取代理商列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  queryParams.page = 1
  getAgentList()
}

// 重置查询
const resetQuery = () => {
  queryParams.agentName = ''
  queryParams.status = ''
  handleSearch()
}

// 新增代理商
const handleAdd = () => {
  dialogType.value = 'add'
  Object.assign(agentForm, {
    username: '',
    email: '',
    password: '',
    remark: ''
  })
  dialogVisible.value = true
}

// 编辑代理商
const handleEdit = (row) => {
  dialogType.value = 'edit'
  Object.assign(agentForm, {
    id: row.id,
    username: row.username,
    email: row.email,
    remark: row.remark
  })
  dialogVisible.value = true
}

// 充值
const handleRecharge = (row) => {
  rechargeForm.agentId = row.id
  rechargeForm.type = 'dynamic'
  rechargeForm.amount = 0
  rechargeForm.remark = ''
  rechargeDialogVisible.value = true
}

// 资源配置
const handleResource = async (row) => {
  try {
    const { data } = await agentStore.getAgentResource(row.id)
    Object.assign(resourceForm, {
      agentId: row.id,
      dynamicLimit: data.dynamicLimit,
      dynamicConcurrent: data.dynamicConcurrent,
      dynamicWhitelist: data.dynamicWhitelist,
      staticLimit: data.staticLimit,
      staticWhitelist: data.staticWhitelist
    })
    resourceDialogVisible.value = true
  } catch (error) {
    console.error('获取资源配置失败:', error)
    ElMessage.error('获取资源配置失败')
  }
}

// 切换状态
const handleToggleStatus = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确认要${row.status === 'active' ? '禁用' : '启用'}该代理商吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await agentStore.updateAgentStatus({
      id: row.id,
      status: row.status === 'active' ? 'disabled' : 'active'
    })
    ElMessage.success('操作成功')
    getAgentList()
  } catch (error) {
    console.error('操作失败:', error)
  }
}

// 提交表单
const submitForm = async () => {
  if (!agentFormRef.value) return
  
  await agentFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (dialogType.value === 'add') {
          await agentStore.createAgent(agentForm)
          ElMessage.success('添加成功')
        } else {
          await agentStore.updateAgent(agentForm)
          ElMessage.success('更新成功')
        }
        dialogVisible.value = false
        getAgentList()
      } catch (error) {
        console.error('操作失败:', error)
        ElMessage.error('操作失败')
      }
    }
  })
}

// 提交充值
const submitRecharge = async () => {
  if (!rechargeFormRef.value) return
  
  await rechargeFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await agentStore.rechargeAgent(rechargeForm)
        ElMessage.success('充值成功')
        rechargeDialogVisible.value = false
        getAgentList()
      } catch (error) {
        console.error('充值失败:', error)
        ElMessage.error('充值失败')
      }
    }
  })
}

// 提交资源配置
const submitResource = async () => {
  if (!resourceFormRef.value) return
  
  await resourceFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await agentStore.updateAgentResource(resourceForm)
        ElMessage.success('配置更新成功')
        resourceDialogVisible.value = false
        getAgentList()
      } catch (error) {
        console.error('配置更新失败:', error)
        ElMessage.error('配置更新失败')
      }
    }
  })
}

// 分页
const handleSizeChange = (val) => {
  queryParams.limit = val
  getAgentList()
}

const handleCurrentChange = (val) => {
  queryParams.page = val
  getAgentList()
}

onMounted(() => {
  getAgentList()
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

.unit {
  margin-left: 10px;
  color: #666;
}
</style>
