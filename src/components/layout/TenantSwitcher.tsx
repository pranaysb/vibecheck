"use client";

import React, { useState, useEffect, useRef } from "react";
import { Building2, ChevronDown, Check, ShieldCheck } from "lucide-react";

export interface Tenant {
  id: string;
  name: string;
  tier: "Enterprise" | "Pro" | "Standard";
  region: string;
}

const TENANTS: Tenant[] = [
  { id: "org_acme", name: "Acme Systems", tier: "Enterprise", region: "us-east-1" },
  { id: "org_staging", name: "Acme Staging", tier: "Pro", region: "us-east-1" },
  { id: "org_personal", name: "Personal Sandbox", tier: "Standard", region: "us-west-2" },
];

export function TenantSwitcher() {
  const [activeTenant, setActiveTenant] = useState<Tenant>(TENANTS[0]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vc_org_id");
      if (saved) {
        const found = TENANTS.find((t) => t.id === saved);
        if (found) setActiveTenant(found);
      }
    } catch {}

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectTenant = (tenant: Tenant) => {
    setActiveTenant(tenant);
    try {
      localStorage.setItem("vc_org_id", tenant.id);
    } catch {}
    setIsOpen(false);
  };

  return (
    <div className="relative font-sans text-xs" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Switch organization tenant"
        className="h-8 px-2.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 flex items-center gap-2 text-neutral-800 transition-colors focus:ring-2 focus:ring-neutral-900 focus:outline-none"
      >
        <Building2 className="w-3.5 h-3.5 text-neutral-500" strokeWidth={1.5} />
        <span className="font-semibold text-neutral-900 max-w-[110px] truncate">
          {activeTenant.name}
        </span>
        <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-neutral-100 text-neutral-600 font-medium hidden sm:inline-block">
          {activeTenant.tier}
        </span>
        <ChevronDown className="w-3 h-3 text-neutral-400" strokeWidth={1.5} />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 mt-1.5 w-60 rounded-lg border border-neutral-200 bg-white shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3 py-2 border-b border-neutral-100 text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
            Enterprise Organizations
          </div>
          <div className="p-1 space-y-0.5">
            {TENANTS.map((t) => {
              const isSelected = t.id === activeTenant.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTenant(t)}
                  role="option"
                  aria-selected={isSelected}
                  className={`w-full px-2.5 py-2 rounded-md text-left flex items-center justify-between text-xs transition-colors ${
                    isSelected ? "bg-neutral-100 font-semibold text-neutral-900" : "hover:bg-neutral-50 text-neutral-700"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-neutral-900">{t.name}</span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      {t.tier} • {t.region}
                    </span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-neutral-900" strokeWidth={2} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
