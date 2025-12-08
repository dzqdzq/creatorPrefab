#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 启动VSCode插件调试环境...\n');

// 检查是否在VSCode中运行
const isVSCode = process.env.VSCODE_PID || process.env.VSCODE_INJECTION;

if (isVSCode) {
    console.log('✅ 在VSCode中运行，建议使用F5调试模式');
    console.log('💡 按F5启动"Run Extension"配置');
    console.log('🔧 或者使用Ctrl+Shift+P -> "Debug: Start Debugging"');
} else {
    console.log('🌐 启动Webview开发服务器...');

    // 启动webview开发服务器
    const webviewProcess = spawn('pnpm', ['run', 'dev'], {
        cwd: path.join(__dirname, '../webview-ui'),
        stdio: 'inherit',
        shell: true
    });

    // 处理退出信号
    process.on('SIGINT', () => {
        console.log('\n🛑 正在停止开发服务器...');
        webviewProcess.kill();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        webviewProcess.kill();
        process.exit(0);
    });

    console.log('✅ Webview开发服务器已启动！');
    console.log('🌐 访问 http://localhost:5173 预览Webview');
    console.log('💡 按 Ctrl+C 停止服务');
}
