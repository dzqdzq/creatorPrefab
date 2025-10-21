<template>
  <div class="search-bar">
    <input
      v-model="value"
      type="text"
      :placeholder="isLoading ? '正在查询...' : 'Enter a UUID or Path or \'/clear\' to clear all items.'"
      @keydown="handleSearch"
      maxlength="512"
      class="search-field"
      :disabled="isLoading"
    />
    <div v-if="isLoading" class="loading-indicator">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const value = ref('')

interface Props {
  isLoading?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  search: [value: string]
}>()

const handleSearch = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    if (e.target) {
      const content = e.target as HTMLInputElement
      emit('search', content.value)
    }
    value.value = ''
  }
}
</script>

<style scoped>
.search-bar {
  position: relative;
  display: flex;
  align-items: center;
}

.search-field {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #3c3c3c;
  border-radius: 6px;
  font-size: 14px;
  background-color: #2d2d2d;
  color: #d4d4d4;
  outline: none;
  box-sizing: border-box;
  margin: 0;
  transition: all 0.2s ease;
  padding-right: 40px;
}

.search-field:focus {
  border-color: #007acc;
  box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
  background-color: #1e1e1e;
}

.search-field:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.search-field::placeholder {
  color: #6a6a6a;
}

.search-field:hover:not(:disabled) {
  border-color: #4c4c4c;
}

.loading-indicator {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #3c3c3c;
  border-top: 2px solid #007acc;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
