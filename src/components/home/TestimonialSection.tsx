import React from "react";
import { Star, ShieldCheck, Quote } from "lucide-react";

export function TestimonialSection() {
  const testimonials = [
    {
      quote:
        "VibeCheck's automated scan caught an unauthenticated API route with an exposed Supabase key 15 minutes before our Product Hunt launch. That scan alone saved our startup.",
      author: "Alex Rivera",
      role: "Creator of CampusConnect",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      vibeScore: 86,
    },
    {
      quote:
        "Instead of polite 'looks great!' tweets, we got 4 senior developers pointing out missing mobile keyboard handling and accessibility flaws. Our score went from 68 to 84 in one week.",
      author: "Jordan Taylor",
      role: "Founder of FlowState",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      vibeScore: 84,
    },
    {
      quote:
        "We ordered a Verified Staff Audit for ₹999. The reviewer sent us line-by-line PostgreSQL indexing recommendations that dropped our query latency by 80%. Exceptional ROI.",
      author: "Aisha Patel",
      role: "CTO @ ResumeForge AI",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
      vibeScore: 78,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-center">
      <div className="space-y-2">
        <div className="text-xs font-mono uppercase tracking-wider text-indigo-600 font-semibold">
          Customer Proof
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Trusted by engineers shipping with AI.
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
          Over 4,200 projects audited, 18,000+ vulnerabilities patched, and zero blind deployments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        {testimonials.map((t, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-[10px] font-bold">
                  Score: {t.vibeScore}/100
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                "{t.quote}"
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <img
                src={t.avatar}
                alt={t.author}
                className="w-9 h-9 rounded-full object-cover border border-slate-200"
              />
              <div>
                <div className="text-xs font-bold text-slate-900">{t.author}</div>
                <div className="text-[11px] text-slate-500">{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
