"use client";

import { useState } from "react";

/** Copies `text`. Where the clipboard is refused, selects the element `selectId` instead so ⌘C / Ctrl+C works. */
export function CopyButton({ text, label = "Copy", selectId }: { text: string; label?: string; selectId?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const [mac, setMac] = useState(true);
  return (
    <button
      type="button"
      className="btn btn-secondary btn-sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setState("copied");
        } catch {
          setMac(/Mac|iPhone|iPad/.test(navigator.userAgent));
          const el = selectId ? document.getElementById(selectId) : null;
          if (el) {
            const range = document.createRange();
            range.selectNodeContents(el);
            window.getSelection()?.removeAllRanges();
            window.getSelection()?.addRange(range);
          }
          setState("failed");
        }
        setTimeout(() => setState("idle"), 2500);
      }}
    >
      <span aria-live="polite">{state === "copied" ? "Copied" : state === "failed" ? (selectId ? `Selected, press ${mac ? "⌘C" : "Ctrl+C"}` : "Copy blocked") : label}</span>
    </button>
  );
}
