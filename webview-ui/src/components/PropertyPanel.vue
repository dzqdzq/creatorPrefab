<template>
  <div class="property-panel">
    <div v-if="!node" class="no-selection">
      <div class="no-selection-icon">👆</div>
      <p>Select a node to view its properties</p>
    </div>

    <div v-else class="property-content">
      <Inspector
        :sections="sections"
        @change="handlePropChange"
        @confirm="handlePropConfirm"
        @section-enable="handleSectionEnable"
        @section-fold="handleSectionFold"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Inspector, type PropertyChangeEvent, type SectionData } from '@aspect/creator-ui-kit/vue'
import { nodeToSections } from '../utils/nodeToSections'

interface Node {
  id: string
  name: string
  type: string
  uuid?: string
  isRoot?: boolean
  active?: boolean
  position?: { x: number; y: number; z?: number }
  rotation?: { x: number; y: number; z?: number }
  scale?: { x: number; y: number; z?: number }
  opacity?: number
  color?: { r: number; g: number; b: number; a?: number }
  contentSize?: { width: number; height: number }
  anchorPoint?: { x: number; y: number }
  skewX?: number
  skewY?: number
  groupIndex?: number
  components?: any[]
  children?: any[]
}

interface Props {
  node: Node | null
  prefabData?: any
}

const props = defineProps<Props>()

// 将节点数据转换为 SectionData
const sections = computed<SectionData[]>(() => {
  return nodeToSections(props.node, props.prefabData)
})

// 处理属性变化
function handlePropChange(event: PropertyChangeEvent) {
  console.log('属性变化:', event)
  // TODO: 可以在这里同步更新节点数据
}

// 处理属性确认
function handlePropConfirm(event: PropertyChangeEvent) {
  console.log('属性确认:', event)
  // TODO: 可以在这里保存修改
}

// 处理 Section 启用状态变化
function handleSectionEnable(sectionId: string, enabled: boolean) {
  console.log('Section 启用状态:', { sectionId, enabled })
  
  // 更新节点或组件的 enabled 状态
  if (sectionId === 'node' && props.node) {
    props.node.active = enabled
  } else if (props.node?.components) {
    const componentIndex = sections.value.findIndex(s => s.id === sectionId)
    if (componentIndex > 0) {
      const component = props.node.components[componentIndex - 1]
      if (component) {
        component.enabled = enabled
      }
    }
  }
}

// 处理 Section 折叠状态变化
function handleSectionFold(sectionId: string, folded: boolean) {
  console.log('Section 折叠状态:', { sectionId, folded })
  // 可以在这里保存折叠状态到本地存储
}
</script>

<style scoped>
.property-panel {
  height: 100%;
  overflow-y: auto;
  background-color: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.no-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6a6a6a;
  text-align: center;
}

.no-selection-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.property-content {
  padding: 12px;
}
</style>
