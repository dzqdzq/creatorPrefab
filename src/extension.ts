import * as vscode from 'vscode';
const fs = vscode.workspace.fs;

let lineInfos: number[] | null = null;
let libraryInfos: { [key: string]: { relativePath: string } } = {};
let isHaveLibrary = false;
let importsPath: string | null = null;

async function getSpriteFrame(uuid: string) {
  const jsonPath = `${importsPath}/${uuid.substring(0, 2)}/${uuid}.json`;
  const data = await fs.readFile(vscode.Uri.file(jsonPath));
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

function preLineInfos(document: vscode.TextDocument): any {
  lineInfos = null;
  const jsonObj = JSON.parse(document.getText());
  if (Array.isArray(jsonObj)) {
    lineInfos = [];
    jsonObj.forEach((item) => {
      lineInfos!.push(JSON.stringify(item, null, 2).split('\n').length);
    });
  }
}

async function dealEditor(editor?: vscode.TextEditor): Promise<void> {
  editor = editor || vscode.window.activeTextEditor;
  if (editor) {
    const document = editor.document;

    if (document.languageId !== 'prefab') {
      return;
    }
    const line = document.lineAt(2).text.trim();
    if (
      line !== '"__type__": "cc.Prefab",' &&
      line !== '"__type__": "cc.SceneAsset",'
    ) {
      return;
    }
    preLineInfos(document);

    if (!isHaveLibrary) {
      return;
    }

    // 应用装饰
    let decorationType = vscode.window.createTextEditorDecorationType({
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
      overviewRulerLane: vscode.OverviewRulerLane.Full,
      after: {
        color: '#808080',
      },
    });
    let decorationOptions: vscode.DecorationOptions[] = [];

    for (let i = 1, c = document.lineCount; i < c; i++) {
      let line = document.lineAt(i).text;
      const uuidIdx = line.indexOf('"__uuid__":');
      if (uuidIdx > 0) {
        const uuid = line.substring(uuidIdx + 13, uuidIdx + 49);
        const asset = libraryInfos[uuid];
        if (asset) {
          let positionStart = new vscode.Position(i, uuidIdx + 52);
          let range = new vscode.Range(positionStart, positionStart);
          let decoration: vscode.DecorationOptions = {
            range: range,
            renderOptions: {
              after: { contentText: ' ' + asset.relativePath },
            },
          };
          decorationOptions.push(decoration);
        } else if (document.lineAt(i - 1).text.indexOf('"_spriteFrame":') > 0) {
          const contentText = await getSpriteFrame(uuid);
          if (contentText) {
            let positionStart = new vscode.Position(i, uuidIdx + 52);
            let range = new vscode.Range(positionStart, positionStart);
            let decoration: vscode.DecorationOptions = {
              range: range,
              renderOptions: { after: { contentText: ' ' + contentText } },
            };
            decorationOptions.push(decoration);
          }
        }
      }
    }

    editor.setDecorations(decorationType, decorationOptions);
  }
}

export async function activate(context: vscode.ExtensionContext) {
  isHaveLibrary = false;
  // 获取当前路径
  let workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return;
  }

  for (let workspaceFolder of workspaceFolders) {
    let workspaceFolderPath = workspaceFolder.uri.fsPath;
    const jsonPath = workspaceFolderPath + '/library/uuid-to-mtime.json';
    const jsonUri = vscode.Uri.file(jsonPath);

    try {
      const data = await fs.readFile(jsonUri);
      if (data.length <= 1) {
        continue;
      }

      libraryInfos = JSON.parse(data.toString());
      importsPath = workspaceFolderPath + '/library/imports';
      isHaveLibrary = true;
      break;
    } catch (error) {
      console.log(error);
    }
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

  // 注册一个命令，用于解析 JSON 文件并创建对应的符号
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(() => dealEditor()),
    vscode.window.onDidChangeActiveTextEditor(dealEditor)
  );

  dealEditor();
}
