import * as vscode from 'vscode';
import { getFileUri } from '../utilities/getUri';
import { getNonce } from '../utilities/getNonce';

export class PrefabPreviewProvider implements vscode.TextDocumentContentProvider {
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
  private _extensionUri: vscode.Uri;
  private _currentUri?: vscode.Uri;

  constructor(extensionUri: vscode.Uri) {
    this._extensionUri = extensionUri;
  }

  public provideTextDocumentContent(uri: vscode.Uri): string {
    this._currentUri = uri;
    const webviewUri = getFileUri(this._extensionUri, ['webview-ui', 'build', 'assets', 'index.js']);
    const styleUri = getFileUri(this._extensionUri, ['webview-ui', 'build', 'assets', 'index.css']);
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${vscode.Uri.file(this._extensionUri.fsPath)}; script-src 'nonce-${nonce}';">
  <link rel="stylesheet" type="text/css" href="${styleUri}">
  <title>Prefab Preview</title>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}">
    // 设置预览模式
    window.location.search = '?mode=prefab-preview';
    
    // 监听来自扩展的消息
    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.command === 'getPrefabData') {
        // 获取当前活动编辑器的prefab数据
        const activeEditor = window.vscode?.getActiveTextEditor?.();
        if (activeEditor && activeEditor.document.languageId === 'prefab') {
          try {
            const prefabContent = activeEditor.document.getText();
            const parsedData = JSON.parse(prefabContent);
            window.postMessage({
              command: 'prefabData',
              data: parsedData
            }, '*');
          } catch (e) {
            window.postMessage({
              command: 'prefabData',
              error: e.message
            }, '*');
          }
        } else {
          window.postMessage({
            command: 'prefabData',
            error: 'No active prefab file or file is not a prefab.'
          }, '*');
        }
      }
    });
  </script>
  <script nonce="${nonce}" src="${webviewUri}"></script>
</body>
</html>`;
  }

  get onDidChange(): vscode.Event<vscode.Uri> {
    return this._onDidChange.event;
  }

  public update(uri: vscode.Uri) {
    this._onDidChange.fire(uri);
  }
}
