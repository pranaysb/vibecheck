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
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "EXPERT":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "REVIEWER":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "CREATOR":
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs text-zinc-700 transition-colors shadow-2xs"
        title="Switch active persona to test different roles"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-medium text-zinc-500 hidden sm:inline">Role:</span>
        <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-medium border ${getRoleBadge(currentUser?.role || "CREATOR")}`}>
          {currentUser?.role || "CREATOR"}
        </span>
        <span className="text-zinc-500 font-mono hidden md:inline">@{currentUser?.username || "alexrivera"}</span>
        <ChevronDown className="w-3 h-3 text-zinc-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 rounded-xl border border-zinc-200 bg-white shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2.5 py-1.5 border-b border-zinc-100 mb-1 flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-zinc-700" /> Switch Test Persona
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">1-click QA</span>
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
                      isActive ? "bg-zinc-100 border border-zinc-200" : "hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover border border-zinc-200" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-xs text-zinc-700 font-bold">
                          {user.name.slice(0, 1)}
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-medium text-zinc-900 flex items-center gap-1.5">
                          {user.name}
                          <span className={`px-1 py-0.2 rounded text-[9px] font-mono border ${getRoleBadge(user.role)}`}>
                            {user.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono">@{user.username}</div>
                      </div>
                    </div>

                    {isActive && <Check className="w-4 h-4 text-zinc-900" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 pt-2 border-t border-zinc-100 px-2 text-[10px] text-zinc-400 leading-relaxed">
              Switching personas updates permissions, navigation options, and dashboard context immediately.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
