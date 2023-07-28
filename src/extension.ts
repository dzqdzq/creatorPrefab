import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  let lineInfos: number[] | null = null;
  function getStartEnd(index: number): { start?: number; end?: number } {
    if (!lineInfos) {
      return {};
    }
    let start = 1;
    let end = 0;
    for (let i = 0; i < index; i++) {
      start += lineInfos[i];
    }
    end = start + lineInfos[index];
    return { start, end };
  }

  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider('prefab', {
      provideDefinition(document, position) {
        if (!lineInfos) {
          return;
        }
        // 获取当前光标所在的位置
        const line = document.lineAt(position);

        // 如果当前单词是 "__id__"，则跳转到对应的行号
        const regex = /"__id__":\s*(\d+)/g;
        let match = regex.exec(line.text);
        if (match) {
          const { start, end } = getStartEnd(parseInt(match[1]));
          if (start && end) {
            const newPosition = new vscode.Position(start, 0);
            const endPosition = new vscode.Position(end, 0);
            return new vscode.Location(
              document.uri,
              new vscode.Range(newPosition, endPosition)
            );
          }
        }
      },
    })
  );

  function watch(document: vscode.TextDocument): any {
    // 检查当前打开的文件是否是 .json 文件
    if (document.languageId === 'prefab') {
      lineInfos = null;
      // 获取第三行的内容
      const line = document.lineAt(2).text.trim();
      if (
        line !== '"__type__": "cc.Prefab",' &&
        line !== '"__type__": "cc.SceneAsset",'
      ) {
        return;
      }
      const jsonObj = JSON.parse(document.getText());
      if (Array.isArray(jsonObj)) {
        lineInfos = [];
        jsonObj.forEach((item) => {
          lineInfos!.push(JSON.stringify(item, null, 2).split('\n').length);
        });
      }
    }
  }

  // 注册一个命令，用于解析 JSON 文件并创建对应的符号
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(watch),
    vscode.workspace.onDidSaveTextDocument(watch),
    vscode.workspace.onDidChangeTextDocument((document) =>
      watch(document.document)
    ),
    vscode.window.onDidChangeActiveTextEditor(
      (editor) => editor && watch(editor.document)
    )
  );

  vscode.workspace.textDocuments.forEach(watch);
}
