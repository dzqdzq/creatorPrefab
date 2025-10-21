import * as vscode from 'vscode';
import { Webview, window } from 'vscode';
import { getUri } from '../utilities/getUri';
import { getNonce } from '../utilities/getNonce';
import * as uuidUtils from '../uuid-utils';
import { getLibraryInfos, getImportsPath } from './dealPrefabFile';
const vscodeFs = vscode.workspace.fs;
async function getSpriteFrame(uuid: string, libraryInfos: any) {
  const jsonPath = `${getImportsPath()}/${uuid.substring(0, 2)}/${uuid}.json`;
  const data = await vscodeFs.readFile(vscode.Uri.file(jsonPath));
  if (data.length <= 1) {
    return '';
  }
  try {
    const jsonObj = JSON.parse(data.toString()).content;
    const { name, texture } = jsonObj;
    if (!name || !texture) {
      return '';
    }
    return `${libraryInfos[texture].relativePath}/${name}`;
  } catch (e) {
    return '';
  }
}

export default class MyWebviewViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _isPrefabMode = false;

  constructor(private readonly _extensionUri: vscode.Uri) { }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
    };

    this.listen();
    this._view.webview.html = this._getWebviewContent(this._view.webview);


    this._view.onDidDispose(() => {
      console.log('WebviewPanel has been disposed');
      // Perform cleanup operations here
    });
  }// end resolveWebviewView

  public switchToPrefabMode() {
    this._isPrefabMode = true;
    if (this._view) {
      this._view.webview.postMessage({
        command: 'switchToPrefabMode'
      });
    }
  }

  public switchToUUIDMode() {
    this._isPrefabMode = false;
    if (this._view) {
      this._view.webview.postMessage({
        command: 'switchToUUIDMode'
      });
    }
  }

  private listen() {
    if (!this._view) {
      return;
    }
    this._view.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'parseUUID': {
          const libraryInfos = await getLibraryInfos();

          const uuid = message.text;
          if (!uuidUtils.isUuid(uuid)) {
            let tryPath: string = uuid;
            if (uuid.startsWith('assets/')) {
              tryPath = uuid.substring(7);
            }
            const ret: { [key: string]: string } = {};
            for (let uuid in libraryInfos) {
              const relativePath = libraryInfos[uuid].relativePath;
              if (relativePath.includes(tryPath)) {
                const isScript = relativePath.endsWith('.ts') || relativePath.endsWith('.js');
                ret[relativePath] = uuid;
                if (isScript) {
                  ret[relativePath] += ` (${uuidUtils.getShortUUID(uuid)[0]})`;
                }
              };
            }

            if (Object.keys(ret).length === 0) {
              // 发送空结果给webview，让前端处理
              this._view!.webview.postMessage({
                command: 'parseUUID_resp',
                text: { code: 'NOT_FOUND', message: `没有查询到${tryPath}的对应uuid` },
              });
            } else {
              // 将路径查询结果转换为统一格式
              const firstResult = Object.entries(ret)[0];
              const [path, uuid] = firstResult;

              // 生成统一格式的数据
              const longUUID = uuidUtils.getLongUUID(uuid);
              const shorts = uuidUtils.getShortUUID(longUUID);

              const info = {
                short1: shorts[0],
                short2: shorts[1],
                long: longUUID,
                path: path
              };

              this._view!.webview.postMessage({
                command: 'parseUUID_resp',
                text: info,
              });
            }

            return;
          }

          const longUUID = uuidUtils.getLongUUID(uuid);
          const shorts = uuidUtils.getShortUUID(longUUID);
          const entry = libraryInfos[longUUID];
          let path = entry?.relativePath;
          if (!path) {
            try {
              path = await getSpriteFrame(uuid, libraryInfos);
            } catch (e) {
              path = '';
            }
          }
          // 检查是否有有效结果
          if (!path || path === '') {
            // 没有找到对应的资源
            this._view!.webview.postMessage({
              command: 'parseUUID_resp',
              text: { code: 'NOT_FOUND', message: '未找到对应的资源' },
            });
          } else {
            const info = {
              short1: shorts[0],
              short2: shorts[1],
              long: longUUID,
              path
            };
            this._view!.webview.postMessage({
              command: 'parseUUID_resp',
              text: info,
            });
          }
          // webviewView.webview.setState({ html: webviewView.webview.html });
          break;
        }
      }
    });
  }

  private _getWebviewContent(webview: Webview) {
    const stylesUri = getUri(webview, this._extensionUri, [
      'webview-ui',
      'build',
      'assets',
      'index.css',
    ]);
    const scriptUri = getUri(webview, this._extensionUri, [
      'webview-ui',
      'build',
      'assets',
      'index.js',
    ]);

    const nonce = getNonce();

    // 安装es6-string-html插件以启用下面的代码高亮
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Hello World</title>
        </head>
        <body>
          <div id="app"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }
}
