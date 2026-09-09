"use client";

import React, { useState } from "react";
import { useUser } from "@/lib/auth/UserContext";
import { Check, ChevronDown, UserCheck } from "lucide-react";

export function RoleSwitcher() {
  const { currentUser, demoUsers, switchUser, isLoading } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-neutral-100 text-neutral-900 border-neutral-300";
      case "EXPERT":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "REVIEWER":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "CREATOR":
      default:
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
    }
  };

  const getRoleTitle = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Admin";
      case "EXPERT":
        return "Staff Architect";
      case "REVIEWER":
        return "Reviewer";
      case "CREATOR":
      default:
        return "Lead Engineer";
    }
  };

  return (
    <div className="relative font-sans">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="h-8 flex items-center gap-1.5 px-2.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 text-xs text-neutral-700 transition-colors focus:ring-2 focus:ring-neutral-900 focus:outline-none"
        title="Switch active persona to audit RBAC permissions"
        aria-label="Switch RBAC Persona"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-medium border ${getRoleBadge(currentUser?.role || "CREATOR")}`}>
          {getRoleTitle(currentUser?.role || "CREATOR")}
        </span>
        <span className="text-neutral-500 font-mono hidden md:inline">@{currentUser?.username || "alexrivera"}</span>
        <ChevronDown className="w-3 h-3 text-neutral-400" strokeWidth={1.5} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            role="listbox"
            className="absolute right-0 mt-1.5 w-72 rounded-lg border border-neutral-200 bg-white shadow-lg p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="px-2.5 py-1.5 border-b border-neutral-100 mb-1 flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-neutral-700" strokeWidth={1.5} />
                <span>RBAC Persona Switcher</span>
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">IAM Simulation</span>
            </div>

            <div className="space-y-0.5">
              {demoUsers.map((user) => {
                const isActive = currentUser?.id === user.id;
                return (
                  <button
                    key={user.id}
                    onClick={async () => {
                      await switchUser(user.id);
                      setIsOpen(false);
                    }}
                    role="option"
                    aria-selected={isActive}
                    className={`w-full flex items-center justify-between p-2 rounded-md text-left transition-colors ${
                      isActive ? "bg-neutral-100 border border-neutral-200 font-medium" : "hover:bg-neutral-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full object-cover border border-neutral-200" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-700 font-bold font-mono">
                          {user.name.slice(0, 1)}
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5">
                          {user.name}
                          <span className={`px-1 py-0.2 rounded text-[9px] font-mono border ${getRoleBadge(user.role)}`}>
                            {getRoleTitle(user.role)}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-500 font-mono">@{user.username}</div>
                      </div>
                    </div>

                    {isActive && <Check className="w-3.5 h-3.5 text-neutral-900" strokeWidth={2} />}
                  </button>
                );
              })}
            </div>

            <div className="mt-1.5 pt-1.5 border-t border-neutral-100 px-2 text-[10px] text-neutral-400 leading-relaxed font-mono">
              Simulates RBAC authorization policies across projects and audit views.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
