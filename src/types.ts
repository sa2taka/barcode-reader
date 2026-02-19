export interface ScanResult {
  readonly value: string;
  readonly format: string;
  readonly orientation: 0 | 90 | 180 | 270;
  readonly wasInverted: boolean;
  readonly scannedAt: Date;
}

export interface DropZoneCallbacks {
  onImageReady: (imageData: ImageData) => void;
  onError: (message: string) => void;
}

export interface ResultDisplayApi {
  showResult: (result: ScanResult) => void;
  clear: () => void;
}
