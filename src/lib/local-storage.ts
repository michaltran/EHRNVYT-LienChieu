import path from 'path';
import fs from 'fs/promises';

const STORAGE_DIR = path.resolve(process.env.LOCAL_STORAGE_DIR || './storage');

export async function saveFile(relativePath: string, data: Buffer): Promise<string> {
  const safe = relativePath.replace(/\\/g, '/').replace(/\.\.+/g, '');
  const absPath = path.join(STORAGE_DIR, safe);
  await fs.mkdir(path.dirname(absPath), { recursive: true });
  await fs.writeFile(absPath, data);
  return `/api/files/${safe}`;
}

export async function readFile(relativePath: string): Promise<Buffer | null> {
  const safe = relativePath.replace(/\\/g, '/').replace(/\.\.+/g, '');
  const absPath = path.join(STORAGE_DIR, safe);
  if (!absPath.startsWith(STORAGE_DIR)) return null;
  try {
    return await fs.readFile(absPath);
  } catch {
    return null;
  }
}

export async function deleteFile(relativePath: string): Promise<void> {
  const safe = relativePath.replace(/\\/g, '/').replace(/\.\.+/g, '');
  const absPath = path.join(STORAGE_DIR, safe);
  if (!absPath.startsWith(STORAGE_DIR)) return;
  try { await fs.unlink(absPath); } catch {}
}

export function urlToRelativePath(url: string): string | null {
  if (!url.startsWith('/api/files/')) return null;
  return url.slice('/api/files/'.length);
}
