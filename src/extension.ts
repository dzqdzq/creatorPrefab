import * as vscode from 'vscode';
import UuidQueryProvider from './core/UuidQueryProvider';
import { PrefabUIProvider } from './core/PrefabUIProvider';
import { prefabFn, dealEditor } from './core/dealPrefabFile';

export async function activate(context: vscode.ExtensionContext) {
  const uuidQueryProvider = new UuidQueryProvider(context.extensionUri);
  const prefabUIProvider = new PrefabUIProvider(context.extensionUri);

  context.subscriptions.push(vscode.languages.registerDefinitionProvider('prefab', prefabFn));

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'uuidParser',
      uuidQueryProvider,// 侧边栏UUID查询
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      }
    ),
    vscode.commands.registerCommand('creatorPrefab.parsePrefab', dealEditor),
    vscode.commands.registerCommand('creatorPrefab.showPrefabUI', () => {
      prefabUIProvider.showPrefabUI();// 预览模式
    }),
    vscode.window.onDidChangeActiveTextEditor(dealEditor)
  );

  dealEditor();
}
