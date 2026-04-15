"use client";

import React, { useCallback, useRef, useState } from "react";
import { Upload, FileText, X, Loader2, AlertCircle } from "lucide-react";

interface ExtractedImage {
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  page: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onImagesReady: (images: ExtractedImage[]) => void;
}

/** Convert a canvas to a compressed Blob (JPEG) */
function canvasToBlob(
  source: HTMLCanvasElement,
  srcWidth: number,
  srcHeight: number,
): Promise<{ blob: Blob; width: number; height: number }> {
  const MAX_DIM = 800;
  const QUALITY = 0.75;

  let w = srcWidth;
  let h = srcHeight;

  if (w > MAX_DIM || h > MAX_DIM) {
    const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
    w = Math.round(w * ratio);
    h = Math.round(h * ratio);
  }

  let target = source;
  if (w !== srcWidth || h !== srcHeight) {
    const resized = document.createElement("canvas");
    resized.width = w;
    resized.height = h;
    const ctx = resized.getContext("2d")!;
    ctx.drawImage(source, 0, 0, w, h);
    target = resized;
  }

  return new Promise((resolve) => {
    target.toBlob(
      (blob) => resolve({ blob: blob!, width: w, height: h }),
      "image/jpeg",
      QUALITY,
    );
  });
}

/** Upload a Blob to the server and get back a persistent URL */
async function uploadImage(blob: Blob, filename: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", blob, filename);

  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);

  const json = await res.json();
  return json.url;
}

