import { createApp } from 'vue'
import App from './App.vue'
import './App.css'
// 导入 Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 导入 Element Plus 图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
// 导入 creator-ui-kit 样式
import '@aspect/creator-ui-kit/dist/style.css'
import '@aspect/creator-ui-kit/src/cc/inspector/theme.css'
// 导入并注册自定义组件
// 注意：需要从 inspector 模块导入 registerComponent，因为 plugin.ts 中也有同名函数会覆盖
import { WidgetEditor } from '@aspect/creator-ui-kit/vue'
import { registerComponent } from '@aspect/creator-ui-kit/src/cc/inspector/component-registry'

const app = createApp(App)

// 使用 Element Plus
app.use(ElementPlus, {
  size: 'small',
})

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 注册 WidgetEditor 自定义组件到 Inspector 组件注册表
registerComponent('WidgetEditor', WidgetEditor)

app.mount('#app')
