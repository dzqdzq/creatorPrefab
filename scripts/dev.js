#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 启动VSCode插件开发环境...\n');

// 启动TypeScript编译监听
const tscProcess = spawn('npx', ['tsc', '-watch', '-p', './'], {
    stdio: 'inherit',
    shell: true
});

// 启动webview开发服务器
const webviewProcess = spawn('npm', ['run', 'dev:webview'], {
    cwd: path.join(__dirname, '../webview-ui'),
    stdio: 'inherit',
    shell: true
});

// 处理退出信号
process.on('SIGINT', () => {
    console.log('\n🛑 正在停止开发服务器...');
    tscProcess.kill();
    webviewProcess.kill();
    process.exit(0);
});

process.on('SIGTERM', () => {
    tscProcess.kill();
    webviewProcess.kill();
    process.exit(0);
});

console.log('✅ 开发环境已启动！');
console.log('📝 TypeScript编译监听中...');
console.log('🌐 Webview开发服务器启动中...');
console.log('💡 按 Ctrl+C 停止所有服务');
