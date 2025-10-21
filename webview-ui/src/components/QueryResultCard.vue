<template>
  <div class="query-result-card" :class="statusClass">
    <div class="query-header">
      <div class="query-info">
        <span class="query-text">{{ getDisplayTitle() }}</span>
      </div>
      <button class="remove-btn" @click="$emit('remove')" title="删除">×</button>
    </div>
    
    <div v-if="item.result" class="result-content">
      <div class="result-item">
        <span class="result-key">short1:</span>
        <span class="result-value">{{ item.result.short1 || '' }}</span>
      </div>
      <div class="result-item">
        <span class="result-key">short2:</span>
        <span class="result-value">{{ item.result.short2 || '' }}</span>
      </div>
      <div class="result-item">
        <span class="result-key">path:</span>
        <span class="result-value">{{ item.result.path || '' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface QueryResult {
  id: string
  query: string
  timestamp: number
  status: 'loading' | 'success' | 'error'
  result?: any
  error?: string
}

interface Props {
  item: QueryResult
}

const props = defineProps<Props>()
defineEmits<{
  remove: []
}>()

const statusClass = computed(() => {
  return `status-${props.item.status}`
})

const getDisplayTitle = () => {
  // 如果有结果，优先显示long UUID作为标题
  if (props.item.result && props.item.result.long) {
    return props.item.result.long
  }
  // 否则显示查询输入
  return props.item.query
}
</script>

<style scoped>
.query-result-card {
  background-color: #2d2d2d;
  border: 1px solid #3c3c3c;
  border-radius: 6px;
  margin-bottom: 8px;
  padding: 12px;
  transition: all 0.2s ease;
}

.query-result-card:hover {
  border-color: #4c4c4c;
  background-color: #333;
}

.query-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.query-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.query-text {
  font-weight: 500;
  color: #d4d4d4;
  font-size: 14px;
}

.remove-btn {
  background: none;
  border: none;
  color: #6a6a6a;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.remove-btn:hover {
  color: #f44336;
  background-color: #5d1a1a;
}

.result-content {
  padding: 4px 0;
}

.result-item {
  display: flex;
  margin-bottom: 4px;
  font-size: 13px;
  align-items: flex-start;
}

.result-key {
  color: #569cd6;
  font-weight: 500;
  min-width: 50px;
  margin-right: 4px;
  flex-shrink: 0;
}

.result-value {
  color: #d4d4d4;
  word-break: break-all;
  flex: 1;
}
</style>
