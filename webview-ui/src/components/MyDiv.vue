<template>
  <div class="my-div">
    <div class="panel">
      <div 
        v-for="[key, value] in Object.entries(data)" 
        :key="key" 
        class="item"
      >
        <span class="key">{{ key }}</span>: <span class="value">{{ value }}</span>
      </div>
    </div>
    <vscode-button 
      class="close-button"
      @click="$emit('close')"
    >
      x
    </vscode-button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  data: object
}

defineProps<Props>()
defineEmits<{
  close: []
}>()
</script>

<style scoped>
.my-div {
  position: relative;
}

.panel {
  position: relative;
  width: 100%;
  max-height: 120px;
  overflow-x: hidden;
  overflow-y: auto;
  background-color: #1e1e1e;
  color: #d4d4d4;
  padding: 10px;
  margin-bottom: 8px;
  overflow-wrap: break-word;
  box-sizing: border-box;
}

.item {
  margin-bottom: 6px;
}

.key {
  color: #569cd6;
}

.value {
  color: #CF9178;
}

.close-button {
  position: absolute;
  top: 0px;
  right: 0px;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  padding: 1px;
  font-size: 0.5rem;
  background-color: gray;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
