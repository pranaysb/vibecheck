"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles, FolderGit2, User, X, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { getScoreColor } from "@/lib/utils";

interface SearchResults {
  projects: Array<{
    id: string;
    slug: string;
    title: string;
    tagline: string;
    vibeScore: number;
    techStack: string[];
    creator: { name: string; username: string };
  }>;
  users: Array<{
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    role: string;
    reputationPoints: number;
  }>;
  experts: Array<{
    id: string;
    title: string;
    specialties: string[];
    user: { id: string; name: string; username: string; avatar: string | null };
  }>;
}

export function CommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ projects: [], users: [], experts: [] });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults({ projects: [], users: [], experts: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ projects: [], users: [], experts: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-xl border border-white/10 bg-slate-950 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center px-4 py-3 border-b border-white/10 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, reviewers, tech stacks, or experts... (ESC to close)"
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto p-2 space-y-4">
          {loading && (
            <div className="p-4 text-center text-xs text-slate-400 animate-pulse">
              Searching VibeCheck index...
            </div>
          )}

          {!loading && !query && (
            <div className="p-4 space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Quick Navigation</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Link
                  href="/discover"
                  onClick={onClose}
                  className="p-2 rounded-lg bg-slate-900/50 hover:bg-slate-900 border border-white/5 flex items-center justify-between text-slate-300 hover:text-emerald-400 transition-colors"
                >
                  <span>Explore Discover Feed</span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                </Link>
                <Link
                  href="/experts"
                  onClick={onClose}
                  className="p-2 rounded-lg bg-slate-900/50 hover:bg-slate-900 border border-white/5 flex items-center justify-between text-slate-300 hover:text-cyan-400 transition-colors"
                >
                  <span>Expert Marketplace</span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                </Link>
                <Link
                  href="/challenges"
                  onClick={onClose}
                  className="p-2 rounded-lg bg-slate-900/50 hover:bg-slate-900 border border-white/5 flex items-center justify-between text-slate-300 hover:text-amber-400 transition-colors"
                >
                  <span>Active Challenges</span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                </Link>
                <Link
                  href="/projects/new"
                  onClick={onClose}
                  className="p-2 rounded-lg bg-slate-900/50 hover:bg-slate-900 border border-white/5 flex items-center justify-between text-slate-300 hover:text-purple-400 transition-colors"
                >
                  <span>Submit New Project</span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                </Link>
              </div>
            </div>
          )}

          {results.projects.length > 0 && (
            <div>
              <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5 text-emerald-400" /> Projects
              </div>
              <div className="space-y-1">
                {results.projects.map((proj) => {
                  const sc = getScoreColor(proj.vibeScore);
                  return (
                    <Link
                      key={proj.id}
                      href={`/projects/${proj.slug}`}
                      onClick={onClose}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900 transition-colors group"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                          {proj.title}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{proj.tagline}</div>
                        <div className="flex gap-1 mt-1">
                          {proj.techStack.slice(0, 3).map((t) => (
                            <span key={t} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-white/5 text-slate-400 font-mono">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-mono font-bold border ${sc.badge}`}>
                        {proj.vibeScore}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {results.experts.length > 0 && (
            <div>
              <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Verified Experts
              </div>
              <div className="space-y-1">
                {results.experts.map((exp) => (
                  <Link
                    key={exp.id}
                    href={`/experts`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={exp.user.avatar || "/placeholder-avatar.png"} alt={exp.user.name} className="w-7 h-7 rounded-full object-cover border border-white/10" />
                      <div>
                        <div className="text-xs font-medium text-slate-200">{exp.user.name}</div>
                        <div className="text-[11px] text-slate-400">{exp.title}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded bg-cyan-500/10">
                      Expert
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.users.length > 0 && (
            <div>
              <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" /> Creators & Reviewers
              </div>
              <div className="space-y-1">
                {results.users.map((u) => (
                  <Link
                    key={u.id}
                    href={`/users/${u.username}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={u.avatar || "/placeholder-avatar.png"} alt={u.name} className="w-7 h-7 rounded-full object-cover border border-white/10" />
                      <div>
                        <div className="text-xs font-medium text-slate-200">{u.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">@{u.username}</div>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {u.reputationPoints} pts
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {query && !loading && results.projects.length === 0 && results.experts.length === 0 && results.users.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500">
              No matching projects, reviewers, or experts found for "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
