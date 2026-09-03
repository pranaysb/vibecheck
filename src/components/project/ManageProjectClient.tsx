"use client";

import React, { useState } from "react";
import { Plus, TrendingUp } from "lucide-react";
import { ReleaseVersionModal } from "./ReleaseVersionModal";

export function ManageProjectClient({
  projectId,
  projectSlug,
  openFindings,
  nextVersionNumber,
}: {
  projectId: string;
  projectSlug: string;
  openFindings: any[];
  nextVersionNumber: string;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-500/20"
      >
        <TrendingUp className="w-4 h-4" />
        <span>Release New Version ({nextVersionNumber})</span>
      </button>

      <ReleaseVersionModal
        projectId={projectId}
        projectSlug={projectSlug}
        openFindings={openFindings}
        nextVersionNumber={nextVersionNumber}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
