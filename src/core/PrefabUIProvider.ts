import * as vscode from 'vscode';
import { getUri } from '../utilities/getUri';
import { getNonce } from '../utilities/getNonce';

export class PrefabUIProvider {
    private _extensionUri: vscode.Uri;
    private _panel?: vscode.WebviewPanel;

    constructor(extensionUri: vscode.Uri) {
        this._extensionUri = extensionUri;
    }

    public createPrefabUI(activeEditor: vscode.TextEditor): vscode.WebviewPanel {
        // 创建Webview面板
        const panel = vscode.window.createWebviewPanel(
            'prefabUI',
            'Prefab UI',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'build')]
            }
        );

        this._panel = panel;

        // 设置Webview内容
        this._setupWebviewContent(panel);

        // 监听Webview消息
        this._setupMessageListener(panel, activeEditor);

        // 延迟发送初始数据，确保 Webview 已经准备好接收消息
        setTimeout(() => {
            this._sendPrefabData(panel, activeEditor);
        }, 100);

        return panel;
    }

    private _setupWebviewContent(panel: vscode.WebviewPanel) {
        const webviewUri = vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'build', 'assets', 'index.js');
        const styleUri = vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'build', 'assets', 'index.css');
        const nonce = getNonce();

        panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${panel.webview.cspSource}; script-src 'nonce-${nonce}';">
  <link rel="stylesheet" type="text/css" href="${panel.webview.asWebviewUri(styleUri)}">
  <title>Prefab UI</title>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}">
    // 设置预览模式
    window.location.search = '?mode=prefab-preview';
  </script>
  <script type="module" nonce="${nonce}" src="${panel.webview.asWebviewUri(webviewUri)}"></script>
</body>
</html>`;
    }

    private _setupMessageListener(panel: vscode.WebviewPanel, activeEditor: vscode.TextEditor) {
        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'getPrefabData':
                    this._sendPrefabData(panel, activeEditor);
                    break;
                case 'refreshPrefabData':
                    // 当编辑器内容变化时刷新数据
                    this._sendPrefabData(panel, activeEditor);
                    break;
            }
        });

        // 监听编辑器内容变化
        const disposable = vscode.workspace.onDidChangeTextDocument((event) => {
            if (event.document === activeEditor.document) {
                panel.webview.postMessage({
                    command: 'refreshPrefabData'
                });
            }
        });

        panel.onDidDispose(() => {
            disposable.dispose();
        });
    }

    private _sendPrefabData(panel: vscode.WebviewPanel, activeEditor: vscode.TextEditor) {
        try {
            const prefabContent = activeEditor.document.getText();
            console.log('PrefabUIProvider: sending prefab data, content length:', prefabContent.length);
            const parsedData = JSON.parse(prefabContent);
            console.log('PrefabUIProvider: parsed data:', parsedData);
            panel.webview.postMessage({
                command: 'prefabData',
                data: parsedData
            });
            console.log('PrefabUIProvider: message sent successfully');
        } catch (e) {
            console.log('PrefabUIProvider: error parsing prefab data:', e);
            panel.webview.postMessage({
                command: 'prefabData',
                error: e instanceof Error ? e.message : 'Unknown error'
            });
        }
    }

    public dispose() {
        if (this._panel) {
            this._panel.dispose();
        }
    }
}
