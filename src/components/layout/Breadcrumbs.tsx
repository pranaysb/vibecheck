"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumbs() {
  const pathname = usePathname();
  if (pathname === "/" || !pathname) return null;

  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono py-2">
      <Link href="/" className="hover:text-neutral-900 flex items-center gap-1 transition-colors" title="Home">
        <Home className="w-3 h-3 text-neutral-400" strokeWidth={1.5} />
      </Link>

      {segments.map((seg, idx) => {
        const href = "/" + segments.slice(0, idx + 1).join("/");
        const isLast = idx === segments.length - 1;
        const formatted = seg.replace(/-/g, " ");

        return (
          <React.Fragment key={href}>
            <ChevronRight className="w-3 h-3 text-neutral-300" strokeWidth={1.5} />
            {isLast ? (
              <span className="font-semibold text-neutral-900 capitalize truncate max-w-[160px]">
                {formatted}
              </span>
            ) : (
              <Link href={href} className="hover:text-neutral-900 capitalize transition-colors">
                {formatted}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
