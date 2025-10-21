<template>
  <div class="prefab-ui">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading prefab data...</p>
    </div>
    
    <div v-else-if="error" class="error">
      <h3>Error</h3>
      <p>{{ error }}</p>
    </div>
    
    <div v-else-if="prefabData" class="prefab-layout">
              <!-- 左侧节点树 -->
              <div class="node-tree-panel" :style="{ width: nodeTreeWidth + 'px' }">
                <div class="panel-header">
                  <h3>NodeTree( {{ totalNodeCount }} nodes)</h3>
                </div>
        <div class="tree-container">
          <NodeTree 
            :nodes="allNodes" 
            :selected-node="selectedNode"
            @select-node="selectNode"
          />
        </div>
      </div>
      
      <!-- 可拖拽的分隔条 -->
      <div 
        class="resize-handle" 
        @mousedown="startResize"
        :class="{ 'resizing': isResizing }"
      ></div>
      
      <!-- 右侧属性面板 -->
      <div class="property-panel">
        <div class="panel-header">
          <h3>Properties</h3>
        </div>
        <div class="property-container">
          <PropertyPanel 
            :node="selectedNode"
            :prefab-data="prefabData"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { vscode } from '../utilities/vscode'
import NodeTree from './NodeTree.vue'
import PropertyPanel from './PropertyPanel.vue'

// 简单的prefab解析函数（用于预览模式）
function parsePrefabFile(content: string) {
  try {
    const json = JSON.parse(content)
    return json
  } catch (e) {
    throw new Error('Invalid prefab file format')
  }
}

const loading = ref(true)
const error = ref('')
const prefabData = ref<any>(null)
const selectedNode = ref<any>(null)

// 拖拽调整面板宽度
const nodeTreeWidth = ref(400) // 默认节点树宽度
const isResizing = ref(false)
const startX = ref(0)
const startWidth = ref(0)

// 计算所有节点（包括根节点和子节点）
const allNodes = computed(() => {
  console.log('allNodes computed, prefabData:', prefabData.value)
  if (!prefabData.value) {
    console.log('allNodes: no prefabData, returning empty array')
    return []
  }
  
  // Cocos Creator prefab 文件是数组结构
  if (Array.isArray(prefabData.value)) {
    console.log('allNodes: prefabData is array, length:', prefabData.value.length)
    
    // 根节点是数组的第一个元素（索引 0）
    const rootNodeData = prefabData.value[0]
    if (rootNodeData && rootNodeData.__type__ === 'cc.Prefab') {
      console.log('allNodes: found root prefab:', rootNodeData)
      
      // 获取根节点的数据引用
      const rootDataId = rootNodeData.data.__id__
      const rootNodeDataRef = prefabData.value[rootDataId]
      
      if (rootNodeDataRef) {
        console.log('allNodes: found root node data:', rootNodeDataRef)
        
        // 递归创建节点树结构
        const createNode = (nodeData: any, level = 0, parentIsReference = false, parentIsInactive = false, originalIndex?: number): any => {
          // 获取组件信息
          const components: any[] = []
          if (nodeData._components && Array.isArray(nodeData._components)) {
            nodeData._components.forEach((compRef: any) => {
              const compData = prefabData.value[compRef.__id__]
              if (compData) {
                // 创建组件对象，包含所有属性
                const component = {
                  type: compData.__type__,
                  name: compData._name || compData.__type__,
                  enabled: compData._enabled !== false, // 默认启用
                  ...compData
                }
                components.push(component)
                console.log('createNode: added component:', component)
              }
            })
          }
          
          // 解析 _trs 数组
          let position = { x: 0, y: 0, z: 0 }
          let rotation = { x: 0, y: 0, z: 0 }
          let scale = { x: 1, y: 1, z: 1 }
          
          if (nodeData._trs && nodeData._trs.array && Array.isArray(nodeData._trs.array)) {
            const trs = nodeData._trs.array
            // 位置: 0,1,2
            position = { x: trs[0] || 0, y: trs[1] || 0, z: trs[2] || 0 }
            // 旋转: 3,4,5,6 (四元数)
            rotation = { x: trs[3] || 0, y: trs[4] || 0, z: trs[5] || 0 }
            // 缩放: 7,8,9
            scale = { x: trs[7] || 1, y: trs[8] || 1, z: trs[9] || 1 }
          }
          
          // 判断当前节点状态
          const isReference = nodeData._groupIndex === undefined || nodeData._groupIndex === null
          const isInactive = nodeData._active === false
          
          // 创建子节点数组
          const children: any[] = []
          if (nodeData._children && Array.isArray(nodeData._children)) {
            nodeData._children.forEach((childRef: any) => {
              const childNode = prefabData.value[childRef.__id__]
              if (childNode) {
                // 子节点继承父节点的状态，传递子节点的原始索引
                const child = createNode(childNode, level + 1, isReference || parentIsReference, isInactive || parentIsInactive, childRef.__id__)
                children.push(child)
              }
            })
          }
          
          const node = {
            id: originalIndex !== undefined ? `index_${originalIndex}` : `node_${level}_${nodeData._name}`,
            name: nodeData._name || `Node_${level}`,
            type: nodeData.__type__ || 'cc.Node',
            uuid: nodeData._id || nodeData.uuid,
            isRoot: level === 0,
            level: level,
            position: position,
            rotation: rotation,
            scale: scale,
            active: nodeData._active,
            opacity: nodeData._opacity !== undefined ? nodeData._opacity : 255,
            color: nodeData._color,
            contentSize: nodeData._contentSize,
            anchorPoint: nodeData._anchorPoint,
            skewX: nodeData._skewX || 0,
            skewY: nodeData._skewY || 0,
            groupIndex: nodeData._groupIndex,
            // 添加继承状态标记
            isReference: isReference || parentIsReference,
            isInactive: isInactive || parentIsInactive,
            components: components,
            children: children,
            // 添加原始数据引用
            originalIndex: originalIndex,
            originalData: nodeData
          }
          
          console.log('createNode: created node:', node)
          return node
        }
        
        const rootNode = createNode(rootNodeDataRef, 0, false, false, rootDataId)
  console.log('allNodes: final result:', [rootNode])
  return [rootNode]
} else {
  console.log('allNodes: no root node data found')
  return []
}
} else {
  console.log('allNodes: no root prefab found')
  return []
}
} else {
  console.log('allNodes: prefabData is not array')
  return []
}
})

