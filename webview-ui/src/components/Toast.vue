<template>
  <div v-if="message" class="toast">
    {{ message }}
  </div>
</template>

<script setup lang="ts">
interface Props {
  message: string
}

defineProps<Props>()
</script>

<style scoped>
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: rgba(0,0,0,0.5);
  color: white;
  padding: 10px;
  border-radius: 5px;
}
</style>
