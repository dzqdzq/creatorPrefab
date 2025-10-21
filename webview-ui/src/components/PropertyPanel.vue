<template>
  <div class="property-panel">
    <div v-if="!node" class="no-selection">
      <div class="no-selection-icon">👆</div>
      <p>Select a node to view its properties</p>
    </div>
    
    <div v-else class="property-content">
      <!-- cc.Node 组件 -->
      <div class="component-section">
        <div class="component-header" @click="toggleNodeExpanded">
          <span class="expand-icon" :class="{ 'expanded': nodeExpanded }">▼</span>
          <input type="checkbox" v-model="nodeActive" @click.stop />
          <span class="component-title">cc.Node</span>
        </div>
        <div class="component-content" v-show="nodeExpanded">
          <PropertyField 
            label="position" 
            type="vector" 
            v-model="nodePositionArray"
            input-type="number"
            :vector-labels="['X', 'Y', 'Z']"
          />
          
          <PropertyField 
            label="rotation" 
            type="vector" 
            v-model="nodeRotationArray"
            input-type="number"
            :vector-labels="['X', 'Y']"
          />
          
          <PropertyField 
            label="scale" 
            type="vector" 
            v-model="nodeScaleArray"
            input-type="number"
            :step="0.1"
            :vector-labels="['X', 'Y', 'Z']"
          />
          
          <PropertyField 
            label="anchor" 
            type="vector" 
            v-model="nodeAnchorArray"
            input-type="number"
            :step="0.1"
            :min="0"
            :max="1"
            :vector-labels="['X', 'Y']"
          />
          
          <PropertyField 
            label="size" 
            type="vector" 
            v-model="nodeSizeArray"
            input-type="number"
            :vector-labels="['W', 'H']"
          />
          
          <PropertyField 
            label="color" 
            type="color" 
            v-model="nodeColor"
          />
          
          <PropertyField 
            label="opacity" 
            type="single" 
            v-model="nodeOpacity"
            input-type="number"
            :min="0"
            :max="255"
          />
          
          <PropertyField 
            label="skew" 
            type="vector" 
            v-model="nodeSkewArray"
            input-type="number"
            :vector-labels="['X', 'Y']"
          />
          
          <PropertyField 
            label="group" 
            type="select" 
            v-model="nodeGroup"
            :options="groupOptions"
          />
        </div>
      </div>
      
      <!-- cc.Canvas 组件 -->
      <div v-if="node.type === 'cc.Canvas'" class="component-section">
        <div class="component-header">
          <input type="checkbox" v-model="canvasEnabled" />
          <span class="component-title">cc.Canvas</span>
          <span class="expand-icon">▼</span>
        </div>
        <div class="component-content">
          <div class="property-row">
            <label class="property-label">enabled:</label>
            <input type="checkbox" v-model="canvasEnabled" />
          </div>
          
          <div class="property-group">
            <label class="property-label">designResolution:</label>
            <div class="vector-inputs">
              <input type="number" v-model="designResolution.width" />
              <input type="number" v-model="designResolution.height" />
            </div>
          </div>
          
          <div class="property-row">
            <label class="property-label">fitHeight:</label>
            <input type="checkbox" v-model="fitHeight" />
          </div>
          
          <div class="property-row">
            <label class="property-label">fitWidth:</label>
            <input type="checkbox" v-model="fitWidth" />
          </div>
        </div>
      </div>
      
      <!-- 动态组件 -->
      <div v-for="(component, index) in node.components" :key="component.type" class="component-section">
        <div class="component-header" @click="toggleComponentExpanded(index)">
          <span class="expand-icon" :class="{ 'expanded': componentExpanded[index] }">▼</span>
          <input type="checkbox" v-model="component.enabled" @click.stop />
          <span class="component-title">{{ component.type }}</span>
        </div>
        <div class="component-content" v-show="componentExpanded[index]">
          
          <!-- 根据组件类型显示特定属性 -->
          <template v-if="component.type === 'cc.BlockInputEvents'">
            <!-- BlockInputEvents 组件属性 -->
          </template>
          
          <template v-else-if="component.type.includes('AviaLoadingView')">
            <!-- AviaLoadingView 组件属性 -->
            <div class="property-row">
              <label class="property-label">name:</label>
              <input type="text" :value="component.name" readonly class="readonly-input" />
            </div>
            
            <div class="property-row">
              <label class="property-label">uuid:</label>
              <input type="text" :value="component._id" readonly class="readonly-input" />
            </div>
            
            <div class="property-row">
              <label class="property-label">aniTimes:</label>
              <input type="number" v-model="component.aniTimes" step="0.1" />
            </div>
            
            <div class="property-row">
              <label class="property-label">bg:</label>
              <div class="node-reference">
                <span class="node-icon">📦</span>
                <span class="node-type">cc.Node</span>
                <button class="node-button">{{ getNodeName(component.bg) }}</button>
              </div>
            </div>
            
            <div class="property-row">
              <label class="property-label">isPlaySpAni_:</label>
              <input type="checkbox" v-model="component.isPlaySpAni_" />
            </div>
            
            <div class="property-row">
              <label class="property-label">loadingSpAni:</label>
              <div class="node-reference">
                <span class="node-icon">📦</span>
                <span class="node-type">cc.Node</span>
                <button class="node-button">{{ getNodeName(component.loadingSpAni) }}</button>
              </div>
            </div>
          </template>
          
          <template v-else-if="component.type.includes('AviaBC2UIAdapter')">
            <!-- AviaBC2UIAdapter 组件属性 -->
            <div class="property-row">
              <label class="property-label">name:</label>
              <input type="text" :value="component.name" readonly class="readonly-input" />
            </div>
          </template>
          
          <template v-else-if="component.type === 'cc.Widget'">
            <!-- Widget 组件属性 -->
            <div class="property-row">
              <label class="property-label">alignMode:</label>
              <select v-model="component.alignMode">
              <option v-for="option in alignModeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            </div>
            
            <div class="property-row">
              <label class="property-label">bottom:</label>
              <input type="number" v-model="component._bottom" />
            </div>
            
            <div class="property-row">
              <label class="property-label">isAlignBottom:</label>
              <input type="checkbox" v-model="component._isAbsBottom" />
            </div>
            
            <div class="property-row">
              <label class="property-label">isAlignLeft:</label>
              <input type="checkbox" v-model="component._isAbsLeft" />
            </div>
            
            <div class="property-row">
              <label class="property-label">isAlignRight:</label>
              <input type="checkbox" v-model="component._isAbsRight" />
            </div>
          </template>
          
          <template v-else>
            <!-- 其他组件属性 -->
            <div v-for="(value, key) in component" :key="key" class="property-row">
              <template v-if="!['type', 'name', 'enabled', '__type__', 'node'].includes(String(key))">
                <label class="property-label">{{ key }}:</label>
                <input 
                  v-if="typeof value === 'boolean'" 
                  type="checkbox" 
                  :checked="component[key]" 
                  @change="component[key] = ($event.target as HTMLInputElement).checked" 
                />
                <input 
                  v-else-if="typeof value === 'number'" 
                  type="number" 
                  :value="component[key]" 
                  @input="component[key] = Number(($event.target as HTMLInputElement).value)" 
                />
                <input 
                  v-else 
                  type="text" 
                  :value="component[key]" 
                  @input="component[key] = ($event.target as HTMLInputElement).value" 
                />
              </template>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import PropertyField from './PropertyField.vue'
