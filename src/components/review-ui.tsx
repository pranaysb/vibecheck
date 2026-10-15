import type { Verdict } from "@prisma/client";

export const VERDICT: Record<Verdict, { label: string; tone: string; blurb: string }> = {
  SHIP: { label: "Ready to ship", tone: "text-pass", blurb: "No blockers. Remaining notes are improvements." },
  FIX_FIRST: { label: "Fix first", tone: "text-warn", blurb: "Shippable after the high-priority findings are addressed." },
  NOT_READY: { label: "Not ready", tone: "text-fail", blurb: "Fundamental problems need work before launch." },
};

export const SEVERITY_TONE = { critical: "text-fail", high: "text-fail", medium: "text-warn", low: "text-muted" } as const;

const STAR = "M8 1.5l1.9 4.1 4.5.5-3.4 3 .9 4.4L8 11.3 4.1 13.5l.9-4.4-3.4-3 4.5-.5z";

export function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5 text-fg" aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        // Filled to the exact fraction (4.5 shows four and a half stars), via a nested svg that clips the fill.
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        const w = 16 * fill;
        return (
          <svg key={i} width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <path d={STAR} fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
            {fill > 0 && (
              <svg x="0" y="0" width={w} height="16" viewBox={`0 0 ${w} 16`}>
                <path d={STAR} fill="currentColor" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
              </svg>
            )}
          </svg>
        );
      })}
    </span>
  );
}
