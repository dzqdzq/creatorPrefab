<template>
  <div class="node-tree-container">
    <!-- 搜索框 -->
    <div class="search-container">
      <el-input v-model="filterText" placeholder="搜索节点..." class="search-input" />
    </div>

     <!-- Element Plus Tree 组件 -->
     <el-tree
       ref="treeRef"
       :data="treeData"
       :props="defaultProps"
       :filter-node-method="filterNode"
       :current-node-key="currentNodeKey"
       default-expand-all
       class="node-tree"
       nodeKey="id"
       @node-contextmenu="handleContextMenu"
     >
      <template #default="{ node, data }">
        <span
          class="node-label"
          :class="{
            inactive: data.active === false || data.isInactive,
            reference: data.isReference,
            invisible: data.opacity === 0,
          }"
          @click.stop="handleNodeClick(data)"
        >
          {{ data.name }}
        </span>
      </template>
    </el-tree>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { ElTree, ElInput } from 'element-plus';
import type { FilterNodeMethodFunction, TreeInstance } from 'element-plus';
import { vscode } from '../utilities/vscode';

interface Node {
  id: string;
  name: string;
  type: string;
  uuid?: string;
  isRoot?: boolean;
  level?: number;
  children?: any[];
  position?: any;
  rotation?: any;
  scale?: any;
  components?: any[];
  parent?: string;
  active?: boolean;
  groupIndex?: number;
  opacity?: number;
  isReference?: boolean;
  isInactive?: boolean;
}

interface Props {
  nodes: Node[];
  selectedNode?: Node | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  selectNode: [node: Node];
}>();

// 完全按照demo实现
const filterText = ref('');
const treeRef = ref<TreeInstance>();

// 当前选中的节点key
const currentNodeKey = computed(() => {
  return props.selectedNode?.id || '';
});

// 监听选中节点变化，更新Tree的当前节点
watch(() => props.selectedNode, (newNode) => {
  if (newNode && treeRef.value && newNode.id) {
    try {
      treeRef.value.setCurrentKey(newNode.id);
    } catch (e) {
      console.warn('设置当前节点失败:', e);
    }
  }
}, { immediate: true });

const defaultProps = {
  children: 'children',
  label: 'name',
  isLeaf: (data: any) => {
    return !data.children || data.children.length === 0;
  },
};

// 计算所有节点数量（包括子节点）
const totalNodeCount = computed(() => {
  const countNodes = (nodes: Node[]): number => {
    let count = 0;
    for (const node of nodes) {
      count++;
      if (node.children && node.children.length > 0) {
        count += countNodes(node.children);
      }
    }
    return count;
  };
  return countNodes(props.nodes);
});

// 树形数据
const treeData = computed(() => {
  console.log('NodeTree: treeData computed, props.nodes:', props.nodes);
  if (props.nodes && props.nodes.length > 0) {
    console.log('NodeTree: first node:', props.nodes[0]);
    if (props.nodes[0].children) {
      console.log('NodeTree: first node children:', props.nodes[0].children);
    }
  }
  return props.nodes || [];
});

// 监听搜索查询变化
watch(filterText, (val) => {
  treeRef.value!.filter(val);
});

// 监听节点数据变化，设置默认展开根节点
watch(
  () => props.nodes,
  (newNodes) => {
    if (newNodes && newNodes.length > 0 && treeRef.value) {
      // 延迟执行，确保树组件已渲染
      setTimeout(() => {
        // 只展开根节点，保持层级缩进效果
        for (const node of newNodes) {
          if (node.children && node.children.length > 0) {
            const treeInstance = treeRef.value as any;
            if (treeInstance && treeInstance.setExpanded) {
              treeInstance.setExpanded(node.id, true);
            }
          }
        }
      }, 100);
    }
  },
  { immediate: true }
);

// Element Plus Tree 的过滤方法
const filterNode: FilterNodeMethodFunction = (value: string, data: any) => {
  if (!value) return true;
  return data.name.toLowerCase().includes(value.toLowerCase());
};

