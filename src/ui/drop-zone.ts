import type { DropZoneCallbacks } from "../types";
import { imageDataFromSource } from "../scanner/image-processor";

type ImageHandler = (blob: Blob) => Promise<void>;

function renderPreview(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  imageData: ImageData,
): void {
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.putImageData(imageData, 0, 0);
  container.hidden = false;
}

function extractImageFile(transfer: DataTransfer): File | undefined {
  return Array.from(transfer.files).find((f) => f.type.startsWith("image/"));
}

function extractPastedImage(items: DataTransferItemList): File | undefined {
  for (const item of Array.from(items)) {
    if (item.type.startsWith("image/")) return item.getAsFile() ?? undefined;
  }
  return undefined;
}

function setupDragAndDrop(
  dropZone: HTMLElement,
  onImage: ImageHandler,
  signal: AbortSignal,
): void {
  dropZone.addEventListener(
    "dragover",
    (e) => {
      if (!e.dataTransfer?.types.includes("Files")) return;
      e.preventDefault();
      dropZone.classList.add("drop-zone--dragging");
    },
    { signal },
  );

  dropZone.addEventListener(
    "dragleave",
    (e) => {
      const related = e.relatedTarget;
      if (
        !related ||
        !(related instanceof Node) ||
        !dropZone.contains(related)
      ) {
        dropZone.classList.remove("drop-zone--dragging");
      }
    },
    { signal },
  );

  dropZone.addEventListener(
    "drop",
    (e) => {
      e.preventDefault();
      dropZone.classList.remove("drop-zone--dragging");
      if (!e.dataTransfer) return;
      const file = extractImageFile(e.dataTransfer);
      if (file) onImage(file);
    },
    { signal },
  );
}

function setupPaste(onImage: ImageHandler, signal: AbortSignal): void {
  document.addEventListener(
    "paste",
    (e) => {
      if (!e.clipboardData) return;
      const file = extractPastedImage(e.clipboardData.items);
      if (file) onImage(file);
    },
    { signal },
  );
}

function setupClipboardButton(
  btn: HTMLElement,
  onImage: ImageHandler,
  onError: (message: string) => void,
  signal: AbortSignal,
): void {
  btn.addEventListener(
    "click",
    async () => {
      try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find((t) => t.startsWith("image/"));
          if (!imageType) continue;
          const blob = await item.getType(imageType);
          await onImage(blob);
          return;
        }
        onError("クリップボードに画像がありません");
      } catch (err) {
        if (err instanceof DOMException && err.name === "NotAllowedError") {
          onError("クリップボードへのアクセスが許可されていません");
          return;
        }
        onError(
          err instanceof Error
            ? err.message
            : "クリップボードの読み取りに失敗しました",
        );
      }
    },
    { signal },
  );
}

function setupFileInput(
  input: HTMLInputElement,
  onImage: ImageHandler,
  signal: AbortSignal,
): void {
  input.addEventListener(
    "change",
    () => {
      const file = input.files?.[0];
      if (file) onImage(file);
      input.value = "";
    },
    { signal },
  );
}

export function initDropZone(callbacks: DropZoneCallbacks): () => void {
  const dropZone = document.getElementById("drop-zone");
  const previewContainer = document.getElementById("preview-container");
  const canvas = document.getElementById("preview-canvas");
  const clipboardBtn = document.getElementById("btn-clipboard");
  const fileInput = document.getElementById("file-input");

  if (!dropZone || !previewContainer || !(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Required DOM elements not found: #drop-zone, #preview-container, #preview-canvas");
  }

  const ac = new AbortController();
  const { signal } = ac;

  const handleImage: ImageHandler = async (blob) => {
    try {
      const imageData = await imageDataFromSource(blob);
      renderPreview(previewContainer, canvas, imageData);
      callbacks.onImageReady(imageData);
    } catch (err) {
      callbacks.onError(
        err instanceof Error ? err.message : "画像の処理に失敗しました",
      );
    }
  };

  setupDragAndDrop(dropZone, handleImage, signal);
  setupPaste(handleImage, signal);

  if (clipboardBtn) {
    setupClipboardButton(clipboardBtn, handleImage, callbacks.onError, signal);
  }

  if (fileInput instanceof HTMLInputElement) {
    setupFileInput(fileInput, handleImage, signal);
  }

  return () => ac.abort();
}
