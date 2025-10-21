# 🎮 Cocos Creator Prefab Parser

一个强大的VSCode扩展，用于解析Cocos Creator Prefab文件，支持UUID查询和资源跳转。

## ✨ 功能特性

- 🔍 **UUID查询** - 快速查询UUID对应的资源路径
- 🎯 **资源跳转** - 支持从UUID跳转到对应资源
- 🎨 **语法高亮** - 高亮显示Prefab文件中的UUID引用
- 📁 **多格式支持** - 支持JSON、JSONC、JSONL文件
- 🚀 **实时查询** - 在侧边栏实时查询UUID信息

## 🛠️ 开发指南

### 项目结构
```
src/                    # 主扩展源码
├── core/              # 核心功能
├── utilities/         # 工具函数
└── extension.ts       # 扩展入口

webview-ui/            # Vue3 Webview UI
├── src/components/    # Vue组件
└── src/utilities/    # 工具函数
```

### 开发命令
```bash
# 安装依赖
npm run install:all

# 开发模式
npm run dev

# 调试模式
npm run debug

# 构建项目
npm run build

# 修复问题
npm run fix
```

### 调试流程
1. 按F5启动调试
2. 在新窗口中测试功能
3. 查看控制台输出

## 📦 发布说明

### v2.2.2
- ✅ 完整的UUID查询功能
- ✅ Vue3 Webview界面
- ✅ 优化的用户体验
- ✅ 完善的错误处理

## 🙏 赞助商

如果本插件对您有用，可以支持一下, 谢谢

| 赞助商 | 金额 |
|--------|------|
| **云哥哥** ⭐ | 10元 |
| **峰哥** ⭐ | 10元 |
| **治亿** | 5元 |
| **冷高峰** | 5元 |