// 删除 cc-ui 导入，使用原生 HTML 元素

interface Node {
  id: string
  name: string
  type: string
  uuid?: string
  isRoot?: boolean
  active?: boolean
  position?: any
  rotation?: any
  scale?: any
  opacity?: number
  color?: any
  contentSize?: any
  anchorPoint?: any
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

// 响应式数据
const nodeActive = ref(true)
const nodePosition = ref({ x: 0, y: 0, z: 0 })
const nodeRotation = ref({ x: 0, y: 0 })
const nodeScale = ref({ x: 1, y: 1, z: 1 })
const nodeAnchor = ref({ x: 0.5, y: 0.5 })
const nodeSize = ref({ width: 1440, height: 1468 })
const nodeColor = ref('#ffffff')
const nodeOpacity = ref(255)
const nodeSkew = ref({ x: 0, y: 0 })
const nodeGroup = ref('default')

// 数组形式的响应式数据（用于 PropertyField 组件）
const nodePositionArray = computed({
  get: () => [nodePosition.value.x, nodePosition.value.y, nodePosition.value.z],
  set: (value) => {
    nodePosition.value = { x: value[0], y: value[1], z: value[2] }
  }
})

const nodeRotationArray = computed({
  get: () => [nodeRotation.value.x, nodeRotation.value.y],
  set: (value) => {
    nodeRotation.value = { x: value[0], y: value[1] }
  }
})

const nodeScaleArray = computed({
  get: () => [nodeScale.value.x, nodeScale.value.y, nodeScale.value.z],
  set: (value) => {
    nodeScale.value = { x: value[0], y: value[1], z: value[2] }
  }
})

const nodeAnchorArray = computed({
  get: () => [nodeAnchor.value.x, nodeAnchor.value.y],
  set: (value) => {
    nodeAnchor.value = { x: value[0], y: value[1] }
  }
})

const nodeSizeArray = computed({
  get: () => [nodeSize.value.width, nodeSize.value.height],
  set: (value) => {
    nodeSize.value = { width: value[0], height: value[1] }
  }
})

const nodeSkewArray = computed({
  get: () => [nodeSkew.value.x, nodeSkew.value.y],
  set: (value) => {
    nodeSkew.value = { x: value[0], y: value[1] }
  }
})

// 折叠状态
const nodeExpanded = ref(true)
const componentExpanded = ref<boolean[]>([])

const canvasEnabled = ref(true)
const designResolution = ref({ width: 1440, height: 1468 })
const fitHeight = ref(true)
const fitWidth = ref(true)

const widgetEnabled = ref(true)
const alignMode = ref('ON_WINDOW_RESIZE')
const widgetBottom = ref(0)
const isAlignBottom = ref(true)
const isAlignLeft = ref(true)
const isAlignRight = ref(true)

// 选项数据
const groupOptions = ref([
  { label: 'default', value: 'default' }
])

const alignModeOptions = ref([
  { label: 'ON_WINDOW_RESIZE', value: 'ON_WINDOW_RESIZE' },
  { label: 'ON_WINDOW_RESIZE_HEIGHT', value: 'ON_WINDOW_RESIZE_HEIGHT' },
  { label: 'ON_WINDOW_RESIZE_WIDTH', value: 'ON_WINDOW_RESIZE_WIDTH' }
])

// 获取节点名称的方法
const getNodeName = (nodeRef: any) => {
  if (!nodeRef || !nodeRef.__id__) return 'None'
  if (props.prefabData && props.prefabData[nodeRef.__id__]) {
    return props.prefabData[nodeRef.__id__]._name || 'Node'
  }
  return 'Node'
}

// 切换折叠状态
const toggleNodeExpanded = () => {
  nodeExpanded.value = !nodeExpanded.value
}

const toggleComponentExpanded = (index: number) => {
  componentExpanded.value[index] = !componentExpanded.value[index]
}

// 监听节点变化，更新属性值
watch(() => props.node, (newNode) => {
  if (newNode) {
    console.log('PropertyPanel: updating properties for node:', newNode)
    
    // 更新节点属性
    nodeActive.value = newNode.active ?? true
    nodePosition.value = newNode.position || { x: 0, y: 0, z: 0 }
    nodeRotation.value = newNode.rotation || { x: 0, y: 0 }
    nodeScale.value = newNode.scale || { x: 1, y: 1, z: 1 }
    
    // 更新其他属性
    if (newNode.contentSize) {
      nodeSize.value = {
        width: newNode.contentSize.width || 0,
        height: newNode.contentSize.height || 0
      }
    }
    
    if (newNode.anchorPoint) {
      nodeAnchor.value = {
        x: newNode.anchorPoint.x || 0.5,
        y: newNode.anchorPoint.y || 0.5
      }
    }
    
    if (newNode.color) {
      // 转换 cc.Color 为十六进制
      const r = Math.round(newNode.color.r || 255)
      const g = Math.round(newNode.color.g || 255)
      const b = Math.round(newNode.color.b || 255)
      nodeColor.value = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    }
    
    nodeOpacity.value = newNode.opacity || 255
    nodeSkew.value = {
      x: newNode.skewX || 0,
      y: newNode.skewY || 0
    }
    nodeGroup.value = `group_${newNode.groupIndex || 0}`
    
    // 根据组件类型设置其他属性
    if (newNode.components) {
      console.log('PropertyPanel: node components:', newNode.components)
      
      // 初始化组件折叠状态
      componentExpanded.value = newNode.components.map(() => true)
      
      const widgetComponent = newNode.components.find(c => c.type === 'cc.Widget')
      if (widgetComponent) {
        widgetEnabled.value = widgetComponent.enabled ?? true
        alignMode.value = widgetComponent.alignMode || 'ON_WINDOW_RESIZE'
        widgetBottom.value = widgetComponent.bottom || 0
        isAlignBottom.value = widgetComponent.isAlignBottom ?? true
        isAlignLeft.value = widgetComponent.isAlignLeft ?? true
        isAlignRight.value = widgetComponent.isAlignRight ?? true
      }
      
      const canvasComponent = newNode.components.find(c => c.type === 'cc.Canvas')
      if (canvasComponent) {
        canvasEnabled.value = canvasComponent.enabled ?? true
        if (canvasComponent.designResolution) {
          designResolution.value = {
            width: canvasComponent.designResolution.width || 1440,
            height: canvasComponent.designResolution.height || 1468
          }
        }
        fitHeight.value = canvasComponent.fitHeight ?? true
        fitWidth.value = canvasComponent.fitWidth ?? true
      }
    }
  }
}, { immediate: true })
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
  padding: 0;
}

