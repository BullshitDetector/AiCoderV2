// src/components/Explorer.tsx
import React, { useState } from "react";
import { FileTree } from "./FileTree";
import { FileNode } from "../types";
import { FilePlus, FolderPlus } from "lucide-react";

interface ExplorerProps {
  fileTree: FileNode;
  onFileClick: (path: string) => void;
  onAddFile: (path: string) => void;
  onAddFolder: (path: string) => void;
}

export const Explorer: React.FC<ExplorerProps> = ({
  fileTree,
  onFileClick,
  onAddFile,
  onAddFolder,
}) => {
  const [isCreating, setIsCreating] = useState<"file" | "folder" | null>(null);
  const [newName, setNewName] = useState("");

  const handleCreate = (type: "file" | "folder") => {
    setIsCreating(type);
    setNewName("");
  };

  const confirmCreate = () => {
    if (!newName.trim()) return;
    const path = `src/${newName}${isCreating === "file" ? ".tsx" : ""}`;
    if (isCreating === "file") {
      onAddFile(path);
    } else {
      onAddFolder(path);
    }
    setIsCreating(null);
    setNewName("");
  };

  return (
    <div className="h-full bg-gray-100 dark:bg-gray-800 flex flex-col">
      <div className="border-b border-gray-300 dark:border-gray-700 px-3 py-2 flex items-center justify-between">
        <span className="font-medium text-sm">Explorer</span>
        <div className="flex space-x-1">
          <button
            onClick={() => handleCreate("file")}
            className="p-1 hover:bg-gray-300 dark:hover:bg-gray-700 rounded"
            title="New File"
          >
            <FilePlus className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleCreate("folder")}
            className="p-1 hover:bg-gray-300 dark:hover:bg-gray-700 rounded"
            title="New Folder"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        <FileTree node={fileTree} onFileClick={onFileClick} depth={0} />
      </div>

      {isCreating && (
        <div className="border-t border-gray-300 dark:border-gray-700 p-2 bg-white dark:bg-gray-900">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmCreate();
              if (e.key === "Escape") setIsCreating(null);
            }}
            placeholder={isCreating === "file" ? "filename.tsx" : "folder-name"}
            className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-600"
            autoFocus
          />
        </div>
      )}
    </div>
  );
};