// 处理节点点击
const handleNodeClick = (data: Node) => {
  console.log('NodeTree: node clicked:', data);
  
  // 手动设置 Tree 的当前节点
  if (treeRef.value && data.id) {
    try {
      console.log('NodeTree: setting current node:', data.id);
      treeRef.value.setCurrentKey(data.id);
    } catch (e) {
      console.warn('设置当前节点失败:', e);
    }
  }
  
  // 发送消息给 VSCode 扩展，请求跳转到对应行
  const message = {
    command: 'jumpToNode',
    nodeName: data.name,
    nodeId: data.id
  };
  console.log('NodeTree: sending message:', message);
  vscode.postMessage(message);
  
  emit('selectNode', data);
};

// 处理右键菜单
const handleContextMenu = (event: MouseEvent, data: Node) => {
  event.preventDefault();
  console.log('NodeTree: context menu:', data);

  // 获取节点路径
  const nodePath = getNodePath(data);

  // 创建自定义右键菜单
  const contextMenu = document.createElement('div');
  contextMenu.className = 'custom-context-menu';

  // 创建复制节点名选项
  const copyNameItem = document.createElement('div');
  copyNameItem.className = 'context-menu-item';
  copyNameItem.innerHTML = `
    <span>复制节点名</span>
    <span class="shortcut">⌘ C</span>
  `;
  copyNameItem.addEventListener('click', () => {
    copyNodeName(data.name);
    closeMenu();
  });

  // 创建复制节点路径选项
  const copyPathItem = document.createElement('div');
  copyPathItem.className = 'context-menu-item';
  copyPathItem.innerHTML = `
    <span>复制节点路径</span>
    <span class="shortcut">⌘ Shift C</span>
  `;
  copyPathItem.addEventListener('click', () => {
    copyNodePath(nodePath);
    closeMenu();
  });

  // 添加选项到菜单
  contextMenu.appendChild(copyNameItem);
  contextMenu.appendChild(copyPathItem);

  // 设置菜单位置
  contextMenu.style.position = 'fixed';
  contextMenu.style.left = event.clientX + 'px';
  contextMenu.style.top = event.clientY + 'px';
  contextMenu.style.zIndex = '1000';

  // 添加到页面
  document.body.appendChild(contextMenu);

  // 点击其他地方关闭菜单
  const closeMenu = () => {
    if (document.body.contains(contextMenu)) {
      document.body.removeChild(contextMenu);
    }
    document.removeEventListener('click', closeMenu);
  };

  setTimeout(() => {
    document.addEventListener('click', closeMenu);
  }, 0);
};

// 获取节点路径
const getNodePath = (targetNode: Node): string => {
  const pathParts: string[] = [];

  // 从根节点开始递归查找目标节点
  const findPath = (nodes: Node[], currentPath: string[]): boolean => {
    for (const node of nodes) {
      const newPath = [...currentPath, node.name];

      // 如果找到目标节点
      if (node.id === targetNode.id) {
        pathParts.push(...newPath);
        return true;
      }

      // 如果有子节点，递归查找
      if (node.children && node.children.length > 0) {
        if (findPath(node.children, newPath)) {
          return true;
        }
      }
    }
    return false;
  };

  // 从根节点开始查找
  findPath(props.nodes, []);

  return pathParts.join('/');
};

// 复制节点名到剪贴板
const copyNodeName = (nodeName: string) => {
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(nodeName)
      .then(() => {
        console.log('节点名已复制到剪贴板:', nodeName);
      })
      .catch((err) => {
        console.error('复制失败:', err);
      });
  } else {
    // 降级方案
    const textArea = document.createElement('textarea');
    textArea.value = nodeName;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    console.log('节点名已复制到剪贴板:', nodeName);
  }
};

// 复制节点路径到剪贴板
const copyNodePath = (nodePath: string) => {
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(nodePath)
      .then(() => {
        console.log('节点路径已复制到剪贴板:', nodePath);
      })
      .catch((err) => {
        console.error('复制失败:', err);
      });
  } else {
    // 降级方案
    const textArea = document.createElement('textarea');
    textArea.value = nodePath;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    console.log('节点路径已复制到剪贴板:', nodePath);
  }
};

