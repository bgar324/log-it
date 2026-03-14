export type CopyTextResult = "clipboard" | "manual";

function fallbackCopyTextToClipboard(text: string) {
  if (
    typeof window === "undefined"
    || typeof document === "undefined"
    || typeof document.execCommand !== "function"
    || !document.body
  ) {
    return false;
  }

  const activeElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const selection = window.getSelection();
  const previousRanges = selection
    ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index))
    : [];
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.tabIndex = -1;
  textarea.setAttribute("aria-hidden", "true");
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  textarea.style.fontSize = "16px";
  textarea.style.whiteSpace = "pre";

  document.body.appendChild(textarea);

  try {
    try {
      textarea.focus({ preventScroll: true });
    } catch {
      textarea.focus();
    }

    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);

    if (selection) {
      selection.removeAllRanges();

      for (const range of previousRanges) {
        selection.addRange(range);
      }
    }

    try {
      activeElement?.focus();
    } catch {
      // Ignore focus restore failures on elements that disappeared during copy.
    }
  }
}

function promptForManualCopy(text: string) {
  if (typeof window === "undefined" || typeof window.prompt !== "function") {
    throw new Error("Clipboard is not available in this environment.");
  }

  window.prompt("Copy this text:", text);
  return "manual" as const;
}

export async function copyTextToClipboard(text: string): Promise<CopyTextResult> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return "clipboard";
    } catch {
      if (fallbackCopyTextToClipboard(text)) {
        return "clipboard";
      }

      return promptForManualCopy(text);
    }
  }

  if (fallbackCopyTextToClipboard(text)) {
    return "clipboard";
  }

  return promptForManualCopy(text);
}
