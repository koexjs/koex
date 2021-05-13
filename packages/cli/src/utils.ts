import * as fs from 'fs';

export async function loadJSON(path: string, key: string) {
  const text = await fs.promises.readFile(path, 'utf-8');
  const data = JSON.parse(text);
  return data?.[key];
}
