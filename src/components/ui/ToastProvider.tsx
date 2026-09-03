"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      theme="dark"
      toastOptions={{
        style: {
          background: "#020617",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          color: "#f8fafc",
          borderRadius: "0.5rem",
          fontSize: "0.8125rem",
        },
      }}
    />
  );
}
