#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🔧 修复所有调试问题...\n');

try {
    // 1. 重新安装webview依赖
    console.log('📦 重新安装webview依赖...');
    execSync('cd webview-ui && rm -rf node_modules && pnpm install', { stdio: 'inherit' });

    // 2. 构建webview
    console.log('🌐 构建Webview...');
    execSync('cd webview-ui && pnpm run build', { stdio: 'inherit' });

    // 3. 编译TypeScript
    console.log('📝 编译TypeScript...');
    execSync('pnpm run compile', { stdio: 'inherit' });

    console.log('✅ 所有问题已修复！');
    console.log('🚀 现在可以按F5启动调试了');
    console.log('💡 如果还有问题，请重启VSCode');

} catch (error) {
    console.error('❌ 修复失败:', error.message);
    console.log('💡 请手动运行以下命令：');
    console.log('   cd webview-ui && rm -rf node_modules && pnpm install');
    console.log('   cd webview-ui && pnpm run build');
    console.log('   pnpm run compile');
    process.exit(1);
}
