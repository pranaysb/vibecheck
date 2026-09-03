import React from "react";
import { Check, X, Minus } from "lucide-react";

export function ComparisonTable() {
  const rows = [
    {
      feature: "Turnaround Time",
      traditional: "2 to 4 weeks",
      social: "Unpredictable / Ignored",
      vibecheck: "Instant AI + 48h Human Audit",
    },
    {
      feature: "Cost per Evaluation",
      traditional: "$3,500 – $10,000+",
      social: "Free (Zero structure)",
      vibecheck: "₹0 Free / ₹999 Expert Review",
    },
    {
      feature: "AI-Specific Vulnerability Scans",
      traditional: false,
      social: false,
      vibecheck: true,
    },
    {
      feature: "Automated Security & a11y Auditing",
      traditional: true,
      social: false,
      vibecheck: true,
    },
    {
      feature: "Structured 1-10 Rubric & Diffs",
      traditional: "Dense 60-page PDF",
      social: "Vague 'looks cool' comments",
      vibecheck: "Actionable Category Diffs",
    },
    {
      feature: "Verifiable Public Quality Badge",
      traditional: false,
      social: false,
      vibecheck: true,
    },
    {
      feature: "Historical Version Evolution (v1 → v2)",
      traditional: false,
      social: false,
      vibecheck: true,
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden text-left">
      <div className="p-6 sm:p-8 bg-slate-50 border-b border-slate-200">
        <div className="text-xs font-mono uppercase tracking-wider text-indigo-600 font-semibold">
          Why VibeCheck?
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
          Stop relying on blind faith or expensive consultants.
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          How VibeCheck compares to the existing ways developers review and audit software.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th className="p-4 font-semibold text-slate-700 w-2/5">Capability</th>
              <th className="p-4 font-semibold text-slate-500 w-1/5">Traditional Firm</th>
              <th className="p-4 font-semibold text-slate-500 w-1/5">Reddit / X Post</th>
              <th className="p-4 font-bold text-indigo-900 bg-indigo-50/50 w-1/5">VibeCheck</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                <td className="p-4 font-medium text-slate-800">{row.feature}</td>
                
                {/* Traditional */}
                <td className="p-4 text-slate-500">
                  {typeof row.traditional === "boolean" ? (
                    row.traditional ? (
                      <Check className="w-4 h-4 text-slate-400" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300" />
                    )
                  ) : (
                    <span>{row.traditional}</span>
                  )}
                </td>

                {/* Social */}
                <td className="p-4 text-slate-500">
                  {typeof row.social === "boolean" ? (
                    row.social ? (
                      <Check className="w-4 h-4 text-slate-400" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300" />
                    )
                  ) : (
                    <span>{row.social}</span>
                  )}
                </td>

                {/* VibeCheck */}
                <td className="p-4 font-semibold text-indigo-700 bg-indigo-50/30">
                  {typeof row.vibecheck === "boolean" ? (
                    row.vibecheck ? (
                      <div className="flex items-center gap-1.5 text-emerald-600">
                        <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                        <span>Included</span>
                      </div>
                    ) : (
                      <Minus className="w-4 h-4 text-slate-400" />
                    )
                  ) : (
                    <span className="text-indigo-950 font-bold">{row.vibecheck}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
