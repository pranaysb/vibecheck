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
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
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
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs text-slate-800 transition-colors shadow-xs"
        title="Switch active persona to test different roles"
      >
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-semibold text-slate-500 hidden sm:inline">Role:</span>
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getRoleBadge(currentUser?.role || "CREATOR")}`}>
          {currentUser?.role || "CREATOR"}
        </span>
        <span className="text-slate-500 font-mono hidden md:inline">@{currentUser?.username || "alexrivera"}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-2 border-b border-slate-100 mb-1 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Switch Test Persona
              </span>
              <span className="text-[10px] text-slate-400 font-mono">1-click QA</span>
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
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors ${
                      isActive ? "bg-indigo-50/80 border border-indigo-200" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-600 font-bold">
                          {user.name.slice(0, 1)}
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          {user.name}
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${getRoleBadge(user.role)}`}>
                            {user.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">@{user.username}</div>
                      </div>
                    </div>

                    {isActive && <Check className="w-4 h-4 text-indigo-600" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 pt-2 border-t border-slate-100 px-2 text-[10px] text-slate-400 leading-relaxed">
              Switching personas updates permissions, navigation options, and dashboard context immediately.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
