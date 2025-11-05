// src/hooks/useFileTree.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types
export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  content?: string; // only for files
  children?: FileNode[]; // only for directories
  open?: boolean; // UI: is folder expanded?
}

export interface FileTreeState {
  root: FileNode;
  selectedFilePath: string | null;
  openFiles: string[]; // paths of open tabs
  addFile: (path: string, content: string) => void;
  updateFile: (path: string, content: string) => void;
  deleteFile: (path: string) => void;
  selectFile: (path: string) => void;
  closeFile: (path: string) => void;
  toggleFolder: (path: string) => void;
  getFileContent: (path: string) => string | undefined;
  getOpenFiles: () => FileNode[];
}

// Helper: Create directory structure from path
function ensurePath(root: FileNode, path: string): FileNode {
  const parts = path.split('/').filter(p => p && p !== '.');
  let current = root;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    let dir = current.children?.find(c => c.name === part && c.type === 'directory');
    if (!dir) {
      dir = {
        name: part,
        path: current.path === '/' ? `/${part}` : `${current.path}/${part}`,
        type: 'directory',
        children: [],
        open: false,
      };
      current.children = current.children || [];
      current.children.push(dir);
    }
    current = dir;
  }

  return current;
}

// Initial project structure
const initialRoot: FileNode = {
  name: 'root',
  path: '/',
  type: 'directory',
  open: true,
  children: [
    {
      name: 'src',
      path: '/src',
      type: 'directory',
      open: true,
      children: [
        {
          name: 'App.tsx',
          path: '/src/App.tsx',
          type: 'file',
          content: `import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">AiCoderV2</h1>
        <p className="text-gray-600">Start building with AI</p>
      </div>
    </div>
  );
}`,
        },
        {
          name: 'main.tsx',
          path: '/src/main.tsx',
          type: 'file',
          content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
        },
        {
          name: 'index.css',
          path: '/src/index.css',
          type: 'file',
          content: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}`,
        },
      ],
    },
    {
      name: 'package.json',
      path: '/package.json',
      type: 'file',
      content: JSON.stringify({
        name: "aicoderv2",
        version: "0.1.0",
        private: true,
        scripts: {
          dev: "vite",
          build: "tsc && vite build",
          preview: "vite preview"
        },
        dependencies: {
          react: "^18.3.0",
          "react-dom": "^18.3.0"
        },
        devDependencies: {
          "@types/react": "^18.3.0",
          "@types/react-dom": "^18.3.0",
          "@vitejs/plugin-react": "^4.0.0",
          typescript: "^5.0.0",
          vite: "^5.0.0",
          tailwindcss: "^3.4.0",
          autoprefixer: "^10.4.0",
          postcss: "^8.4.0"
        }
      }, null, 2),
    },
    {
      name: 'vite.config.ts',
      path: '/vite.config.ts',
      type: 'file',
      content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});`,
    },
    {
      name: 'tailwind.config.js',
      path: '/tailwind.config.js',
      type: 'file',
      content: `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
    },
  ],
};

export const useFileTree = create<FileTreeState>()(
  devtools((set, get) => ({
    root: initialRoot,
    selectedFilePath: '/src/App.tsx',
    openFiles: ['/src/App.tsx'],

    addFile: (path: string, content: string) => {
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      set((state) => {
        const parentDir = ensurePath(state.root, normalizedPath);
        const fileName = normalizedPath.split('/').pop()!;
        const existing = parentDir.children?.find(c => c.name === fileName);

        if (existing && existing.type === 'file') {
          // Update existing
          existing.content = content;
        } else {
          const newFile: FileNode = {
            name: fileName,
            path: normalizedPath,
            type: 'file',
            content,
          };
          parentDir.children = parentDir.children || [];
          parentDir.children.push(newFile);
        }

        const newOpenFiles = state.openFiles.includes(normalizedPath)
          ? state.openFiles
          : [...state.openFiles, normalizedPath];

        return {
          ...state,
          openFiles: newOpenFiles,
          selectedFilePath: normalizedPath,
        };
      });
    },

    updateFile: (path: string, content: string) => {
      set((state) => {
        const updateNode = (node: FileNode): FileNode => {
          if (node.path === path && node.type === 'file') {
            return { ...node, content };
          }
          if (node.children) {
            return {
              ...node,
              children: node.children.map(updateNode),
            };
          }
          return node;
        };
        return {
          root: updateNode(state.root),
        };
      });
    },

    deleteFile: (path: string) => {
      set((state) => {
        const deleteNode = (node: FileNode): FileNode | null => {
          if (!node.children) return node;
          const filtered = node.children.filter(child => child.path !== path);
          if (filtered.length === node.children.length) {
            // Not found here, recurse
            return {
              ...node,
              children: node.children.map(deleteNode).filter(Boolean) as FileNode[],
            };
          }
          return { ...node, children: filtered };
        };

        const newOpenFiles = state.openFiles.filter(p => p !== path);
        const newSelected = state.selectedFilePath === path
          ? newOpenFiles[0] || null
          : state.selectedFilePath;

        return {
          root: deleteNode(state.root) || state.root,
          openFiles: newOpenFiles,
          selectedFilePath: newSelected,
        };
      });
    },

    selectFile: (path: string) => {
      set((state) => ({
        selectedFilePath: path,
        openFiles: state.openFiles.includes(path)
          ? state.openFiles
          : [...state.openFiles, path],
      }));
    },

    closeFile: (path: string) => {
      set((state) => {
        const newOpenFiles = state.openFiles.filter(p => p !== path);
        const newSelected = state.selectedFilePath === path
          ? newOpenFiles[newOpenFiles.length - 1] || null
          : state.selectedFilePath;
        return {
          openFiles: newOpenFiles,
          selectedFilePath: newSelected,
        };
      });
    },

    toggleFolder: (path: string) => {
      set((state) => {
        const toggle = (node: FileNode): FileNode => {
          if (node.path === path && node.type === 'directory') {
            return { ...node, open: !node.open };
          }
          if (node.children) {
            return {
              ...node,
              children: node.children.map(toggle),
            };
          }
          return node;
        };
        return { root: toggle(state.root) };
      });
    },

    getFileContent: (path: string) => {
      const find = (node: FileNode): string | undefined => {
        if (node.path === path && node.type === 'file') return node.content;
        if (node.children) {
          for (const child of node.children) {
            const found = find(child);
            if (found) return found;
          }
        }
        return undefined;
      };
      return find(get().root);
    },

    getOpenFiles: () => {
      const state = get();
      return state.openFiles
        .map(path => {
          const find = (node: FileNode): FileNode | null => {
            if (node.path === path) return node;
            if (node.children) {
              for (const child of node.children) {
                const found = find(child);
                if (found) return found;
              }
            }
            return null;
          };
          return find(state.root);
        })
        .filter(Boolean) as FileNode[];
    },
  }), { name: 'file-tree' })
);