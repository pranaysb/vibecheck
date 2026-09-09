import React from "react";
import { prisma } from "@/lib/db";
import { ExpertCard } from "@/components/expert/ExpertCard";
import { ShieldCheck, Layers, Award } from "lucide-react";

export const revalidate = 0;

export default async function ExpertsPage() {
  let experts: any[] = [];
  try {
    experts = await prisma.user.findMany({
      where: {
        role: "EXPERT",
        expertProfile: { isNot: null },
      },
      include: {
        expertProfile: true,
      },
      orderBy: { reputationPoints: "desc" },
    });
  } catch (err) {
    console.warn("Experts DB fallback:", err);
  }

  if (experts.length === 0) {
    experts = [
      {
        id: "exp-sarah",
        name: "Sarah Chen",
        username: "sarahchen",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
        bio: "Senior Security Engineer (Sandbox Profile). Specialized in API authorization matrices, Postgres RLS boundaries, and BOLA detection.",
        expertProfile: {
          title: "Senior Security Engineer (Sandbox Demo)",
          yearsExperience: 8,
          hourlyRateInr: 4500,
          reviewRateInr: 7500,
          rating: 4.9,
          reviewsCount: 19,
          specialties: ["API Authorization", "Postgres RLS", "BOLA Testing", "OAuth2 Flow"],
          verificationStatus: "VERIFIED"
        }
      },
      {
        id: "exp-david",
        name: "David Vance",
        username: "davidvance",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        bio: "Principal Infrastructure Architect (Sandbox Profile). Specialized in Edge security sandboxing, anti-SSRF defenses, and network boundary controls.",
        expertProfile: {
          title: "Principal Architect (Sandbox Demo)",
          yearsExperience: 11,
          hourlyRateInr: 6500,
          reviewRateInr: 9500,
          rating: 5.0,
          reviewsCount: 14,
          specialties: ["Edge Runtime", "SSRF Rebinding Guard", "Worker Isolation", "VPC Security"],
          verificationStatus: "VERIFIED"
        }
      },
      {
        id: "exp-priya",
        name: "Priya Sundaram",
        username: "priya_eng",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
        bio: "Staff Frontend Architect (Sandbox Profile). Passionate about WCAG 2.1 AA automated audits, keyboard focus traps, and design token rigor.",
        expertProfile: {
          title: "Staff Frontend Architect (Sandbox Demo)",
          yearsExperience: 7,
          hourlyRateInr: 3500,
          reviewRateInr: 7500,
          rating: 4.9,
          reviewsCount: 16,
          specialties: ["WCAG 2.1 AA", "Keyboard Traps", "React 19 Security", "Design System"],
          verificationStatus: "VERIFIED"
        }
      }
    ];
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left font-sans">
      {/* Sandbox Demonstration Banner */}
      <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs text-neutral-600">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-neutral-500 shrink-0" />
          <span>
            <strong>Sandbox Demonstration:</strong> The expert reviewer profiles below are simulated accounts illustrating human-in-the-loop security attestation workflows.
          </span>
        </div>
        <span className="text-[10px] font-mono uppercase bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded font-semibold hidden sm:inline">
          Demo Dataset
        </span>
      </div>

      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-200 bg-white text-neutral-800 text-xs font-mono font-medium shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>Human-in-the-Loop Security Verification</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight mt-2">
          Verified Staff Security Engineers
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-2xl">
          Commission deep manual inspection for authorization flaws, BOLA/IDOR vulnerabilities, and multi-tenant RLS policies with cryptographically signed reports.
        </p>
      </div>

      {/* Expert Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {experts.map((expert) => (
          <ExpertCard key={expert.id} expert={expert} />
        ))}
      </div>
    </div>
  );
}
