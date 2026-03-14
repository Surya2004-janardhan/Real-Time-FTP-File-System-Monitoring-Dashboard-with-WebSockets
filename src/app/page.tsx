"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { FtpFile } from "@/lib/ftp";
import { SnapshotDiff } from "@/lib/diff";

export default function Home() {
  const [snapshot, setSnapshot] = useState<FtpFile[]>([]);
  const [activities, setActivities] = useState<{ type: string; file: FtpFile; timestamp: string }[]>([]);
  const [selectedFile, setSelectedFile] = useState<FtpFile | null>(null);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    const socket: Socket = io();

    socket.on("connect", () => {
      console.log("Connected to WebSocket");
    });

    socket.on("fs:snapshot", (data: { snapshot: FtpFile[] }) => {
      setSnapshot(data.snapshot);
    });

    socket.on("fs:diff", (diff: SnapshotDiff) => {
      setSnapshot((prev) => {
        const next = [...prev];
        // Handle added
        diff.added.forEach((file) => {
          if (!next.find((f) => f.path === file.path)) {
            next.push(file);
          }
        });
        // Handle modified
        diff.modified.forEach((file) => {
          const index = next.findIndex((f) => f.path === file.path);
          if (index !== -1) next[index] = file;
        });
        // Handle deleted
        const deletedPaths = new Set(diff.deleted.map((f) => f.path));
        return next.filter((f) => !deletedPaths.has(f.path));
      });

      // Update Activity Feed
      const timestamp = new Date().toLocaleTimeString();
      const newActivities = [
        ...diff.added.map((f) => ({ type: "added", file: f, timestamp })),
        ...diff.modified.map((f) => ({ type: "modified", file: f, timestamp })),
        ...diff.deleted.map((f) => ({ type: "deleted", file: f, timestamp })),
      ];
      setActivities((prev) => [...newActivities, ...prev].slice(0, 50));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleFileClick = async (file: FtpFile) => {
    if (file.type === "directory") return;
    setSelectedFile(file);
    setLoadingPreview(true);
    setPreviewContent("");
    try {
      const res = await fetch(`/api/ftp/preview?path=${encodeURIComponent(file.path)}`);
      if (res.ok) {
        const text = await res.text();
        setPreviewContent(text);
      } else {
        setPreviewContent("Error: Could not fetch file preview.");
      }
    } catch (err) {
      setPreviewContent("Error: Connection failure.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const toBase64 = (str: string) => btoa(str);

  return (
    <main className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* File Tree Section */}
      <section className="w-1/4 border-r border-slate-700 flex flex-col">
        <header className="p-4 border-b border-slate-700 bg-slate-800">
          <h2 className="text-xl font-bold text-blue-400">File System</h2>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {snapshot.sort((a, b) => a.path.localeCompare(b.path)).map((file) => {
            const parts = file.path.split('/').filter(Boolean);
            const depth = Math.max(0, parts.length - 1);
            
            return (
              <div
                key={file.path}
                data-test-id={`file-tree-item-${toBase64(file.path)}`}
                onClick={() => handleFileClick(file)}
                style={{ paddingLeft: `${depth * 1.5}rem` }}
                className={`p-2 rounded cursor-pointer transition-colors flex items-center gap-2 ${
                  file.type === "directory" ? "text-amber-400 font-medium" : "text-slate-300 hover:bg-slate-700"
                } ${selectedFile?.path === file.path ? "bg-slate-700 ring-1 ring-blue-500" : ""}`}
              >
                <span>{file.type === "directory" ? "📁" : "📄"}</span>
                <span className="truncate">{file.name}</span>
              </div>
            );
          })}
          {snapshot.length === 0 && <p className="text-slate-500 text-sm italic">Scanning FTP...</p>}
        </div>

      </section>

      {/* Main Content (Preview + Activity) */}
      <div className="flex-1 flex flex-col">
        {/* Preview Panel */}
        <section className="flex-1 flex flex-col p-6 bg-slate-900 overflow-hidden">
          <header className="mb-4">
            <h2 className="text-2xl font-semibold text-slate-100 flex items-center gap-2">
              Preview Panel {selectedFile && <span className="text-sm font-normal text-slate-400">/ {selectedFile.path}</span>}
            </h2>
          </header>
          <div
            data-test-id="file-preview-panel"
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-4 font-mono text-sm overflow-auto whitespace-pre-wrap relative shadow-inner"
          >
            {loadingPreview ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
              </div>
            ) : selectedFile ? (
              previewContent || <span className="text-slate-500 italic">This file is empty or binary logic is not applied.</span>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600">
                <span className="text-4xl mb-4">🔍</span>
                <p>Select a file from the tree to preview its contents</p>
              </div>
            )}
          </div>
        </section>

        {/* Activity Feed */}
        <section className="h-1/3 border-t border-slate-700 bg-slate-800 flex flex-col shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">
          <header className="p-3 border-b border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-emerald-400 uppercase tracking-wider text-xs">Live Activity Feed</h3>
            <span className="text-[10px] text-slate-500 italic">Total updates: {activities.length}</span>
          </header>
          <div
            data-test-id="activity-feed"
            className="flex-1 overflow-y-auto p-3"
          >
            {activities.map((act, i) => (
              <div
                key={i}
                data-test-id={`activity-item-${act.type}-${toBase64(act.file.path)}`}
                className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0 hover:bg-slate-700/30 px-2 rounded -mx-2"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${act.type === 'added' ? 'bg-emerald-500/10 text-emerald-500' :
                      act.type === 'modified' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-rose-500/10 text-rose-500'
                    }`}>
                    {act.type}
                  </span>
                  <span className="text-xs text-slate-300 font-mono">{act.file.path}</span>
                </div>
                <span className="text-[10px] text-slate-500 tabular-nums">{act.timestamp}</span>
              </div>
            ))}
            {activities.length === 0 && <p className="text-slate-600 text-xs italic text-center mt-4">Monitoring for changes...</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
