const SCANNING_CLASS = "preview--scanning";
const SCAN_LINE_CLASS = "scan-line--active";

const noop = (): void => {};

export function startScanAnimation(): () => void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return noop;
  }

  const previewContainer = document.getElementById("preview-container");
  const scanLine = document.getElementById("scan-line");

  previewContainer?.classList.add(SCANNING_CLASS);
  scanLine?.classList.add(SCAN_LINE_CLASS);

  return () => {
    previewContainer?.classList.remove(SCANNING_CLASS);
    scanLine?.classList.remove(SCAN_LINE_CLASS);
  };
}
