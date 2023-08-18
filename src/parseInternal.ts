import * as fs from 'fs';
const path = require('path');
const reg = /\/(.*?).png/;
function getAllMetaFiles(dirPath: string): string[] {
  let files: string[] = [];
  let entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (let entry of entries) {
    let fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllMetaFiles(fullPath));
    } else if (entry.isFile() && path.extname(fullPath) === '.meta') {
      files.push(fullPath);
    }
  }
  return files;
}

function parseInternal(version: string): { [key: string]: string } {
  const creatorPath = `/Applications/CocosCreator/Creator/${version}/CocosCreator.app/Contents/Resources/static/default-assets`;
  // 判断是否存在
  if (!fs.existsSync(creatorPath)) {
    return {};
  }

  // 获取所有的.meta文件
  const internals: { [key: string]: string } = {};
  const files = getAllMetaFiles(creatorPath);
  for (let file of files) {
    const dataObj = fs.readFileSync(file, 'utf-8');
    const shortFile = file
      .substring(creatorPath.length + 1)
      .replace('.meta', '');
    if (shortFile.lastIndexOf('.') === -1) {
      continue;
    }

    try {
      if (shortFile.endsWith('.png')) {
        const reg2 = /"uuid": "(.*)"/gm;
        const reg3 = /"rawTextureUuid": "(.*)"/gm;
        const dataObj2 = dataObj.substring(80);
        const lastIdx = shortFile.lastIndexOf('/');
        const pngName = shortFile.substring(lastIdx + 1, shortFile.length - 4);
        // @ts-ignore
        internals[reg2.exec(dataObj2)[1]] = `${shortFile}/${pngName}`;
        // @ts-ignore
        internals[reg3.exec(dataObj2)[1]] = shortFile;
      } else {
        const reg = /"uuid": "(.*)"/gm;
        // @ts-ignore
        internals[reg.exec(dataObj)[1]] = shortFile;
      }
    } catch (error) {
      console.log('=====', error);
    }
  }
  return internals;
}

export { parseInternal };
