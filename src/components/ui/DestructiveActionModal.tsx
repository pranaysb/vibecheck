"use client";

import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface DestructiveActionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmMatchText: string; // e.g. "DELETE" or workspace name
  actionButtonLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function DestructiveActionModal({
  isOpen,
  title,
  description,
  confirmMatchText,
  actionButtonLabel = "Confirm Deletion",
  onConfirm,
  onClose,
}: DestructiveActionModalProps) {
  const [typedValue, setTypedValue] = useState("");

  if (!isOpen) return null;

  const isMatched = typedValue.trim() === confirmMatchText.trim();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="destructive-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/50 backdrop-blur-xs font-sans"
    >
      <div className="bg-white border border-neutral-200 rounded-lg max-w-md w-full shadow-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-rose-50/50">
          <div className="flex items-center gap-2.5 text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600" strokeWidth={1.5} />
            <h2 id="destructive-title" className="text-sm font-semibold text-neutral-900">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cancel destructive dialog"
            className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-neutral-600">
          <p className="leading-relaxed">{description}</p>

          <div className="p-3 rounded bg-neutral-50 border border-neutral-200 text-neutral-700">
            Please type <strong className="font-mono font-bold text-neutral-900">{confirmMatchText}</strong> to confirm this irreversible action:
          </div>

          <input
            type="text"
            value={typedValue}
            onChange={(e) => setTypedValue(e.target.value)}
            placeholder={confirmMatchText}
            autoFocus
            className="w-full h-9 px-3 bg-white border border-neutral-300 rounded-md text-xs text-neutral-900 font-mono focus:outline-none focus:ring-2 focus:ring-rose-600 focus:border-rose-600"
          />
        </div>

        {/* Actions */}
        <div className="px-5 py-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-3 rounded text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-300"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isMatched}
            onClick={() => {
              if (isMatched) {
                onConfirm();
                onClose();
              }
            }}
            className="h-8 px-3 rounded text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            {actionButtonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
