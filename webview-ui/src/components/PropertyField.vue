<template>
  <div class="property-field">
    <label class="property-label">{{ label }}:</label>
    <div class="input-container">
      <!-- 单个输入框 -->
      <input 
        v-if="type === 'single'"
        :type="inputType"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        :step="step"
        :min="min"
        :max="max"
        :readonly="readonly"
        class="single-input"
      />
      
      <!-- 多个输入框 -->
      <template v-else-if="type === 'vector'">
        <div 
          v-for="(value, index) in vectorValues"
          :key="index"
          class="vector-input-container"
        >
          <span class="vector-label">{{ vectorLabels[index] }}</span>
          <input 
            :type="inputType"
            :value="value"
            @input="updateVectorValue(index, ($event.target as HTMLInputElement).value)"
            :step="step"
            :min="min"
            :max="max"
            :readonly="readonly"
            class="vector-input"
          />
        </div>
      </template>
      
      <!-- 颜色选择器 -->
      <input 
        v-else-if="type === 'color'"
        type="color"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        class="color-input"
      />
      
      <!-- 下拉选择 -->
      <select 
        v-else-if="type === 'select'"
        :value="modelValue"
        @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
        class="select-input"
      >
        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  label: string
  type: 'single' | 'vector' | 'color' | 'select'
  modelValue: any
  inputType?: string
  step?: number
  min?: number
  max?: number
  readonly?: boolean
  vectorLabels?: string[]
  options?: Array<{ label: string; value: any }>
}

const props = withDefaults(defineProps<Props>(), {
  inputType: 'text',
  step: 1,
  readonly: false,
  vectorLabels: () => ['X', 'Y', 'Z', 'W']
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

// 处理向量值
const vectorValues = computed(() => {
  if (props.type === 'vector' && Array.isArray(props.modelValue)) {
    return props.modelValue
  }
  return []
})

// 更新向量值
const updateVectorValue = (index: number, value: string) => {
  if (props.type === 'vector') {
    const newValues = [...vectorValues.value]
    newValues[index] = props.inputType === 'number' ? Number(value) : value
    emit('update:modelValue', newValues)
  }
}
</script>

<style scoped>
.property-field {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 4px 0;
}

.property-label {
  color: #d4d4d4;
  font-size: 13px;
  min-width: 80px;
  margin-right: 12px;
  flex-shrink: 0;
  text-align: right;
}

.input-container {
  display: flex;
  gap: 4px;
  flex: 1;
  align-items: center;
}

.single-input,
.vector-input,
.color-input,
.select-input {
  background-color: #2d2d2d;
  border: 1px solid #3c3c3c;
  color: #d4d4d4;
  padding: 4px 8px;
  border-radius: 2px;
  font-size: 13px;
  transition: border-color 0.2s ease;
}

.single-input:focus,
.vector-input:focus,
.color-input:focus,
.select-input:focus {
  outline: none;
  border-color: #007acc;
}

.single-input {
  flex: 1;
}

.vector-input-container {
  display: flex;
  align-items: center;
  position: relative;
  flex: 1;
  min-width: 0;
}

.vector-label {
  position: absolute;
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  text-align: center;
  font-size: 10px;
  color: #6a6a6a;
  font-weight: 500;
  pointer-events: none;
  z-index: 1;
}

.vector-input {
  flex: 1;
  min-width: 0;
  text-align: center;
  padding-left: 18px;
}

.color-input {
  width: 40px;
  height: 24px;
  padding: 2px;
  cursor: pointer;
}

.select-input {
  flex: 1;
}

.readonly-input {
  background-color: #1e1e1e;
  color: #6a6a6a;
  cursor: not-allowed;
}
</style>
