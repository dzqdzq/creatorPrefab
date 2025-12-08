#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🔨 开始构建VSCode插件...\n');

try {
    // 1. 编译TypeScript
    console.log('📝 编译TypeScript...');
    execSync('npx tsc -p ./', { stdio: 'inherit' });

    // 2. 构建webview
    console.log('🌐 构建Webview...');
    execSync('pnpm run build', {
        cwd: path.join(__dirname, '../webview-ui'),
        stdio: 'inherit'
    });

    console.log('✅ 构建完成！');
    console.log('📦 插件已准备好发布');

} catch (error) {
    console.error('❌ 构建失败:', error.message);
    process.exit(1);
}
