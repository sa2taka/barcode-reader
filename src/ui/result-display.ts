import type { ScanResult, ResultDisplayApi } from "../types";

const COPY_FEEDBACK_MS = 2000;

function formatOrientation(orientation: ScanResult["orientation"]): string {
  if (orientation === 0) return "";
  return `${orientation}° 回転`;
}

function createBadge(text: string, modifier: string): HTMLSpanElement {
  const badge = document.createElement("span");
  badge.className = `badge badge--${modifier}`;
  badge.textContent = text;
  return badge;
}

function createBadges(result: ScanResult): HTMLDivElement {
  const container = document.createElement("div");
  container.className = "result-card__badges";

  container.appendChild(createBadge(result.format, "format"));

  const orientationText = formatOrientation(result.orientation);
  if (orientationText) {
    container.appendChild(createBadge(orientationText, "orientation"));
  }

  if (result.wasInverted) {
    container.appendChild(createBadge("反転検出", "inverted"));
  }

  return container;
}

function createCopyButton(value: string): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "btn-copy";
  btn.textContent = "コピー";
  btn.type = "button";

  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(value);
      btn.textContent = "コピー済み ✓";
      btn.classList.add("btn-copy--copied");
      setTimeout(() => {
        btn.textContent = "コピー";
        btn.classList.remove("btn-copy--copied");
      }, COPY_FEEDBACK_MS);
    } catch {
      btn.textContent = "コピー失敗";
      btn.classList.add("btn-copy--failed");
      setTimeout(() => {
        btn.textContent = "コピー";
        btn.classList.remove("btn-copy--failed");
      }, COPY_FEEDBACK_MS);
    }
  });

  return btn;
}

function createResultCard(result: ScanResult): HTMLElement {
  const card = document.createElement("article");
  card.className = "result-card result-card--entering";

  card.appendChild(createBadges(result));

  const value = document.createElement("p");
  value.className = "result-card__value";
  value.textContent = result.value;
  card.appendChild(value);

  card.appendChild(createCopyButton(result.value));

  card.addEventListener(
    "animationend",
    () => card.classList.remove("result-card--entering"),
    { once: true },
  );

  return card;
}

function createSkeleton(): HTMLElement {
  const card = document.createElement("article");
  card.className = "result-card result-card--skeleton";

  const badgeLine = document.createElement("div");
  badgeLine.className = "skeleton-line skeleton-line--short";
  card.appendChild(badgeLine);

  const valueLine = document.createElement("div");
  valueLine.className = "skeleton-line skeleton-line--long";
  card.appendChild(valueLine);

  const btnLine = document.createElement("div");
  btnLine.className = "skeleton-line skeleton-line--short";
  card.appendChild(btnLine);

  return card;
}

export function initResultDisplay(): ResultDisplayApi {
  const resultsSection = document.getElementById("results");
  const container = document.getElementById("results-container");

  return {
    showSkeleton(): void {
      if (!resultsSection || !container) return;

      container.textContent = "";
      resultsSection.hidden = false;
      container.appendChild(createSkeleton());
    },

    showResult(result: ScanResult): void {
      if (!resultsSection || !container) return;

      container.textContent = "";
      resultsSection.hidden = false;
      container.appendChild(createResultCard(result));
    },

    clear(): void {
      if (!container || !resultsSection) return;
      container.textContent = "";
      resultsSection.hidden = true;
    },
  };
}
