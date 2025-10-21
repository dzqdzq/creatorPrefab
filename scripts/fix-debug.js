#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🔧 修复VSCode调试配置...\n');

try {
    // 1. 编译TypeScript
    console.log('📝 编译TypeScript...');
    execSync('npm run compile', { stdio: 'inherit' });

    // 2. 构建webview
    console.log('🌐 构建Webview...');
    execSync('npm run build:webview', { stdio: 'inherit' });

    console.log('✅ 修复完成！');
    console.log('🚀 现在可以按F5启动调试了');

} catch (error) {
    console.error('❌ 修复失败:', error.message);
    console.log('💡 请手动运行以下命令：');
    console.log('   npm run compile');
    console.log('   npm run build:webview');
    process.exit(1);
}
