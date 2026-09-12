"use client";

import React, { useState } from "react";
import { Copy, Check, RotateCcw, Share2, Zap } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ReportActionsProps {
  reportId: string;
  targetUrl: string;
  sha256: string;
}

export function ReportActions({ reportId, targetUrl, sha256 }: ReportActionsProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedDigest, setCopiedDigest] = useState(false);
  const [isRescanning, setIsRescanning] = useState(false);
  const router = useRouter();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      toast.success("Audit report URL copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  const handleCopyDigest = async () => {
    try {
      await navigator.clipboard.writeText(sha256);
      setCopiedDigest(true);
      toast.success("SHA-256 digest copied!");
      setTimeout(() => setCopiedDigest(false), 2000);
    } catch {
      toast.error("Failed to copy digest");
    }
  };

  const handleRescan = async () => {
    setIsRescanning(true);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rescan failed");

      toast.success(`Rescan completed! Score: ${data.score}/100`);
      router.push(`/report/${data.id}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to rescan target");
    } finally {
      setIsRescanning(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 shrink-0">
      <button
        onClick={handleCopyLink}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-colors cursor-pointer"
        title="Copy shareable link"
      >
        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-neutral-500" />}
        <span>{copiedLink ? "Copied" : "Share Report"}</span>
      </button>

      <button
        onClick={handleCopyDigest}
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-colors cursor-pointer"
        title="Copy SHA-256 hash"
      >
        {copiedDigest ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-neutral-500" />}
        <span>Copy SHA-256</span>
      </button>

      <button
        onClick={handleRescan}
        disabled={isRescanning}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-colors disabled:opacity-60 cursor-pointer"
      >
        {isRescanning ? (
          <>
            <Zap className="w-3.5 h-3.5 animate-spin text-amber-400" />
            <span>Rescanning...</span>
          </>
        ) : (
          <>
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-run Audit</span>
          </>
        )}
      </button>
    </div>
  );
}
