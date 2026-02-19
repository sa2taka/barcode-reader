import { scanImageData } from "@undecaf/zbar-wasm";
import type { ScanResult } from "../types";
import { toGrayscale, normalizeContrast, rotateImage, invertImage } from "./image-processor";

const ROTATIONS = [0, 90, 180, 270] as const;

async function tryScan(
  imageData: ImageData,
  orientation: 0 | 90 | 180 | 270,
  wasInverted: boolean,
): Promise<ScanResult | null> {
  const symbols = await scanImageData(imageData);

  if (symbols.length === 0) {
    return null;
  }

  const symbol = symbols[0];
  return {
    value: symbol.decode(),
    format: symbol.typeName,
    orientation,
    wasInverted,
    scannedAt: new Date(),
  };
}

export async function scanBarcode(rawImageData: ImageData): Promise<ScanResult | null> {
  const grayscale = toGrayscale(rawImageData);
  const normalized = normalizeContrast(grayscale);

  for (const degrees of ROTATIONS) {
    const rotated = rotateImage(normalized, degrees);

    const normalResult = await tryScan(rotated, degrees, false);
    if (normalResult) {
      return normalResult;
    }

    const inverted = invertImage(rotated);
    const invertedResult = await tryScan(inverted, degrees, true);
    if (invertedResult) {
      return invertedResult;
    }
  }

  return null;
}
