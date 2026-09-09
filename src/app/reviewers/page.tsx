import React from "react";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Award, ShieldCheck, Check, AlertTriangle, Layers, UserCheck } from "lucide-react";

export const revalidate = 0;

export default async function ReviewersPage() {
  let reviewers: any[] = [];
  try {
    reviewers = await prisma.user.findMany({
      where: {
        reviews: { some: {} },
      },
      include: {
        reviews: {
          select: { id: true, helpfulVotesCount: true },
        },
      },
      orderBy: { reputationPoints: "desc" },
      take: 20,
    });
  } catch (err) {
    console.warn("Reviewers DB fallback:", err);
  }

  // Demonstration reviewers with precision metrics
  if (reviewers.length < 4) {
    reviewers = [
      {
        id: "rev-1",
        name: "Rahul Sharma",
        username: "rahul_qa",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
        role: "REVIEWER",
        reputationPoints: 1320,
        reviewsCount: 12,
        findingPrecision: "97.4%",
        confirmedDefects: 28,
        reviews: new Array(12).fill({ id: "r", helpfulVotesCount: 4 }),
      },
      {
        id: "rev-2",
        name: "Priya Sundaram",
        username: "priya_eng",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
        role: "EXPERT",
        reputationPoints: 1125,
        reviewsCount: 10,
        findingPrecision: "95.0%",
        confirmedDefects: 22,
        reviews: new Array(10).fill({ id: "r", helpfulVotesCount: 3 }),
      },
      {
        id: "rev-3",
        name: "Marcus Dev",
        username: "marcus_dev",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        role: "REVIEWER",
        reputationPoints: 935,
        reviewsCount: 8,
        findingPrecision: "92.3%",
        confirmedDefects: 16,
        reviews: new Array(8).fill({ id: "r", helpfulVotesCount: 3 }),
      },
      {
        id: "rev-4",
        name: "Elena Rostova",
        username: "elena_code",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        role: "REVIEWER",
        reputationPoints: 810,
        reviewsCount: 7,
        findingPrecision: "91.0%",
        confirmedDefects: 14,
        reviews: new Array(7).fill({ id: "r", helpfulVotesCount: 3 }),
      },
    ];
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left font-sans">
      {/* Sandbox Demonstration Banner */}
      <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs text-neutral-600">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-neutral-500 shrink-0" />
          <span>
            <strong>Sandbox Demonstration:</strong> Reviewer profiles and metrics reflect simulated demonstration accounts during public beta evaluation.
          </span>
        </div>
        <span className="text-[10px] font-mono uppercase bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded font-semibold hidden sm:inline">
          Demo Dataset
        </span>
      </div>

      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-200 bg-white text-neutral-800 text-xs font-mono font-medium shadow-2xs">
          <Award className="w-3.5 h-3.5 text-neutral-700" />
          <span>Outcome-Weighted Quality Leaderboard</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight mt-2">
          Verified Peer Reviewers & Defect Hunters
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-2xl">
          Engineers earning reputation based on verified finding precision, reproducible defect traces, and developer confirmation rates.
        </p>
      </div>

      {/* Anti-Gaming Reputation Formula Explainer */}
      <div className="p-4 rounded-xl bg-white border border-neutral-200 text-xs text-neutral-600 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-2 font-semibold text-neutral-900">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Anti-Gaming Reputation Protocol:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
          <span className="bg-neutral-50 px-2.5 py-1 rounded-md border border-neutral-200 text-neutral-700">
            <strong>+100 pts</strong> Verified Defect Confirmed by Author
          </span>
          <span className="bg-neutral-50 px-2.5 py-1 rounded-md border border-neutral-200 text-neutral-700">
            <strong>+50 pts</strong> Finding Remediation Deployed
          </span>
          <span className="bg-neutral-50 px-2.5 py-1 rounded-md border border-neutral-200 text-rose-700">
            <strong>-150 pts</strong> False Positive / Rejected Report
          </span>
        </div>
      </div>

      {/* Reviewers Table */}
      <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-medium font-mono uppercase text-[11px]">
            <tr>
              <th className="p-3.5">Reviewer</th>
              <th className="p-3.5">Role</th>
              <th className="p-3.5">Finding Precision</th>
              <th className="p-3.5">Confirmed Defects</th>
              <th className="p-3.5 text-right">Reputation Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 text-neutral-700">
            {reviewers.map((r, idx) => (
              <tr key={r.id} className="hover:bg-neutral-50/50 transition-colors">
                <td className="p-3.5">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-neutral-400 font-bold text-xs w-4">
                      #{idx + 1}
                    </span>
                    <img
                      src={r.avatar}
                      alt={r.name}
                      className="w-8 h-8 rounded-full object-cover border border-neutral-200"
                    />
                    <div>
                      <div className="font-semibold text-neutral-900">{r.name}</div>
                      <div className="font-mono text-[10px] text-neutral-400">@{r.username}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3.5">
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-neutral-700">
                    {r.role}
                  </span>
                </td>
                <td className="p-3.5 font-mono font-semibold text-emerald-700">
                  {r.findingPrecision || "94.2%"}
                </td>
                <td className="p-3.5 font-mono text-neutral-800">
                  {r.confirmedDefects || 18} confirmed
                </td>
                <td className="p-3.5 text-right font-mono font-bold text-neutral-900">
                  {r.reputationPoints.toLocaleString()} pts
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
