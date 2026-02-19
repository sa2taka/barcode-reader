type RotationDegrees = 0 | 90 | 180 | 270;

export function toGrayscale(imageData: ImageData): ImageData {
  const { width, height, data: src } = imageData;
  const dst = new Uint8ClampedArray(src.length);

  for (let i = 0; i < src.length; i += 4) {
    const gray = Math.round(
      0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2],
    );
    dst[i] = gray;
    dst[i + 1] = gray;
    dst[i + 2] = gray;
    dst[i + 3] = src[i + 3];
  }

  return new ImageData(dst, width, height);
}

export function normalizeContrast(imageData: ImageData): ImageData {
  const { width, height, data: src } = imageData;

  let min = 255;
  let max = 0;
  for (let i = 0; i < src.length; i += 4) {
    const value = src[i];
    if (value < min) min = value;
    if (value > max) max = value;
  }

  const range = max - min;
  if (range === 0) {
    return new ImageData(new Uint8ClampedArray(src), width, height);
  }

  const dst = new Uint8ClampedArray(src.length);
  for (let i = 0; i < src.length; i += 4) {
    const value = Math.round(((src[i] - min) * 255) / range);
    dst[i] = value;
    dst[i + 1] = value;
    dst[i + 2] = value;
    dst[i + 3] = src[i + 3];
  }

  return new ImageData(dst, width, height);
}

export function invertImage(imageData: ImageData): ImageData {
  const { width, height, data: src } = imageData;
  const dst = new Uint8ClampedArray(src.length);

  for (let i = 0; i < src.length; i += 4) {
    dst[i] = 255 - src[i];
    dst[i + 1] = 255 - src[i + 1];
    dst[i + 2] = 255 - src[i + 2];
    dst[i + 3] = src[i + 3];
  }

  return new ImageData(dst, width, height);
}

function cloneImageData(imageData: ImageData): ImageData {
  const { width, height, data } = imageData;
  return new ImageData(new Uint8ClampedArray(data), width, height);
}

function copyPixel(
  src: Uint8ClampedArray,
  srcIndex: number,
  dst: Uint8ClampedArray,
  dstIndex: number,
): void {
  const si = srcIndex * 4;
  const di = dstIndex * 4;
  dst[di] = src[si];
  dst[di + 1] = src[si + 1];
  dst[di + 2] = src[si + 2];
  dst[di + 3] = src[si + 3];
}

export function rotateImage(imageData: ImageData, degrees: RotationDegrees): ImageData {
  if (degrees === 0) {
    return cloneImageData(imageData);
  }

  const { width, height, data: src } = imageData;

  if (degrees === 180) {
    const dst = new Uint8ClampedArray(src.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = y * width + x;
        const dstIdx = (height - 1 - y) * width + (width - 1 - x);
        copyPixel(src, srcIdx, dst, dstIdx);
      }
    }
    return new ImageData(dst, width, height);
  }

  const dstWidth = height;
  const dstHeight = width;
  const dst = new Uint8ClampedArray(dstWidth * dstHeight * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = y * width + x;
      const dstIdx = degrees === 90
        ? x * dstWidth + (height - 1 - y)
        : (width - 1 - x) * dstWidth + y;
      copyPixel(src, srcIdx, dst, dstIdx);
    }
  }

  return new ImageData(dst, dstWidth, dstHeight);
}

function drawToCanvas(
  bitmap: ImageBitmap,
  canvas: HTMLCanvasElement | OffscreenCanvas,
): ImageData {
  const ctx = canvas.getContext("2d") as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null;
  if (!ctx) {
    throw new Error("Failed to get 2d context");
  }
  ctx.drawImage(bitmap, 0, 0);
  return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
}

export async function imageDataFromSource(source: File | Blob | ImageBitmap): Promise<ImageData> {
  const bitmap = source instanceof ImageBitmap
    ? source
    : await createImageBitmap(source);

  const { width, height } = bitmap;

  if (typeof OffscreenCanvas !== "undefined") {
    return drawToCanvas(bitmap, new OffscreenCanvas(width, height));
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return drawToCanvas(bitmap, canvas);
}
