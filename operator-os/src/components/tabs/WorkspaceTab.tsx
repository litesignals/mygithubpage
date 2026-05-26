"use client";

import { useState, useEffect } from "react";
import {
  ImageIcon,
  Video,
  Globe,
  FileText,
  File,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { formatBytes, timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { WorkspaceBucket, WorkspaceFile } from "@/lib/types";

const BUCKETS: {
  id: WorkspaceBucket;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { id: "images", label: "Studio Images", icon: ImageIcon, color: "text-purple-400" },
  { id: "videos", label: "Studio Videos", icon: Video, color: "text-blue-400" },
  { id: "apps", label: "Apps", icon: Globe, color: "text-emerald-400" },
  { id: "scratch", label: "Scratch", icon: FileText, color: "text-amber-400" },
];

const EXT_ICONS: Record<string, React.ElementType> = {
  html: Globe,
  htm: Globe,
  png: ImageIcon,
  jpg: ImageIcon,
  jpeg: ImageIcon,
  gif: ImageIcon,
  webp: ImageIcon,
  mp4: Video,
  webm: Video,
};

function getFileIcon(ext: string): React.ElementType {
  return EXT_ICONS[ext] ?? File;
}

export function WorkspaceTab() {
  const [activeBucket, setActiveBucket] = useState<WorkspaceBucket>("images");
  const [selectedFile, setSelectedFile] = useState<WorkspaceFile | null>(null);

  const { data: files = [], isLoading, refetch } = useWorkspace(activeBucket);

  function handleBucketClick(bucket: WorkspaceBucket) {
    setActiveBucket(bucket);
    setSelectedFile(null);
  }

  return (
    <div className="flex h-full">
      {/* Bucket rail */}
      <div className="w-[180px] shrink-0 border-r border-border bg-card flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Buckets
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => refetch()}
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
        <div className="p-2 space-y-0.5">
          {BUCKETS.map((bucket) => (
            <button
              key={bucket.id}
              onClick={() => handleBucketClick(bucket.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                activeBucket === bucket.id
                  ? "bg-primary/15 text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <bucket.icon
                className={cn(
                  "w-4 h-4 shrink-0",
                  activeBucket === bucket.id ? bucket.color : ""
                )}
              />
              <span className="truncate">{bucket.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* File list */}
      <div className="w-[240px] shrink-0 border-r border-border flex flex-col">
        <div className="px-4 py-3 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {BUCKETS.find((b) => b.id === activeBucket)?.label}
          </span>
        </div>
        <ScrollArea className="flex-1">
          {isLoading && (
            <p className="text-xs text-muted-foreground px-4 py-3">
              Scanning…
            </p>
          )}
          {!isLoading && files.length === 0 && (
            <p className="text-xs text-muted-foreground px-4 py-3">
              No files found
            </p>
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
                    <p className="text-[10px] text-muted-foreground/60">
                      {formatBytes(file.size)}
                    </p>
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
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">Select a file to preview</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FilePreview({ file }: { file: WorkspaceFile }) {
  const fileUrl = `/api/workspace/file?path=${encodeURIComponent(file.path)}`;

  const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(
    file.ext
  );
  const isVideo = ["mp4", "webm"].includes(file.ext);
  const isAudio = ["mp3", "wav", "ogg"].includes(file.ext);
  const isHtml = ["html", "htm"].includes(file.ext);
  const isText = !isImage && !isVideo && !isAudio;

  return (
    <div className="flex flex-col h-full">
      {/* Preview header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <span className="text-sm font-medium truncate">{file.name}</span>
        <span className="text-xs text-muted-foreground shrink-0">
          {formatBytes(file.size)} · {timeAgo(file.mtime)}
        </span>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs text-primary hover:underline shrink-0"
        >
          Open raw ↗
        </a>
      </div>

      {/* Preview content */}
      <div className="flex-1 overflow-hidden">
        {isHtml && (
          <iframe
            src={fileUrl}
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-full border-0"
            title={file.name}
          />
        )}
        {isImage && (
          <div className="flex items-center justify-center h-full p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fileUrl}
              alt={file.name}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        )}
        {isVideo && (
          <div className="flex items-center justify-center h-full p-6">
            <video
              src={fileUrl}
              controls
              className="max-w-full max-h-full rounded-lg"
            />
          </div>
        )}
        {isAudio && (
          <div className="flex items-center justify-center h-full">
            <audio src={fileUrl} controls className="w-64" />
          </div>
        )}
        {isText && !isHtml && (
          <TextPreview fileUrl={fileUrl} ext={file.ext} />
        )}
      </div>
    </div>
  );
}

function TextPreview({
  fileUrl,
  ext,
}: {
  fileUrl: string;
  ext: string;
}) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setContent(null);
    fetch(fileUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((text) => {
        if (!cancelled) {
          setContent(text);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(String(err));
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [fileUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive text-sm">
        {error}
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <pre className="p-6 text-xs font-mono leading-relaxed text-foreground whitespace-pre-wrap break-words">
        {content}
      </pre>
    </ScrollArea>
  );
}
