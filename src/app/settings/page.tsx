"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/lib/auth/UserContext";
import { User, Shield, Check, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { currentUser, refreshUser } = useUser();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setBio(currentUser.bio || "");
      setGithubUrl(currentUser.githubUrl || "");
    }
  }, [currentUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSaving(true);
    try {
      // In demo mode, simulate immediate persistence
      await new Promise((r) => setTimeout(r, 400));
      toast.success("Profile settings saved successfully!");
      if (refreshUser) refreshUser();
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8 text-xs">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 font-sans tracking-tight">
          Account & Profile Settings
        </h1>
        <p className="text-slate-400 mt-1">
          Manage your public developer profile and platform preferences.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-white/5">
          <img
            src={currentUser?.avatar || "/placeholder-avatar.png"}
            alt={currentUser?.name || "Avatar"}
            className="w-16 h-16 rounded-2xl object-cover border border-white/10"
          />
          <div>
            <div className="text-base font-bold text-slate-100">{currentUser?.name}</div>
            <div className="text-slate-400 font-mono">@{currentUser?.username}</div>
            <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase">
              Role: {currentUser?.role || "CREATOR"}
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-slate-200 font-semibold">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-slate-200 font-semibold">Bio / Headline</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-slate-200 font-semibold">GitHub Profile URL</label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username"
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="pt-4 border-t border-white/5 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save Settings"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
