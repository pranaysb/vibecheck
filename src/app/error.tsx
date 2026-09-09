"use client";

import React, { useEffect, useState } from "react";
import { AlertOctagon, Copy, Check, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [traceId, setTraceId] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setTraceId(`trace_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`);
    console.error("Global runtime error caught:", error);
  }, [error]);

  const copyDetails = () => {
    const details = JSON.stringify(
      {
        traceId,
        message: error.message,
        digest: error.digest,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    );
    navigator.clipboard.writeText(details);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white border border-neutral-200 rounded-lg p-6 shadow-sm space-y-4 text-left">
        <div className="flex items-center gap-2.5 text-rose-700">
          <AlertOctagon className="w-5 h-5 text-rose-600" strokeWidth={1.5} />
          <h1 className="text-sm font-semibold text-neutral-900">
            Application Runtime Fault
          </h1>
        </div>

        <p className="text-xs text-neutral-600 leading-relaxed">
          An unhandled component exception occurred while rendering this view. Our observability pipeline has captured the trace.
        </p>

        <div className="p-3 rounded bg-neutral-50 border border-neutral-200 font-mono text-[11px] text-neutral-700 space-y-1">
          <div><span className="text-neutral-400">Trace ID:</span> {traceId}</div>
          <div><span className="text-neutral-400">Digest:</span> {error.digest || "none"}</div>
          <div className="text-rose-700 truncate"><span className="text-neutral-400">Message:</span> {error.message}</div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={copyDetails}
            className="h-8 px-3 rounded text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />}
            <span>{copied ? "Copied" : "Copy Trace"}</span>
          </button>

          <button
            type="button"
            onClick={() => reset()}
            className="h-8 px-3 rounded text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 flex items-center gap-1.5 transition-colors ml-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Retry Operation</span>
          </button>
        </div>
      </div>
    </div>
  );
}
