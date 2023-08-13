import * as vscode from 'vscode';
import * as fs from 'fs';
const vscodeFs = vscode.workspace.fs;

let lineInfos: number[] | null = null;
let libraryInfos: { [key: string]: { relativePath: string } } = {};
let isHaveLibrary = false;
let importsPath: string = '';
let dealLibraryLock = false;
const decorationType = vscode.window.createTextEditorDecorationType({
  rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
  overviewRulerLane: vscode.OverviewRulerLane.Full,
  after: {
    color: '#808080',
  },
});

async function getSpriteFrame(uuid: string) {
  const jsonPath = `${importsPath}/${uuid.substring(0, 2)}/${uuid}.json`;
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

for (
  var t = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
    r = new Array(128),
    i = 0;
  i < 128;
  ++i
) {
  r[i] = 0;
}
for (i = 0; i < 64; ++i) {
  r[t.charCodeAt(i)] = i;
}
function decompressUuid(e: string) {
  if (23 === e.length) {
    let t = [];
    for (let i = 5; i < 23; i += 2) {
      let n = r[e.charCodeAt(i)],
        s = r[e.charCodeAt(i + 1)];
      t.push((n >> 2).toString(16)),
        t.push((((3 & n) << 2) | (s >> 4)).toString(16)),
        t.push((15 & s).toString(16));
    }
    e = e.slice(0, 5) + t.join('');
  } else {
    if (22 !== e.length) {
      return e;
    }
    {
      let t = [];
      for (let i = 2; i < 22; i += 2) {
        let n = r[e.charCodeAt(i)],
          s = r[e.charCodeAt(i + 1)];
        t.push((n >> 2).toString(16)),
          t.push((((3 & n) << 2) | (s >> 4)).toString(16)),
          t.push((15 & s).toString(16));
      }
      e = e.slice(0, 2) + t.join('');
    }
  }
  return [
    e.slice(0, 8),
    e.slice(8, 12),
    e.slice(12, 16),
    e.slice(16, 20),
    e.slice(20),
  ].join('-');
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

function getDecoration(
  i: number,
  uuid: string,
  decorationOptions: vscode.DecorationOptions[]
): void {
  const longuuid = decompressUuid(uuid);
  if (longuuid === uuid) {
    return;
  }
  const asset = libraryInfos[longuuid];
  if (asset) {
    let positionStart = new vscode.Position(i, 100);
    let range = new vscode.Range(positionStart, positionStart);
    let decoration: vscode.DecorationOptions = {
      range: range,
      renderOptions: {
        after: { contentText: ' ' + asset.relativePath },
      },
    };
    decorationOptions.push(decoration);
  }
}

function resetLibraryInfos() {
  isHaveLibrary = false;
  libraryInfos = {};
  importsPath = '';
}

function setLibraryInfos(data: Uint8Array) {
  try {
    libraryInfos = JSON.parse(data.toString());
    isHaveLibrary = true;
  } catch (error) {
    resetLibraryInfos();
  }
  return isHaveLibrary;
}

async function loadUuidJson(jsonPath: string) {
  const jsonUri = vscode.Uri.file(jsonPath);
  try {
    const data = await vscodeFs.readFile(jsonUri);
    importsPath = jsonPath.replace('uuid-to-mtime.json', 'imports');
    fs.watch(jsonPath, (eventType: fs.WatchEventType, filename) => {
      if (eventType === 'change') {
        const jsonUri = vscode.Uri.file(jsonPath);
        vscodeFs.readFile(jsonUri).then((data) => {
          setLibraryInfos(data);
          importsPath = jsonPath.replace('uuid-to-mtime.json', 'imports');
        }, resetLibraryInfos);
      }

      console.log(`File ${filename} has been ${eventType}`);
    });
    setLibraryInfos(data);
  } catch (error) {
    resetLibraryInfos();
  }
  return isHaveLibrary;
}

async function dealLibrary(): Promise<void> {
  if (dealLibraryLock) {
    return;
  }

  dealLibraryLock = true;
  do {
    let workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      break;
    }

    if (isHaveLibrary) {
      break;
    }

    for (let workspaceFolder of workspaceFolders) {
      let workspaceFolderPath = workspaceFolder.uri.fsPath;
      const jsonPath = workspaceFolderPath + '/library/uuid-to-mtime.json';
      if (await loadUuidJson(jsonPath)) {
        break;
      }
    }
    // eslint-disable-next-line no-constant-condition
  } while (false);
  dealLibraryLock = false;
}

async function dealEditor(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  // 插件正在忙
  if (dealLibraryLock) {
    return;
  }

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
    await dealLibrary();
  }

  if (!isHaveLibrary) {
    return;
  }

  // 应用装饰
  let decorationOptions: vscode.DecorationOptions[] = [];

  for (let i = 1, c = document.lineCount; i < c; i++) {
    let line = document.lineAt(i).text;
    if (line.length < 42) {
      continue;
    }
    let uuidIdx = line.indexOf('"__uuid__":');
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
    } else if ((uuidIdx = line.indexOf('"__type__":')) > 0) {
      const uuid = line.substring(uuidIdx + 13, uuidIdx + 36);
      getDecoration(i, uuid, decorationOptions);
    } else if ((uuidIdx = line.indexOf('"_componentId":')) > 0) {
      const uuid = line.substring(uuidIdx + 17, uuidIdx + 40);
      getDecoration(i, uuid, decorationOptions);
    }
  }

  editor.setDecorations(decorationType, decorationOptions);
}

export async function activate(context: vscode.ExtensionContext) {
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
    vscode.commands.registerCommand('creatorPrefab.parsePrefab', dealEditor),
    vscode.window.onDidChangeActiveTextEditor(dealEditor)
  );

  dealEditor();
}
