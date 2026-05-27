"use client";

import { useState, useEffect } from "react";
import { ImageIcon, Video, Mic, Globe, FileText, File, ChevronRight, RefreshCw, Layers } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { formatBytes, timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BUCKET_DEFS } from "@/lib/types";
import type { WorkspaceBucket, WorkspaceFile, BucketMeta } from "@/lib/types";

const EXT_ICONS: Record<string, React.ElementType> = {
  html: Globe, htm: Globe,
  png: ImageIcon, jpg: ImageIcon, jpeg: ImageIcon, gif: ImageIcon, webp: ImageIcon, svg: ImageIcon,
  mp4: Video, webm: Video,
  mp3: Mic, wav: Mic, ogg: Mic,
};

function getFileIcon(ext: string): React.ElementType {
  return EXT_ICONS[ext] ?? FileText;
}

const GROUP_LABELS = {
  studio: "Studio",
  workspace: "Workspace",
  agent: "Agent",
};

export function WorkspaceTab() {
  const [activeBucket, setActiveBucket] = useState<WorkspaceBucket>("images");
  const [selectedFile, setSelectedFile] = useState<WorkspaceFile | null>(null);
  const { data: files = [], isLoading, refetch } = useWorkspace(activeBucket);

  // Count files per bucket
  const [counts, setCounts] = useState<Partial<Record<WorkspaceBucket, number>>>({});
  useEffect(() => {
    fetch("/api/workspace/list")
      .then((r) => r.json())
      .then((all: WorkspaceFile[]) => {
        const c: Partial<Record<WorkspaceBucket, number>> = {};
        for (const f of all) {
          c[f.bucket] = (c[f.bucket] ?? 0) + 1;
        }
        setCounts(c);
      })
      .catch(() => {});
  }, [activeBucket]);

  const groups = ["studio", "workspace", "agent"] as const;

  return (
    <div className="flex h-full">
      {/* Bucket rail */}
      <div className="w-[200px] shrink-0 border-r border-border bg-card flex flex-col">
        <div className="px-3 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Buckets · {BUCKET_DEFS.length}
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => refetch()}>
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-3">
            {groups.map((group) => (
              <div key={group}>
                <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest px-2 mb-1">
                  {GROUP_LABELS[group]}
                </p>
                <div className="space-y-0.5">
                  {BUCKET_DEFS.filter((b) => b.group === group).map((bucket) => (
                    <BucketRow
                      key={bucket.id}
                      bucket={bucket}
                      isActive={activeBucket === bucket.id}
                      count={counts[bucket.id] ?? 0}
                      onClick={() => { setActiveBucket(bucket.id); setSelectedFile(null); }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* File list */}
      <div className="w-[220px] shrink-0 border-r border-border flex flex-col">
        <div className="px-3 py-3 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {BUCKET_DEFS.find((b) => b.id === activeBucket)?.label}
          </span>
        </div>
        <ScrollArea className="flex-1">
          {isLoading && <p className="text-xs text-muted-foreground px-4 py-3">Scanning…</p>}
          {!isLoading && files.length === 0 && (
            <p className="text-xs text-muted-foreground px-4 py-3">No files found</p>
          )}
          <div className="p-1 space-y-0.5">
            {files.map((file) => {
              const Icon = getFileIcon(file.ext);
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors group",
                    selectedFile?.path === file.path
                      ? "bg-primary/15 text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate">{file.name}</p>
                    <p className="text-[10px] text-muted-foreground/60">{formatBytes(file.size)}</p>
                  </div>
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 shrink-0" />
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Preview pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {selectedFile ? (
          <FilePreview file={selectedFile} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <Layers className="w-10 h-10 opacity-20" />
            <p className="text-sm">Select a file to preview</p>
            <p className="text-xs opacity-50">{files.length} file{files.length !== 1 ? "s" : ""} in {BUCKET_DEFS.find((b) => b.id === activeBucket)?.label}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BucketRow({ bucket, isActive, count, onClick }: {
  bucket: BucketMeta;
  isActive: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors text-xs",
        isActive
          ? "bg-primary/15 text-foreground font-medium"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: bucket.color }}
      />
      <span className="flex-1 truncate">{bucket.label}</span>
      {count > 0 && (
        <span className="text-[10px] text-muted-foreground/60 shrink-0">{count}</span>
      )}
    </button>
  );
}

function FilePreview({ file }: { file: WorkspaceFile }) {
  const fileUrl = `/api/workspace/file?path=${encodeURIComponent(file.path)}`;
  const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(file.ext);
  const isVideo = ["mp4", "webm"].includes(file.ext);
  const isAudio = ["mp3", "wav", "ogg"].includes(file.ext);
  const isHtml = ["html", "htm"].includes(file.ext);
  const isText = !isImage && !isVideo && !isAudio;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <span className="text-sm font-medium truncate">{file.name}</span>
        <span className="text-xs text-muted-foreground shrink-0">
          {formatBytes(file.size)} · {timeAgo(file.mtime)}
        </span>
        <a href={fileUrl} target="_blank" rel="noopener noreferrer"
          className="ml-auto text-xs text-primary hover:underline shrink-0">
          Open raw ↗
        </a>
      </div>
      <div className="flex-1 overflow-hidden">
        {isHtml && (
          <iframe src={fileUrl} sandbox="allow-scripts allow-same-origin"
            className="w-full h-full border-0" title={file.name} />
        )}
        {isImage && (
          <div className="flex items-center justify-center h-full p-6 bg-black/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fileUrl} alt={file.name}
              className="max-w-full max-h-full object-contain rounded-lg" />
          </div>
        )}
        {isVideo && (
          <div className="flex items-center justify-center h-full p-6 bg-black/20">
            <video src={fileUrl} controls className="max-w-full max-h-full rounded-lg" />
          </div>
        )}
        {isAudio && (
          <div className="flex items-center justify-center h-full">
            <audio src={fileUrl} controls className="w-64" />
          </div>
        )}
        {isText && !isHtml && <TextPreview fileUrl={fileUrl} />}
      </div>
    </div>
  );
}

function TextPreview({ fileUrl }: { fileUrl: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setContent(null);
    fetch(fileUrl)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
      .then((text) => { if (!cancelled) { setContent(text); setLoading(false); } })
      .catch((err: unknown) => { if (!cancelled) { setError(String(err)); setLoading(false); } });
    return () => { cancelled = true; };
  }, [fileUrl]);

  if (loading) return <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Loading…</div>;
  if (error) return <div className="flex items-center justify-center h-full text-destructive text-sm">{error}</div>;

  return (
    <ScrollArea className="h-full">
      <pre className="p-6 text-xs font-mono leading-relaxed text-foreground whitespace-pre-wrap break-words">
        {content}
      </pre>
    </ScrollArea>
  );
}
