import "./style.css";
import { initDropZone } from "./ui/drop-zone";
import { initResultDisplay } from "./ui/result-display";
import { startScanAnimation } from "./ui/animations";
import { scanBarcode } from "./scanner/barcode-scanner";

const errorEl = document.getElementById("error");

const resultDisplay = initResultDisplay();

let scanGeneration = 0;

function showError(message: string): void {
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function hideError(): void {
  if (!errorEl) return;
  errorEl.textContent = "";
  errorEl.hidden = true;
}

async function handleImageReady(imageData: ImageData): Promise<void> {
  const currentGeneration = ++scanGeneration;

  hideError();
  resultDisplay.showSkeleton();

  const stopAnimation = startScanAnimation();

  try {
    const result = await scanBarcode(imageData);

    if (currentGeneration !== scanGeneration) return;

    if (result) {
      resultDisplay.showResult(result);
    } else {
      resultDisplay.clear();
      showError("バーコードを検出できませんでした。より鮮明な画像をお試しください。");
    }
  } catch (err) {
    if (currentGeneration !== scanGeneration) return;

    resultDisplay.clear();
    showError(
      err instanceof Error ? err.message : "スキャン中にエラーが発生しました",
    );
  } finally {
    if (currentGeneration === scanGeneration) {
      stopAnimation();
    }
  }
}

initDropZone({
  onImageReady: handleImageReady,
  onError: showError,
});
