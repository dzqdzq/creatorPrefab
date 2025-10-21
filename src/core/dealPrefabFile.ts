import * as vscode from 'vscode';
import * as fs from 'fs';
import * as uuidUtils from '../uuid-utils';
const vscodeFs = vscode.workspace.fs;

let lineInfos: number[] | null = null;
let cocosVersion = 0;
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
  let data;
  try {
    data = await vscodeFs.readFile(vscode.Uri.file(jsonPath));
  } catch (err) {
    return '没有查询到此uuid对应的资源, 请确认是否存在, 如果存在请重启creator';
  }

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

export function getImportsPath() {
  return importsPath;
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
  const longuuid = uuidUtils.decompressUuid(uuid);
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

function toRelativePath(jsonObj: any) {
  let ret: any = {};
  for (let uuid in jsonObj) {
    ret[uuid] = {
      relativePath: jsonObj[uuid].url
    }
  }
  return ret;
}

function setLibraryInfos(data1: Uint8Array, data2?: Uint8Array, isVersion3?: boolean) {
  libraryInfos = {}
  try {
    if (data1) {
      const dataObj = JSON.parse(data1.toString());
      if (isVersion3) {
        Object.assign(libraryInfos, toRelativePath(dataObj));
      } else {
        Object.assign(libraryInfos, dataObj);
      }
    }

    if (data2) {
      const dataObj = JSON.parse(data2.toString());
      if (isVersion3) {
        Object.assign(libraryInfos, toRelativePath(dataObj));
      } else {
        Object.assign(libraryInfos, dataObj);
      }
    }
    isHaveLibrary = true;
  } catch (error) {
    resetLibraryInfos();
  }
  return isHaveLibrary;
}

async function loadUuidJsonV2(jsonPath: string) {
  const jsonUri = vscode.Uri.file(jsonPath);
  try {
    const data = await vscodeFs.readFile(jsonUri);
    importsPath = jsonPath.replace('uuid-to-mtime.json', 'imports');
    fs.watch(jsonPath, (eventType: fs.WatchEventType, filename) => {
      if (eventType === 'change') {
        const jsonUri = vscode.Uri.file(jsonPath);
        vscodeFs.readFile(jsonUri).then((data) => {
          setLibraryInfos(data, undefined, false);
          importsPath = jsonPath.replace('uuid-to-mtime.json', 'imports');
        }, resetLibraryInfos);
      }

      console.log(`File ${filename} has been ${eventType}`);
    });
    setLibraryInfos(data, undefined, false);
  } catch (error) {
    resetLibraryInfos();
  }
  return isHaveLibrary;
}

async function loadUuidJsonV3(library: string) {
  const assetsDataPath = `${library}/.assets-data.json`;
  const internalDataPath = `${library}/.internal-data.json`;

  const assetsDataUri = vscode.Uri.file(assetsDataPath)
  const internalDataUri = vscode.Uri.file(internalDataPath);

  try {
    const assetsData = await vscodeFs.readFile(assetsDataUri);
    const internalData = await vscodeFs.readFile(internalDataUri);
    fs.watch(assetsDataPath, (eventType: fs.WatchEventType, filename) => {
      if (eventType === 'change') {
        vscodeFs.readFile(assetsDataUri).then((data) => {
          setLibraryInfos(data, undefined, true);
        }, resetLibraryInfos);
      }

      console.log(`File ${filename} has been ${eventType}`);
    });
    setLibraryInfos(assetsData, internalData, true);
  } catch (error) {
    resetLibraryInfos();
  }
  return isHaveLibrary;
}

async function getCocosVersion() {
  let version = 0;

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return version;
  }

  for (let workspaceFolder of workspaceFolders) {
    const libraryPath = `${workspaceFolder.uri.fsPath}/library/`;

    if (fs.existsSync(libraryPath + '.internal-data.json')) {
      version = 3;
      break;
    } else if (fs.existsSync(libraryPath + 'uuid-to-mtime.json')) {
      version = 2;
      break;
    }
  }
  return version;
}

async function dealLibraryV2(): Promise<void> {
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
      if (await loadUuidJsonV2(jsonPath)) {
        break;
      }
    }
    // eslint-disable-next-line no-constant-condition
  } while (false);
  dealLibraryLock = false;
}

// cocos creator 3.x
async function dealLibraryV3(): Promise<void> {
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
      if (fs.existsSync(workspaceFolderPath + '/library/.assets-data.json')) {
        if (await loadUuidJsonV3(workspaceFolderPath + '/library/')) {
          break;
        }
      }
    }
    // eslint-disable-next-line no-constant-condition
  } while (false);
  dealLibraryLock = false;
}

function dealLibrary() {
  if (cocosVersion === 2) {
    return dealLibraryV2();
  } else {
    return dealLibraryV3();
  }
}

export async function dealEditor(): Promise<void> {
  console.log('dealEditor... start');
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  cocosVersion = await getCocosVersion();
  if (cocosVersion === 0) {
    console.log('dealEditor... 没有找到cocos版本,可能不是cocos项目');
    return;
  }
  // 插件正在忙
  if (dealLibraryLock) {
    console.log('dealEditor... lock');
    return;
  }

  const document = editor.document;

  if (document.languageId !== 'prefab') {
    return;
  }
  const line = document.lineAt(2).text.trim();
  if (line !== '"__type__": "cc.Prefab",' && line !== '"__type__": "cc.SceneAsset",') {
    return;
  }

  preLineInfos(document);

  if (!isHaveLibrary) {
    await dealLibrary();
  }

  if (!isHaveLibrary) {
    console.log('dealEditor... 没有Library');
    return;
  }

  // 应用装饰
  let count = 0;
  let decorationOptions: vscode.DecorationOptions[] = [];
  for (let i = 1, c = document.lineCount; i < c; i++) {
    let line = document.lineAt(i).text;
    if (line.length < 42) {
      if (line === '  {') {
        let positionStart = new vscode.Position(i, 10);
        let range = new vscode.Range(positionStart, positionStart);
        let decoration: vscode.DecorationOptions = {
          range: range,
          renderOptions: { after: { contentText: ` id: ${count++}` } },
        };
        decorationOptions.push(decoration);
      }
      continue;
    }
    let uuidIdx = line.indexOf('"__uuid__":');
    if (uuidIdx > 0) {
      let offset = line.includes("@") ? 6 : 0;
      const uuid = line.substring(uuidIdx + 13, uuidIdx + 49 + offset);
      const asset = libraryInfos[uuid];
      if (asset) {
        const contentText = asset.relativePath;
        let positionStart = new vscode.Position(i, uuidIdx + 52 + offset);
        let range = new vscode.Range(positionStart, positionStart);
        let decoration: vscode.DecorationOptions = {
          range: range,
          renderOptions: {
            after: { contentText: ' ' + contentText },
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

export async function getLibraryInfos() {
  if (!isHaveLibrary && cocosVersion) {
    await dealLibrary();
  }
  return libraryInfos;
}

export const prefabFn = {
  provideDefinition(document: vscode.TextDocument, position: vscode.Position) {
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
        return new vscode.Location(document.uri, new vscode.Range(newPosition, endPosition));
      }
    }
  },
};
