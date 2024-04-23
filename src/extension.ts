import * as vscode from 'vscode';
import MyWebviewViewProvider from './core/MyWebviewViewProvider';
import { prefabFn, dealEditor } from './core/dealPrefabFile';

export async function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.languages.registerDefinitionProvider('prefab', prefabFn));

  // 注册一个命令，用于解析 JSON 文件并创建对应的符号
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'uuidParser',
      new MyWebviewViewProvider(context.extensionUri),
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      }
    ),
    vscode.commands.registerCommand('creatorPrefab.parsePrefab', dealEditor),
    vscode.window.onDidChangeActiveTextEditor(dealEditor)
  );

  dealEditor();
}
