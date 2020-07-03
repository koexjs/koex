import { join } from 'path';
import * as fs from 'fs';
import * as util from 'util';

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const readFile = util.promisify(fs.readFile);

export async function listDir(dir: string) {
  if (!await isDir(dir)) {
    return [];
  }

  const names = await readdir(dir);

  const files = Promise.all(names.map(async name => {
    const fullpath = join(dir, name);
    const _type = await type(fullpath);

    return {
      dir,
      name,
      fullpath,
      type: _type, 
    };
  }));

  return files;
}

export async function type(fullpath: string) {
  try {
    const _stat = await stat(fullpath);
  
    return _stat.isDirectory() ? 'dir' : _stat.isFile() ? 'file' : 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

export async function isDir(path: string) {
  try {
    const _stat = await stat(path);
  
    return _stat.isDirectory();
  } catch (error) {
    return false;
  }
}

export default {
  listDir,
  isDir,
  readFile,
};