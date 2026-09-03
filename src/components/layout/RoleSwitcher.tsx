"use client";

import React, { useState } from "react";
import { useUser } from "@/lib/auth/UserContext";
import { Check, ChevronDown, Sparkles } from "lucide-react";

export function RoleSwitcher() {
  const { currentUser, demoUsers, switchUser, isLoading } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "EXPERT":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "REVIEWER":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "CREATOR":
      default:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-xs text-zinc-300 transition-colors"
        title="Switch active persona to test different roles"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-medium text-zinc-400 hidden sm:inline">Role:</span>
        <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-medium border ${getRoleBadge(currentUser?.role || "CREATOR")}`}>
          {currentUser?.role || "CREATOR"}
        </span>
        <span className="text-zinc-500 font-mono hidden md:inline">@{currentUser?.username || "alexrivera"}</span>
        <ChevronDown className="w-3 h-3 text-zinc-500" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 rounded-xl border border-white/[0.1] bg-[#0f0f12] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2.5 py-1.5 border-b border-white/[0.06] mb-1 flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-zinc-300" /> Switch Test Persona
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">1-click QA</span>
            </div>

            <div className="space-y-1">
              {demoUsers.map((user) => {
                const isActive = currentUser?.id === user.id;
                return (
                  <button
                    key={user.id}
                    onClick={async () => {
                      await switchUser(user.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                      isActive ? "bg-white/[0.08] border border-white/[0.12]" : "hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover border border-white/[0.1]" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-300 font-bold">
                          {user.name.slice(0, 1)}
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                          {user.name}
                          <span className={`px-1 py-0.2 rounded text-[9px] font-mono border ${getRoleBadge(user.role)}`}>
                            {user.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono">@{user.username}</div>
                      </div>
                    </div>

                    {isActive && <Check className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 pt-2 border-t border-white/[0.06] px-2 text-[10px] text-zinc-500 leading-relaxed">
              Switching personas updates permissions, navigation options, and dashboard context immediately.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
