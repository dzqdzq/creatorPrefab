<template>
  <div class="app">
    <CardList :items="items" @remove-item="removeItem" />
    <div class="search-container">
      <SearchBar @search="handleSearch" :is-loading="isLoading" />
    </div>
    <Toast :message="toastMessage" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { vscode } from './utilities/vscode'
import CardList from './components/CardList.vue'
import SearchBar from './components/SearchBar.vue'
import Toast from './components/Toast.vue'

interface QueryResult {
  id: string
  query: string
  timestamp: number
  status: 'loading' | 'success' | 'error'
  result?: any
  error?: string
}

const items = ref<QueryResult[]>([])
const toastMessage = ref('')
const isLoading = ref(false)

const handleSearch = (inputValue: string) => {
  if (!inputValue.trim()) {
    return
  }
  
  if (inputValue === '/clear') {
    items.value = []
    return
  }

  // 检查是否已存在相同查询
  const existingIndex = items.value.findIndex(item => 
    item.query === inputValue && item.status === 'success'
  )
  
  if (existingIndex !== -1) {
    toastMessage.value = '该查询已存在，请查看历史记录'
    setTimeout(() => {
      toastMessage.value = ''
    }, 2000)
    return
  }

  // 添加加载状态
  const queryId = Date.now().toString()
  const newQuery: QueryResult = {
    id: queryId,
    query: inputValue,
    timestamp: Date.now(),
    status: 'loading'
  }
  
  items.value = [...items.value, newQuery]
  isLoading.value = true
  
  vscode.postMessage({ command: 'parseUUID', text: inputValue })
}

onMounted(() => {
  window.addEventListener('message', (event) => {
    const message = event.data
    if (message.command === 'parseUUID_resp') {
      console.log('search===', message.text)
      isLoading.value = false
      
      const info = message.text
      if (info.code) {
        // 错误查询不显示在列表中，只显示吐司提示
        // 移除加载中的查询项（最新查询在底部）
        if (items.value.length > 0 && items.value[items.value.length - 1].status === 'loading') {
          items.value = items.value.slice(0, -1)
        }
        
        let errorMessage = 'UUID格式无效'
        if (info.code === 'NOT_FOUND') {
          errorMessage = info.message || '未找到对应的资源'
        }
        
        toastMessage.value = errorMessage
        setTimeout(() => {
          toastMessage.value = ''
        }, 2000)
        return
      }
      
      // 检查查询结果是否有效
      if (!info || Object.keys(info).length === 0) {
        // 查询结果为空，不显示在列表中（最新查询在底部）
        if (items.value.length > 0 && items.value[items.value.length - 1].status === 'loading') {
          items.value = items.value.slice(0, -1)
        }
        toastMessage.value = '未找到对应的资源'
        setTimeout(() => {
          toastMessage.value = ''
        }, 2000)
        return
      }
      
      // 只有成功查询才显示在列表中（最新查询在底部）
      if (items.value.length > 0) {
        items.value[items.value.length - 1].status = 'success'
        items.value[items.value.length - 1].result = info
      }
    }
  })
})

const removeItem = (index: number) => {
  items.value = items.value.filter((_, i) => i !== index)
}
</script>

<style scoped>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.search-container {
  padding: 12px 16px;
  background-color: #1e1e1e;
  border-top: 1px solid #3c3c3c;
  flex-shrink: 0;
  box-sizing: border-box;
  margin: 0;
}
</style>
