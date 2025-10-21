import * as vscode from 'vscode';
import MyWebviewViewProvider from './core/MyWebviewViewProvider';
import { PrefabPreviewProvider } from './core/PrefabPreviewProvider';
import { prefabFn, dealEditor } from './core/dealPrefabFile';
import { getNonce } from './utilities/getNonce';

export async function activate(context: vscode.ExtensionContext) {
  const webviewProvider = new MyWebviewViewProvider(context.extensionUri);
  const previewProvider = new PrefabPreviewProvider(context.extensionUri);

  context.subscriptions.push(vscode.languages.registerDefinitionProvider('prefab', prefabFn));

  // 注册预览提供者
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider('prefab-preview', previewProvider)
  );

  // 注册一个命令，用于解析 JSON 文件并创建对应的符号
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'uuidParser',
      webviewProvider,
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      }
    ),
    vscode.commands.registerCommand('creatorPrefab.parsePrefab', dealEditor),
    vscode.commands.registerCommand('creatorPrefab.showPrefabUI', async () => {
      // 打开prefab预览 - 使用Webview面板
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor && activeEditor.document.languageId === 'prefab') {
        // 创建Webview面板
        const panel = vscode.window.createWebviewPanel(
          'prefabUI',
          'Prefab UI',
          vscode.ViewColumn.Beside,
          {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'webview-ui', 'build')]
          }
        );

        // 设置Webview内容
        const webviewUri = vscode.Uri.joinPath(context.extensionUri, 'webview-ui', 'build', 'assets', 'index.js');
        const styleUri = vscode.Uri.joinPath(context.extensionUri, 'webview-ui', 'build', 'assets', 'index.css');
        const nonce = getNonce();

        panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${panel.webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <link rel="stylesheet" type="text/css" href="${panel.webview.asWebviewUri(styleUri)}">
  <style>
    /* 覆盖 VSCode 默认样式，实现全屏显示 */
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      height: 100% !important;
      overflow: hidden !important;
    }
    
    #app {
      width: 100% !important;
      height: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    
    /* 确保所有元素都没有默认边距 */
    * {
      box-sizing: border-box;
    }
  </style>
  <title>Prefab UI</title>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}">
    // 在页面加载前设置预览模式
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function() {
      originalPushState.apply(history, arguments);
      if (window.location.search !== '?mode=prefab-preview') {
        history.replaceState(null, '', '?mode=prefab-preview');
      }
    };
    
    history.replaceState = function() {
      originalReplaceState.apply(history, arguments);
      if (window.location.search !== '?mode=prefab-preview') {
        history.replaceState(null, '', '?mode=prefab-preview');
      }
    };
    
    // 立即设置
    if (window.location.search !== '?mode=prefab-preview') {
      history.replaceState(null, '', '?mode=prefab-preview');
    }
    
    console.log('Webview: URL set to', window.location.search);
  </script>
  <script type="module" nonce="${nonce}" src="${panel.webview.asWebviewUri(webviewUri)}"></script>
</body>
</html>`;

        // 监听Webview消息并发送prefab数据
        panel.webview.onDidReceiveMessage(async (message) => {
          if (message.command === 'getPrefabData') {
            try {
              const prefabContent = activeEditor.document.getText();
              const parsedData = JSON.parse(prefabContent);
              panel.webview.postMessage({
                command: 'prefabData',
                data: parsedData
              });
            } catch (e) {
              panel.webview.postMessage({
                command: 'prefabData',
                error: e instanceof Error ? e.message : 'Unknown error'
              });
            }
          } else if (message.command === 'jumpToNode') {
            // 处理跳转到节点功能
            try {
              const nodeName = message.nodeName;
              const nodeId = message.nodeId;
              const document = activeEditor?.document;

              if (document) {
                // 从 nodeId 中提取原始数组索引
                let nodeIndex = -1;
                if (nodeId && nodeId.startsWith('index_')) {
                  nodeIndex = parseInt(nodeId.replace('index_', ''));
                } else {
                  // 如果 nodeId 不是预期的格式，尝试解析prefab数据
                  const prefabContent = activeEditor.document.getText();
                  const parsedData = JSON.parse(prefabContent);

                  if (Array.isArray(parsedData)) {
                    // 查找节点在数组中的索引
                    for (let i = 0; i < parsedData.length; i++) {
                      const item = parsedData[i];
                      if (item._name === nodeName) {
                        nodeIndex = i;
                        break;
                      }
                    }
                  }
                }

                if (nodeIndex >= 0) {
                  // 使用原来的跳转逻辑
                  const { dealEditor } = await import('./core/dealPrefabFile');

                  // 先处理文档以计算行信息
                  const jsonObj = JSON.parse(document.getText());
                  let lineInfos: number[] = [];
                  if (Array.isArray(jsonObj)) {
                    jsonObj.forEach((item) => {
                      lineInfos.push(JSON.stringify(item, null, 2).split('\n').length);
                    });
                  }

                  // 计算目标行号（复用原来的逻辑）
                  let start = 1;
                  for (let i = 0; i < nodeIndex; i++) {
                    start += lineInfos[i];
                  }

                  // 跳转到对应行（在原来基础上加2行）
                  const targetLine = start + 2;
                  const position = new vscode.Position(targetLine, 0);
                  const selection = new vscode.Selection(position, position);

                  // 设置选择范围并高亮显示该行
                  activeEditor.selection = selection;
                  activeEditor.revealRange(selection, vscode.TextEditorRevealType.InCenter);

                  console.log(`跳转到节点 ${nodeName} (索引: ${nodeIndex}) 在第 ${targetLine + 1} 行`);
                } else {
                  console.log(`未找到节点 ${nodeName} 的数组索引`);
                }
              }
            } catch (e) {
              console.error('跳转到节点失败:', e);
              vscode.window.showErrorMessage(`跳转到节点失败: ${e instanceof Error ? e.message : 'Unknown error'}`);
            }
          }
        });

        // 发送初始数据
        setTimeout(() => {
          try {
            const prefabContent = activeEditor.document.getText();
            console.log('Extension: prefab content length:', prefabContent.length);
            console.log('Extension: prefab content preview:', prefabContent.substring(0, 200));
            const parsedData = JSON.parse(prefabContent);
            console.log('Extension: parsed data type:', typeof parsedData);
            console.log('Extension: parsed data keys:', Object.keys(parsedData || {}));
            console.log('Extension: parsed data:', parsedData);
            panel.webview.postMessage({
              command: 'prefabData',
              data: parsedData
            });
            console.log('Extension: message sent to webview');
          } catch (e) {
            console.log('Extension: error parsing prefab:', e);
            panel.webview.postMessage({
              command: 'prefabData',
              error: e instanceof Error ? e.message : 'Unknown error'
            });
          }
        }, 100);

      } else {
        vscode.window.showWarningMessage('请先打开一个prefab文件');
      }
    }),
    vscode.commands.registerCommand('creatorPrefab.switchToPrefabMode', () => {
      webviewProvider.switchToPrefabMode();
    }),
    vscode.window.onDidChangeActiveTextEditor(dealEditor)
  );

  dealEditor();
}