export function PdfUploadDialog({ open, onClose, onImagesReady }: Props) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: "" });
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    if (isProcessing) return;
    setError(null);
    onClose();
  }, [isProcessing, onClose]);

  const processFile = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") {
        setError("Bitte eine PDF-Datei auswählen.");
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;

        // Phase 1: Extract images from PDF pages
        const canvasImages: {
          canvas: HTMLCanvasElement;
          width: number;
          height: number;
          page: number;
        }[] = [];

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          setProgress({ current: pageNum, total: totalPages, phase: "Extrahiere" });

          const page = await pdf.getPage(pageNum);
          let pageImageCount = 0;

          try {
            const ops = await page.getOperatorList();
            const imgKeys = new Set<string>();
            const imageOps = [
              pdfjsLib.OPS.paintImageXObject,
              pdfjsLib.OPS.paintXObject,
              pdfjsLib.OPS.paintImageMaskXObject,
            ].filter(Boolean);

            for (let i = 0; i < ops.fnArray.length; i++) {
              if (imageOps.includes(ops.fnArray[i])) {
                const arg = ops.argsArray[i]?.[0];
                if (typeof arg === "string") imgKeys.add(arg);
              }
            }

            for (const key of imgKeys) {
              try {
                const imgData: any = await new Promise((resolve, reject) => {
                  const timer = setTimeout(() => reject(new Error("timeout")), 3000);
                  page.objs.get(key, (data: any) => {
                    clearTimeout(timer);
                    if (data) resolve(data);
                    else reject(new Error("no data"));
                  });
                });

                if (!imgData || (imgData.width ?? 0) < 60 || (imgData.height ?? 0) < 60) continue;

                const canvas = document.createElement("canvas");
                canvas.width = imgData.width;
                canvas.height = imgData.height;
                const ctx = canvas.getContext("2d")!;

                if (imgData.bitmap) {
                  ctx.drawImage(imgData.bitmap, 0, 0);
                  canvasImages.push({ canvas, width: imgData.width, height: imgData.height, page: pageNum });
                  pageImageCount++;
                } else if (imgData.data) {
                  const imageData = ctx.createImageData(imgData.width, imgData.height);
                  const src = imgData.data;
                  const dst = imageData.data;
                  if (imgData.kind === 2) {
                    let si = 0, di = 0;
                    for (let p = 0; p < imgData.width * imgData.height; p++) {
                      dst[di++] = src[si++]; dst[di++] = src[si++]; dst[di++] = src[si++]; dst[di++] = 255;
                    }
                  } else if (imgData.kind === 1) {
                    let si = 0, di = 0;
                    for (let p = 0; p < imgData.width * imgData.height; p++) {
                      const v = src[si++]; dst[di++] = v; dst[di++] = v; dst[di++] = v; dst[di++] = 255;
                    }
                  } else {
                    imageData.data.set(src);
                  }
                  ctx.putImageData(imageData, 0, 0);
                  canvasImages.push({ canvas, width: imgData.width, height: imgData.height, page: pageNum });
                  pageImageCount++;
                } else if (imgData.src) {
                  const img = new Image();
                  const loaded = await new Promise<boolean>((resolve) => {
                    img.onload = () => resolve(true);
                    img.onerror = () => resolve(false);
                    img.src = imgData.src;
                  });
                  if (loaded && img.width > 60 && img.height > 60) {
                    canvas.width = img.width; canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    canvasImages.push({ canvas, width: img.width, height: img.height, page: pageNum });
                    pageImageCount++;
                  }
                }
              } catch { /* skip image */ }
            }
          } catch { /* operator list failed */ }

          if (pageImageCount === 0) {
            try {
              const viewport = page.getViewport({ scale: 1.5 });
              const canvas = document.createElement("canvas");
              canvas.width = viewport.width; canvas.height = viewport.height;
              const ctx = canvas.getContext("2d")!;
              await page.render({ canvasContext: ctx, viewport }).promise;
              canvasImages.push({ canvas, width: viewport.width, height: viewport.height, page: pageNum });
            } catch { /* skip page */ }
          }
        }

        if (canvasImages.length === 0) {
          setError("Keine Bilder in der PDF gefunden.");
          setIsProcessing(false);
          return;
        }

        // Phase 2: Compress & upload each image to Vercel Blob
        const extractedImages: ExtractedImage[] = [];

        for (let i = 0; i < canvasImages.length; i++) {
          setProgress({ current: i + 1, total: canvasImages.length, phase: "Lade hoch" });
          const img = canvasImages[i];
          try {
            const { blob, width, height } = await canvasToBlob(img.canvas, img.width, img.height);
            const url = await uploadImage(blob, `pdf-p${img.page}-${i}.jpg`);
            extractedImages.push({ src: url, naturalWidth: width, naturalHeight: height, page: img.page });
          } catch {
            console.warn(`Upload of image ${i + 1} failed, skipping`);
          }
        }

        if (extractedImages.length === 0) {
          setError("Bilder konnten nicht hochgeladen werden. Prüfe die BLOB_READ_WRITE_TOKEN Umgebungsvariable.");
          setIsProcessing(false);
          return;
        }

        onImagesReady(extractedImages);
        setIsProcessing(false);
        onClose();
      } catch (err) {
        console.error("PDF processing error:", err);
        setError("Fehler beim Verarbeiten der PDF.");
        setIsProcessing(false);
      }
    },
    [onImagesReady, onClose],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); },
    [processFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ""; },
    [processFile],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={handleClose}>
      <div className="relative w-full max-w-md rounded-2xl border bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={handleClose} disabled={isProcessing} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-30">
          <X className="h-4 w-4" />
        </button>

        <h2 className="mb-1 text-lg font-semibold text-zinc-900">PDF hochladen</h2>
        <p className="mb-5 text-sm text-zinc-500">Bilder werden automatisch extrahiert und als Elemente auf dem Board platziert.</p>

        {!isProcessing ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 transition-all ${isDragOver ? "border-blue-400 bg-blue-50" : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-zinc-100"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${isDragOver ? "bg-blue-100" : "bg-white"}`}>
              {isDragOver ? <FileText className="h-6 w-6 text-blue-500" /> : <Upload className="h-6 w-6 text-zinc-400" />}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-700">{isDragOver ? "PDF hier ablegen" : "PDF-Datei hierher ziehen"}</p>
              <p className="mt-1 text-xs text-zinc-400">oder klicken zum Auswählen</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-xl border bg-zinc-50 px-6 py-10">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-700">
                {progress.phase === "Extrahiere" ? "Bilder werden extrahiert…" : "Bilder werden hochgeladen…"}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {progress.phase === "Extrahiere" ? `Seite ${progress.current} von ${progress.total}` : `Bild ${progress.current} von ${progress.total}`}
              </p>
            </div>
            <div className="h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-zinc-200">
              <div className="h-full rounded-full bg-zinc-900 transition-all duration-300" style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }} />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />{error}
          </div>
        )}

        <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
      </div>
    </div>
  );
}