.component-section {
  margin-bottom: 8px;
  border: 1px solid #3c3c3c;
  border-radius: 4px;
  overflow: hidden;
}

.component-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #2d2d2d;
  border-bottom: 1px solid #3c3c3c;
  cursor: pointer;
  user-select: none;
}

.expand-icon {
  color: #cccccc;
  font-size: 12px;
  transition: transform 0.2s ease;
  margin-right: 8px;
  flex-shrink: 0;
}

.expand-icon.expanded {
  transform: rotate(0deg);
}

.expand-icon:not(.expanded) {
  transform: rotate(-90deg);
}

.component-title {
  color: #569cd6;
  font-weight: 600;
  font-size: 14px;
  flex: 1;
  margin-left: 8px;
}

.component-content {
  padding: 12px;
  background-color: #1e1e1e;
}

.property-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 4px 0;
}

.property-group {
  margin-bottom: 8px;
  padding: 4px 0;
}

.property-label {
  color: #d4d4d4;
  font-size: 13px;
  min-width: 120px;
  margin-right: 12px;
  flex-shrink: 0;
}

.vector-inputs {
  display: flex;
  gap: 4px;
  flex: 1;
}

.readonly-input {
  background-color: #2d2d2d;
  border: 1px solid #3c3c3c;
  color: #cccccc;
  padding: 4px 8px;
  border-radius: 2px;
  font-size: 13px;
  width: 100%;
}

.node-reference {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.node-icon {
  font-size: 14px;
  color: #569cd6;
}

.node-type {
  color: #d4d4d4;
  font-size: 13px;
  font-family: 'Courier New', monospace;
}

.node-button {
  background-color: #f39c12;
  color: #ffffff;
  border: none;
  padding: 2px 8px;
  border-radius: 2px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.node-button:hover {
  background-color: #e67e22;
}
</style>
