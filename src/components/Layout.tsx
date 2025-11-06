// src/components/Layout.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { FileTree } from "./FileTree";
import { MonacoEditor } from "./MonacoEditor";
import { Preview } from "./Preview";
import { ChatInterface } from "./ChatInterface";
import { useWebContainer } from "../hooks/useWebContainer";
import { FileNode } from "../types";

export const Layout: React.FC = () => {
  // ----------------------------------------------------------------------
  // File system state
  // ----------------------------------------------------------------------
  const [files, setFiles] = useState<Record<string, string>>({
    "src/main.tsx": `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
    "src/App.tsx": `import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Vite + React + Tailwind</h1>
        <button
          onClick={() => setCount((c) => c + 1)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          count is {count}
        </button>
      </div>
    </div>
  );
}
`,
    "src/index.css": `@tailwind base;
@tailwind components;
@tailwind utilities;`,
    "index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>R3alm Dev</title>
  </head>
  <body class="bg-white dark:bg-gray-900">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
    "vite.config.ts": `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
`,
    "tailwind.config.js": `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
`,
    "package.json": `{
  "name": "r3alm-dev",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "typescript": "^5.5.0",
    "vite": "^5.4.0"
  }
}
`,
  });

  // ----------------------------------------------------------------------
  // Editor state
  // ----------------------------------------------------------------------
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [openTabs, setOpenTabs] = useState<string[]>([]);

  const openFile = useCallback(
    (path: string) => {
      if (!openTabs.includes(path)) {
        setOpenTabs((prev) => [...prev, path]);
      }
      setActiveFile(path);
    },
    [openTabs]
  );

  const closeTab = (path: string) => {
    const idx = openTabs.indexOf(path);
    if (idx === -1) return;

    const newTabs = openTabs.filter((t) => t !== path);
    setOpenTabs(newTabs);

    if (activeFile === path) {
      // pick next tab or first one
      const next = newTabs[idx] ?? newTabs[idx - 1] ?? null;
      setActiveFile(next);
    }
  };

  // ----------------------------------------------------------------------
  // WebContainer integration
  // ----------------------------------------------------------------------
  const { container, ready, installDependencies, startDevServer } =
    useWebContainer();

  useEffect(() => {
    if (!ready || !container) return;

    const writeAllFiles = async () => {
      for (const [path, content] of Object.entries(files)) {
        const dirs = path.split("/").slice(0, -1);
        let current = "";
        for (const dir of dirs) {
          current += dir + "/";
          await container.fs.mkdir(current, { recursive: true });
        }
        await container.fs.writeFile(path, content);
      }

      await installDependencies();
      await startDevServer();
    };

    writeAllFiles();
  }, [ready, container, files, installDependencies, startDevServer]);

  // ----------------------------------------------------------------------
  // File change handling (editor → files → container)
  // ----------------------------------------------------------------------
  const handleFileChange = async (path: string, content: string) => {
    setFiles((prev) => ({ ...prev, [path]: content }));
    if (container) {
      await container.fs.writeFile(path, content);
    }
  };

  // ----------------------------------------------------------------------
  // AI → new file handling
  // ----------------------------------------------------------------------
  useEffect(() => {
    const handleAddFile = (
      e: CustomEventInit<{ filename: string; code: string }>
    ) => {
      const { filename, code } = e.detail;
      const fullPath = filename.startsWith("src/") ? filename : `src/${filename}`;

      setFiles((prev) => ({ ...prev, [fullPath]: code }));
      openFile(fullPath);
    };

    window.addEventListener("addFile", handleAddFile as EventListener);
    return () => window.removeEventListener("addFile", handleAddFile as EventListener);
  }, [openFile]);

  // ----------------------------------------------------------------------
  // Helper: build tree structure for FileTree
  // ----------------------------------------------------------------------
  const buildTree = (filesObj: Record<string, string>): FileNode => {
    const root: FileNode = { name: "", path: "", type: "directory", children: [] };

    Object.keys(filesObj).forEach((filePath) => {
      const parts = filePath.split("/");
      let current = root;

      parts.forEach((part, idx) => {
        if (!part) return;
        const isFile = idx === parts.length - 1;
        let node = current.children?.find((c) => c.name === part);

        if (!node) {
          node = {
            name: part,
            path: parts.slice(0, idx + 1).join("/"),
            type: isFile ? "file" : "directory",
            children: isFile ? undefined : [],
          };
          current.children!.push(node);
        }
        if (!isFile) current = node;
      });
    });

    return root;
  };

  const fileTree = buildTree(files);

  // ----------------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------------
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between bg-white dark:bg-gray-800">
        <h1 className="text-xl font-bold">R3alm Dev</h1>
        <div className="flex items-center space-x-2 text-sm">
          {ready ? (
            <span className="text-green-600">WebContainer ready</span>
          ) : (
            <span className="text-orange-600">Booting WebContainer…</span>
          )}
        </div>
      </header>

      {/* Main layout – four panes */}
      <PanelGroup direction="horizontal" className="flex-1">
        {/* Left: Chat */}
        <Panel defaultSize={25} minSize={15}>
          <ChatInterface />
        </Panel>

        <PanelResizeHandle className="w-1 bg-gray-300 dark:bg-gray-700 hover:bg-blue-500 transition-colors" />

        {/* Center-left: File Tree */}
        <Panel defaultSize={20} minSize={15}>
          <div className="h-full bg-gray-100 dark:bg-gray-800 flex flex-col">
            <div className="border-b border-gray-300 dark:border-gray-700 px-3 py-2 font-medium">
              Explorer
            </div>
            <div className="flex-1 overflow-auto p-2">
              <FileTree
                node={fileTree}
                onFileClick={(path) => openFile(path)}
                depth={0}
              />
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-gray-300 dark:bg-gray-700 hover:bg-blue-500 transition-colors" />

        {/* Center-right: Editor + Tabs */}
        <Panel defaultSize={35} minSize={25}>
          <div className="h-full flex flex-col bg-white dark:bg-gray-900">
            {/* Tabs */}
            {openTabs.length > 0 && (
              <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto bg-gray-50 dark:bg-gray-800">
                {openTabs.map((tab) => (
                  <div
                    key={tab}
                    className={`flex items-center px-3 py-1 text-sm cursor-pointer border-r border-gray-200 dark:border-gray-700 ${
                      activeFile === tab
                        ? "bg-white dark:bg-gray-900 text-blue-600"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => setActiveFile(tab)}
                  >
                    <span className="truncate max-w-xs">{tab.split("/").pop()}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab);
                      }}
                      className="ml-2 text-gray-500 hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Editor */}
            <div className="flex-1">
              {activeFile ? (
                <MonacoEditor
                  path={activeFile}
                  value={files[activeFile] || ""}
                  onChange={(value) => handleFileChange(activeFile, value || "")}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Open a file to start editing
                </div>
              )}
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-gray-300 dark:bg-gray-700 hover:bg-blue-500 transition-colors" />

        {/* Right: Preview */}
        <Panel defaultSize={30} minSize={20}>
          <Preview />
        </Panel>
      </PanelGroup>
    </div>
  );
};