// 键盘快捷键处理
const handleKeyDown = (event: KeyboardEvent) => {
  // 检查是否按下了 Cmd/Ctrl + C
  if ((event.metaKey || event.ctrlKey) && event.key === 'c') {
    if (props.selectedNode) {
      event.preventDefault();

      // 检查是否同时按下了 Shift（复制路径）
      if (event.shiftKey) {
        const nodePath = getNodePath(props.selectedNode);
        copyNodePath(nodePath);
      } else {
        // 只按 Cmd/Ctrl + C（复制节点名）
        copyNodeName(props.selectedNode.name);
      }
    }
  }
};

// 添加键盘事件监听器
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

// 清理事件监听器
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.node-tree-container {
  height: 100%;
  background-color: #1e1e1e;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.node-tree {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: #1e1e1e;
}

.search-container {
  padding: 8px;
  background-color: #2d2d30;
  border-bottom: 1px solid #3c3c3c;
}

.search-input {
  width: 100% !important;
}

/* 修复Element Plus Tree布局问题 */
:deep(.el-tree) {
  background-color: #1e1e1e;
  color: #d4d4d4;
}

:deep(.el-tree-node__content) {
  color: #d4d4d4;
  display: flex !important;
  align-items: center !important;
  white-space: nowrap !important;
}

:deep(.el-tree-node__content:hover) {
  background-color: #2a2d2e;
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: #2d2d30 !important;
}

:deep(.el-tree-node.is-current > .el-tree-node__content:hover) {
  background-color: #2d2d30 !important;
}

:deep(.el-tree-node__expand-icon) {
  flex-shrink: 0 !important;
  margin-right: 4px !important;
  color: #cccccc !important;
  font-size: 12px !important;
  width: 16px !important;
  height: 16px !important;
  line-height: 16px !important;
  text-align: center !important;
  display: inline-block !important;
  transition: transform 0.2s ease !important;
}

/* 叶子节点显示占位图标 */
:deep(.el-tree-node__expand-icon.is-leaf) {
  width: 16px !important;
  height: 16px !important;
  margin-right: 4px !important;
  display: inline-block !important;
  visibility: hidden !important; /* 占位但不显示内容 */
}

/* 展开状态：三角形朝下 */
:deep(.el-tree-node__expand-icon:not(.is-leaf)) {
  content: '▶' !important;
}

:deep(.el-tree-node__expand-icon:not(.is-leaf).expanded) {
  content: '▼' !important;
  transform: rotate(90deg) !important;
}

:deep(.el-tree-node__label) {
  color: #3fc345; /* 默认绿色 */
  flex: 1 !important;
  white-space: nowrap !important;
}

/* 节点状态样式 */
.node-label.inactive {
  opacity: 0.6 !important;
}

.node-label.reference {
  color: #3fc345 !important; /* 绿色 */
}

.node-label.invisible {
  opacity: 0.4 !important;
}

/* Element Plus Input 样式覆盖 */
:deep(.el-input__wrapper) {
  background-color: #1e1e1e !important;
  border-radius: 0 !important;
}

:deep(.el-input__wrapper:hover) {
  border: none !important;
  box-shadow: none !important;
}

:deep(.el-input__wrapper.is-focus) {
  border: none !important;
  box-shadow: none !important;
}

:deep(.el-input__inner) {
  background-color: transparent !important;
  color: #d4d4d4 !important;
  font-size: 13px !important;
  border: none !important;
  box-shadow: none !important;
  width: 100% !important;
}

:deep(.el-input__inner::placeholder) {
  color: #6a6a6a !important;
}

/* 自定义右键菜单样式 */
:global(.custom-context-menu) {
  background-color: #2d2d30;
  border: 1px solid #3c3c3c;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  padding: 4px 0;
  min-width: 100px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

:global(.context-menu-item) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  color: #d4d4d4;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 13px;
}

:global(.context-menu-item:hover) {
  background-color: #0e639c;
  color: #ffffff;
}

:global(.shortcut) {
  color: #6a6a6a;
  font-size: 11px;
  margin-left: 8px;
}

:global(.context-menu-item:hover .shortcut) {
  color: #cccccc;
}
</style>
