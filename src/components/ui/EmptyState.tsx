import React from "react";
import { LucideIcon, Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="p-8 text-center border border-dashed border-neutral-200 rounded-lg bg-neutral-50/50 space-y-3 font-sans">
      <div className="w-10 h-10 rounded-md bg-white border border-neutral-200 flex items-center justify-center mx-auto text-neutral-600 shadow-2xs">
        <Icon className="w-5 h-5" strokeWidth={1.5} />
      </div>
      <div className="space-y-1 max-w-sm mx-auto">
        <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-tight font-mono">
          {title}
        </h3>
        <p className="text-xs text-neutral-500 leading-relaxed">
          {description}
        </p>
      </div>
      {action && (
        <div className="pt-1">
          <button
            type="button"
            onClick={action.onClick}
            className="h-8 px-3 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-colors inline-flex items-center gap-1.5 focus:ring-2 focus:ring-neutral-900 focus:outline-none"
          >
            <span>{action.label}</span>
          </button>
        </div>
      )}
    </div>
  );
}
