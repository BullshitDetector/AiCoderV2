// src/services/fileService.ts
import { FileSystemTree } from '@webcontainer/api';
import { webContainer } from '../hooks/useWebContainer';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

let fsTree: FileSystemTree = {};

/** Refresh the in-memory file tree from WebContainer */
export async function refreshFileTree(): Promise<FileNode> {
  const instance = await webContainer;
  fsTree = await instance.fs.readDir('/', { withFileTypes: true });
  return buildTree('/', fsTree);
}

/** Convert WebContainer Dirent tree → UI-friendly structure */
function buildTree(basePath: string, tree: FileSystemTree): FileNode {
  const entries = Object.entries(tree);
  const children: FileNode[] = [];

  for (const [name, entry] of entries) {
    const path = `${basePath}${basePath === '/' ? '' : '/'}${name}`;
    if ('directory' in entry) {
      children.push({
        name,
        path,
        type: 'directory',
        children: buildTree(path, entry.directory).children,
      });
    } else {
      children.push({ name, path, type: 'file' });
    }
  }

  return { name: basePath.split('/').pop() || '/', path: basePath, type: 'directory', children };
}

/** Read file content as string */
export async function readFile(path: string): Promise<string> {
  const instance = await webContainer;
  const buf = await instance.fs.readFile(path);
  return new TextDecoder().decode(buf);
}

/** Write or create file (with auto-mkdir) */
export async function writeFile(path: string, content: string): Promise<void> {
  const instance = await webContainer;
  const dir = path.split('/').slice(0, -1).join('/');
  if (dir) {
    await instance.fs.mkdir(dir, { recursive: true });
  }
  await instance.fs.writeFile(path, content);
}

/** Optional: Delete file */
export async function deleteFile(path: string): Promise<void> {
  const instance = await webContainer;
  await instance.fs.rm(path);
}