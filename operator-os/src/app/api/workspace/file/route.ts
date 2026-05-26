import { NextRequest, NextResponse } from "next/server";
import { readFileBinary, readFileText, exists } from "@/lib/filesystem";
import path from "path";

export const dynamic = "force-dynamic";

// MIME map for common types
const MIME: Record<string, string> = {
  html: "text/html",
  htm: "text/html",
  css: "text/css",
  js: "application/javascript",
  ts: "application/typescript",
  json: "application/json",
  md: "text/markdown",
  txt: "text/plain",
  py: "text/x-python",
  sh: "text/x-sh",
  yaml: "text/yaml",
  yml: "text/yaml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  webm: "video/webm",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
};

const TEXT_EXTS = new Set([
  "html","htm","css","js","ts","json","md","txt","py","sh","yaml","yml","csv",
  "xml","jsx","tsx","sql","env","gitignore","toml","ini","cfg","conf",
]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get("path");

  if (!filePath) {
    return NextResponse.json({ error: "path is required" }, { status: 400 });
  }

  if (!exists(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase().replace(".", "");
  const mime = MIME[ext] ?? "application/octet-stream";
  const isText = TEXT_EXTS.has(ext);

  try {
    if (isText) {
      const content = await readFileText(filePath);
      return new NextResponse(content, {
        headers: {
          "Content-Type": mime + "; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    } else {
      const buf = await readFileBinary(filePath);
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          "Content-Type": mime,
          "Cache-Control": "no-store",
          "Content-Length": String(buf.length),
        },
      });
    }
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to read file", detail: String(err) },
      { status: 500 }
    );
  }
}
