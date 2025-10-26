const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 开始打包VSCode插件...');

// 清理之前的打包文件
const packageDir = path.join(__dirname, '..', 'package');
if (fs.existsSync(packageDir)) {
    fs.rmSync(packageDir, { recursive: true, force: true });
}

// 创建package目录
fs.mkdirSync(packageDir, { recursive: true });

// 需要复制的文件列表
const filesToCopy = [
    // 核心配置文件
    'package.json',
    'README.md',
    'CHANGELOG.md',
    'LICENSE',

    // 语言配置
    'language-configuration.json',
    'schema.json',

    // 语法文件
    'syntaxes/JSON.tmLanguage.json',
    'syntaxes/JSONC.tmLanguage.json',
    'syntaxes/JSONL.tmLanguage.json',

    // 图标文件
    'images/logo.png',
    'images/logo@2x.png',
    'images/logo@3x.png',
    'images/dzq.svg',
    'images/image3.0.0.png',
    'images/image2.2.1.png',
    'images/image1.9.8.png',
    'images/image1.3.0.png',
    'images/image1.2.8.png',
    'images/image1.2.5.png',
    'images/image1.1.8.png',
    'images/image1.1.5.png',
    'images/image-1.png',
    'prefablogo.svg',

    // 编译后的文件
    'out/extension.js',
    'out/core/UuidQueryProvider.js',
    'out/core/PrefabUIProvider.js',
    'out/core/dealPrefabFile.js',
    'out/utilities/getNonce.js',
    'out/utilities/getUri.js',
    'out/uuid-utils.js',
    'webview-ui/build/index.html',
    'webview-ui/build/assets/index.css',
    'webview-ui/build/assets/index.js'
];

// 复制文件
filesToCopy.forEach(file => {
    const srcPath = path.join(__dirname, '..', file);
    const destPath = path.join(packageDir, file);

    if (fs.existsSync(srcPath)) {
        // 确保目标目录存在
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        // 复制文件
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ 复制: ${file}`);
    } else {
        console.log(`⚠️  文件不存在: ${file}`);
    }
});

// 创建package.json的简化版本（移除开发依赖）
const packageJsonPath = path.join(packageDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// 移除开发相关的字段
delete packageJson.devDependencies;
delete packageJson.dependencies;
delete packageJson.scripts;
delete packageJson.repository;
delete packageJson.bugs;
delete packageJson.keywords;

// 更新main字段指向正确的路径
packageJson.main = './out/extension.js';

// 写入简化的package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('✅ 创建简化的package.json');

// 检查关键文件是否存在
const criticalFiles = [
    'out/extension.js',
    'webview-ui/build/index.html',
    'webview-ui/build/assets/index.css',
    'webview-ui/build/assets/index.js'
];

let allFilesExist = true;
criticalFiles.forEach(file => {
    const filePath = path.join(packageDir, file);
    if (!fs.existsSync(filePath)) {
        console.log(`❌ 关键文件缺失: ${file}`);
        allFilesExist = false;
    }
});

if (!allFilesExist) {
    console.log('❌ 打包失败：关键文件缺失，请先运行 npm run build');
    process.exit(1);
}

// 计算文件大小
function getDirectorySize(dirPath) {
    let totalSize = 0;

    function calculateSize(itemPath) {
        const stats = fs.statSync(itemPath);
        if (stats.isDirectory()) {
            const files = fs.readdirSync(itemPath);
            files.forEach(file => {
                calculateSize(path.join(itemPath, file));
            });
        } else {
            totalSize += stats.size;
        }
    }

    calculateSize(dirPath);
    return totalSize;
}

const packageSize = getDirectorySize(packageDir);
const packageSizeKB = Math.round(packageSize / 1024);
const packageSizeMB = Math.round(packageSize / (1024 * 1024) * 100) / 100;

console.log(`📊 打包完成！`);
console.log(`📁 输出目录: ${packageDir}`);
console.log(`📏 总大小: ${packageSizeKB} KB (${packageSizeMB} MB)`);

// 列出包含的文件
console.log('\n📋 包含的文件:');
function listFiles(dir, prefix = '') {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            console.log(`${prefix}📁 ${file}/`);
            listFiles(filePath, prefix + '  ');
        } else {
            const sizeKB = Math.round(stats.size / 1024);
            console.log(`${prefix}📄 ${file} (${sizeKB} KB)`);
        }
    });
}

listFiles(packageDir);

console.log('\n🎉 插件打包完成！');
console.log(`📦 可以上传到VSCode商店的文件位于: ${packageDir}`);
console.log('💡 提示: 使用 vsce package 命令可以创建 .vsix 文件');
