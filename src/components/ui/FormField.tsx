"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  htmlFor,
  required = false,
  helperText,
  error,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-1.5 text-left font-sans">
      <div className="flex items-center justify-between">
        <label
          htmlFor={htmlFor}
          className="text-xs font-semibold text-neutral-900 flex items-center gap-1"
        >
          <span>{label}</span>
          {required && (
            <span className="text-rose-600 font-bold" title="Mandatory field">
              *
            </span>
          )}
        </label>
      </div>

      {children}

      {error ? (
        <p className="text-xs text-rose-700 font-medium flex items-center gap-1.5 mt-1 animate-in fade-in duration-150">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" strokeWidth={1.5} />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-neutral-500 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
}
