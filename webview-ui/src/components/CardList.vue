<template>
  <div class="card-list">
    <div v-if="items.length === 0" class="welcome">
      <div class="welcome-content">
        <h1>creator资源查询功能介绍</h1>
        <h2>使用案例12:</h2>
        <div class="examples">
          <p>1. 输入长UUID: e24d07b2-28d6-4a7e-aa88-91598af8bd80</p>
          <p>2. 输入短UUID: e24d0eyKNZKfqqIkVmK+L2A</p>
          <p>3. 输入路径Path(查图片动画等): new_guide.png</p>
          <p>4. 输入路径Path(查脚本): NewGuideView.ts</p>
          <p>5. 输入路径Path(查功能): resource/activity/demo</p>
          <p>6. 输入/clear: 清除所有查询结果</p>
        </div>
        <div class="note">
          <p>如果根据路径查,要写cocos creator项目的相对路径</p>
        </div>
      </div>
    </div>
    <QueryResultCard 
      v-for="(item, index) in items" 
      :key="item.id"
      :item="item"
      @remove="() => $emit('removeItem', index)" 
    />
  </div>
</template>

<script setup lang="ts">
import QueryResultCard from './QueryResultCard.vue'

interface QueryResult {
  id: string
  query: string
  timestamp: number
  status: 'loading' | 'success' | 'error'
  result?: any
  error?: string
}

interface Props {
  items: QueryResult[]
}

defineProps<Props>()
defineEmits<{
  removeItem: [index: number]
}>()
</script>

<style scoped>
.card-list {
  height: calc(100vh - 60px);
  overflow-y: auto;
  /* 自定义滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: #3c3c3c #1e1e1e;
}

/* Webkit浏览器滚动条样式 */
.card-list::-webkit-scrollbar {
  width: 8px;
}

.card-list::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.card-list::-webkit-scrollbar-thumb {
  background: #3c3c3c;
  border-radius: 4px;
}

.card-list::-webkit-scrollbar-thumb:hover {
  background: #4c4c4c;
}

.welcome {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 20px;
}

.welcome-content {
  max-width: 600px;
  text-align: left;
}

.welcome-content h1 {
  text-align: center;
  color: #569cd6;
  margin-bottom: 20px;
  font-size: 24px;
}

.welcome-content h2 {
  color: #d4d4d4;
  margin-bottom: 15px;
  font-size: 18px;
}

.examples {
  margin-bottom: 20px;
}

.examples p {
  margin: 8px 0;
  color: #d4d4d4;
  line-height: 1.5;
  font-size: 14px;
}

.note {
  background-color: #2d2d2d;
  padding: 12px;
  border-radius: 4px;
  border-left: 3px solid #007acc;
}

.note p {
  margin: 0;
  color: #cf9178;
  font-size: 13px;
  font-style: italic;
}
</style>
