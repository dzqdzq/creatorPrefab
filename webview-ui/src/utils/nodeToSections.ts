/**
 * 将节点数据转换为 Inspector SectionData 格式
 */
import {
  section,
  numberProp,
  stringProp,
  booleanProp,
  vec2Prop,
  vec3Prop,
  colorProp,
  sizeProp,
  enumProp,
  type SectionData,
} from '@aspect/creator-ui-kit/vue'

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

/**
 * 将节点转换为 SectionData 数组
 */
export function nodeToSections(node: Node | null, prefabData?: any): SectionData[] {
  if (!node) {
    return []
  }

  const sections: SectionData[] = []

  // 1. Node 基础属性 Section
  const nodeSection = section('node', 'cc.Node')
    .enableable(node.active ?? true)

  // position
  if (node.position) {
    const pos = node.position
    nodeSection.prop(
      'position',
      vec3Prop({ tooltip: '节点在世界坐标系中的位置 (cc.Vec3)' }),
      { x: pos.x || 0, y: pos.y || 0, z: pos.z || 0 }
    )
  }

  // rotation
  if (node.rotation) {
    const rot = node.rotation
    nodeSection.prop(
      'rotation',
      vec2Prop({ labels: ['X', 'Y'], tooltip: '节点的旋转，以欧拉角表示 (cc.Vec2)' }),
      { x: rot.x || 0, y: rot.y || 0 }
    )
  }

  // scale
  if (node.scale) {
    const scale = node.scale
    nodeSection.prop(
      'scale',
      vec3Prop({ step: 0.1, tooltip: '节点的缩放比例 (cc.Vec3)' }),
      { x: scale.x ?? 1, y: scale.y ?? 1, z: scale.z ?? 1 }
    )
  }

  // anchor
  if (node.anchorPoint) {
    nodeSection.prop(
      'anchor',
      vec2Prop({
        labels: ['X', 'Y'],
        step: 0.1,
        tooltip: '节点的锚点，以百分比为单位 (cc.Vec2)',
      }),
      { x: node.anchorPoint.x ?? 0.5, y: node.anchorPoint.y ?? 0.5 }
    )
  }

  // size
  if (node.contentSize) {
    nodeSection.prop(
      'size',
      sizeProp({ labels: ['W', 'H'], tooltip: '节点的尺寸 (cc.Size)' }),
      {
        width: node.contentSize.width || 0,
        height: node.contentSize.height || 0,
      }
    )
  }

  // color
  if (node.color) {
    const c = node.color
    nodeSection.prop(
      'color',
      colorProp({ tooltip: '节点的颜色 (cc.Color)' }),
      {
        r: Math.round(c.r ?? 255),
        g: Math.round(c.g ?? 255),
        b: Math.round(c.b ?? 255),
        a: Math.round(c.a ?? 255),
      }
    )
  }

  // opacity
  if (node.opacity !== undefined) {
    nodeSection.prop(
      'opacity',
      numberProp({ min: 0, max: 255, tooltip: '节点的透明度，范围 0-255' }),
      node.opacity
    )
  }

  // skew
  if (node.skewX !== undefined || node.skewY !== undefined) {
    nodeSection.prop(
      'skew',
      vec2Prop({ labels: ['X', 'Y'], tooltip: '节点的倾斜角度' }),
      { x: node.skewX || 0, y: node.skewY || 0 }
    )
  }

  // group
  if (node.groupIndex !== undefined) {
    nodeSection.prop(
      'group',
      enumProp({
        options: Array.from({ length: 10 }, (_, i) => ({
          label: `group_${i}`,
          value: `group_${i}`,
        })),
        tooltip: '节点所属的组',
      }),
      `group_${node.groupIndex || 0}`
    )
  }

  sections.push(nodeSection.build())

  // 2. 组件 Sections
  if (node.components && node.components.length > 0) {
    for (const component of node.components) {
      const componentSection = buildComponentSection(component, prefabData)
      if (componentSection) {
        sections.push(componentSection)
      }
    }
  }

  return sections
}

/**
 * 构建组件 Section
 */
function buildComponentSection(component: any, prefabData?: any): SectionData | null {
  if (!component || !component.type) {
    return null
  }

  const componentType = component.type
  const sectionId = `component_${componentType.replace(/\./g, '_')}`

  // 特殊处理 Widget 组件 - 使用自定义组件
  if (componentType === 'cc.Widget') {
    return {
      id: sectionId,
      header: {
        title: componentType,
        enableable: true,
        enabled: component.enabled ?? true,
      },
      customComponent: 'WidgetEditor',
      data: {
        isAlignTop: component._isAbsTop ?? false,
        isAlignBottom: component._isAbsBottom ?? false,
        isAlignLeft: component._isAbsLeft ?? false,
        isAlignRight: component._isAbsRight ?? false,
        isAlignHorizontalCenter: component._isAbsHorizontalCenter ?? false,
        isAlignVerticalCenter: component._isAbsVerticalCenter ?? false,
        top: component._top ?? 0,
        bottom: component._bottom ?? 0,
        left: component._left ?? 0,
        right: component._right ?? 0,
        horizontalCenter: component._horizontalCenter ?? 0,
        verticalCenter: component._verticalCenter ?? 0,
        isAbsoluteTop: component._isAbsTop ?? false,
        isAbsoluteBottom: component._isAbsBottom ?? false,
        isAbsoluteLeft: component._isAbsLeft ?? false,
        isAbsoluteRight: component._isAbsRight ?? false,
        isAbsoluteHorizontalCenter: component._isAbsHorizontalCenter ?? false,
        isAbsoluteVerticalCenter: component._isAbsVerticalCenter ?? false,
        target: component.target || null,
        alignMode: component.alignMode || 0,
      },
      properties: [],
    }
  }

  // 其他组件使用通用属性渲染
  const componentSection = section(sectionId, componentType).enableable(
    component.enabled ?? true
  )

  // 遍历组件属性
  const excludeKeys = [
    '__type__',
    'type',
    'enabled',
    '_enabled',
    '_objFlags',
    'name',
    '_name',
    'node',
  ]

  for (const [key, value] of Object.entries(component)) {
    if (excludeKeys.includes(key)) {
      continue
    }

    // 根据值类型推断 Schema
    if (typeof value === 'boolean') {
      componentSection.prop(key, booleanProp(), value)
    } else if (typeof value === 'number') {
      componentSection.prop(key, numberProp(), value)
    } else if (typeof value === 'string') {
      componentSection.prop(key, stringProp(), value)
    } else if (value === null || value === undefined) {
      componentSection.prop(key, stringProp(), '')
    } else {
      // 复杂类型，使用 JSON 字符串显示
      componentSection.prop(
        key,
        stringProp({ readonly: true }),
        JSON.stringify(value)
      )
    }
  }

  return componentSection.build()
}