// 计算所有节点数量（包括子节点）
const totalNodeCount = computed(() => {
  const countNodes = (nodes: any[]): number => {
    let count = 0
    for (const node of nodes) {
      count++
      if (node.children && node.children.length > 0) {
        count += countNodes(node.children)
      }
    }
    return count
  }
  return countNodes(allNodes.value)
})

const selectNode = (node: any) => {
  selectedNode.value = node
}

// 拖拽调整面板宽度功能
const startResize = (event: MouseEvent) => {
  isResizing.value = true
  startX.value = event.clientX
  startWidth.value = nodeTreeWidth.value
  
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  event.preventDefault()
}

const handleResize = (event: MouseEvent) => {
  if (!isResizing.value) return
  
  const deltaX = event.clientX - startX.value
  const newWidth = startWidth.value + deltaX
  
  // 限制最小和最大宽度
  const minWidth = 200
  const maxWidth = window.innerWidth - 150
  
  nodeTreeWidth.value = Math.max(minWidth, Math.min(maxWidth, newWidth))
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

onMounted(() => {
  console.log('PrefabUI component mounted')
  
  // 监听来自 VSCode 扩展的消息
  window.addEventListener('message', (event) => {
    const message = event.data
    console.log('PrefabUI: received message:', message)
    
    if (message.command === 'prefabData') {
      if (message.error) {
        console.error('PrefabUI: error from extension:', message.error)
        error.value = message.error
        loading.value = false
        return
      }
      
      if (message.data) {
        console.log('PrefabUI: received prefab data:', message.data)
        loading.value = false
        prefabData.value = message.data
        
        console.log('PrefabUI: data set, allNodes will be computed')
        console.log('PrefabUI: allNodes computed:', allNodes.value)
        console.log('PrefabUI: allNodes length:', allNodes.value.length)
        
        // 默认选择根节点
        if (allNodes.value.length > 0) {
          selectedNode.value = allNodes.value[0]
          console.log('PrefabUI: selectedNode set to:', selectedNode.value)
        }
      }
    }
  })
  
  // 请求初始数据
  console.log('PrefabUI: requesting initial prefab data')
  vscode.postMessage({ command: 'getPrefabData' })
})
</script>

<style scoped>
.prefab-ui {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
  color: #d4d4d4;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  height: 100vh;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #3c3c3c;
  border-top: 3px solid #007acc;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  padding: 20px;
  background-color: #5d1a1a;
  border: 1px solid #f44336;
  border-radius: 4px;
  color: #f44336;
  margin: 20px;
}

.prefab-layout {
  display: flex;
  height: 100vh;
  border-top: 1px solid #3c3c3c;
}

.node-tree-panel {
  min-width: 200px;
  max-width: 80%;
  border-right: 1px solid #3c3c3c;
  display: flex;
  flex-direction: column;
  background-color: #252526;
  resize: none;
}

.property-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
}

.panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid #3c3c3c;
  background-color: #2d2d30;
}

.panel-header h3 {
  margin: 0;
  color: #cccccc;
  font-size: 14px;
  font-weight: 600;
}

.tree-container {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.property-container {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

/* 可拖拽的分隔条样式 */
.resize-handle {
  width: 4px;
  background-color: #3c3c3c;
  cursor: col-resize;
  position: relative;
  transition: background-color 0.2s ease;
  user-select: none;
}

.resize-handle:hover {
  background-color: #007acc;
}

.resize-handle.resizing {
  background-color: #007acc;
}

/* 拖拽时的视觉反馈 */
.resize-handle::before {
  content: '';
  position: absolute;
  left: -2px;
  right: -2px;
  top: 0;
  bottom: 0;
  background-color: transparent;
}

.resize-handle:hover::before,
.resize-handle.resizing::before {
  background-color: rgba(0, 122, 204, 0.1);
}
</style>
