"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/auth/UserContext";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Bot,
  Layers,
  Code2,
  Send,
  Eye,
  CheckCircle2,
  Globe,
   
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { GithubIcon } from "@/components/ui/Icons";
import confetti from "canvas-confetti";

export default function NewProjectPage() {
  const router = useRouter();
  const { currentUser } = useUser();
  const [step, setStep] = useState(1);

  // Step 1: Basic
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");

  // Step 2: Build
  const [techStackInput, setTechStackInput] = useState("Next.js, TypeScript, Tailwind CSS");
  const [framework, setFramework] = useState("Next.js App Router");
  const [database, setDatabase] = useState("PostgreSQL");
  const [hosting, setHosting] = useState("Vercel");
  const [selectedAITools, setSelectedAITools] = useState<string[]>(["Cursor", "Claude Code"]);
  const [aiInvolvement, setAiInvolvement] = useState<string>("HEAVY");

  // Step 3: Write-up
  const [whatBuilt, setWhatBuilt] = useState("");
  const [whyBuilt, setWhyBuilt] = useState("");
  const [problemSolved, setProblemSolved] = useState("");
  const [difficultParts, setDifficultParts] = useState("");
  const [unsureParts, setUnsureParts] = useState("");
  const [feedbackWanted, setFeedbackWanted] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanStep, setScanStep] = useState<string>("");

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, "-")) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 32));
    }
  };

  const aiToolOptions = [
    "Cursor",
    "Claude Code",
    "ChatGPT",
    "GitHub Copilot",
    "Lovable",
    "Bolt",
    "Replit",
    "v0",
    "Windsurf",
    "Other",
  ];

  const toggleAITool = (tool: string) => {
    if (selectedAITools.includes(tool)) {
      setSelectedAITools(selectedAITools.filter((t) => t !== tool));
    } else {
      setSelectedAITools([...selectedAITools, tool]);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      toast.error("Please select a test persona or sign in.");
      return;
    }
    if (!title || !liveUrl) {
      toast.error("Please provide at least a project title and live URL.");
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    setScanStep("Resolving domain & verifying SSRF safety...");

    try {
      await new Promise((r) => setTimeout(r, 600));
      setScanStep("Running automated security, a11y & performance analyzers...");

      const techStack = techStackInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          tagline,
          description,
          liveUrl,
          githubUrl: githubUrl || null,
          aiInvolvement,
          aiTools: selectedAITools,
          techStack,
          framework,
          database,
          hosting,
          whatBuilt,
          whyBuilt,
          problemSolved,
          difficultParts,
          unsureParts,
          feedbackWanted,
          userId: currentUser.id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        toast.success("Project published & automated analysis complete!");
        router.push(`/projects/${data.project.slug}`);
      } else {
        toast.error(data.error || "Failed to publish project.");
        setIsSubmitting(false);
      }
    } catch {
      toast.error("Submission failed due to network error.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Wizard Header */}
      <div className="text-center space-y-2">
        <div className="text-xs font-mono text-emerald-400 font-semibold uppercase tracking-wider">
          New Submission
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Submit Your Project for Vibe Check
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500">
          Get automated security & performance analysis and structured community feedback.
        </p>
      </div>

      {/* Steps Progression Bar */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        {[
          { num: 1, label: "Basic Info" },
          { num: 2, label: "Build & AI" },
          { num: 3, label: "Write-up" },
          { num: 4, label: "Preview" },
        ].map((s) => {
          const isDone = step > s.num;
          const isCurrent = step === s.num;
          return (
            <div
              key={s.num}
              onClick={() => !isSubmitting && s.num < step && setStep(s.num)}
              className={`p-2.5 rounded-lg border transition-all ${
                isCurrent
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300 font-bold"
                  : isDone
                  ? "border-slate-200 bg-slate-900/60 text-slate-300 cursor-pointer"
                  : "border-slate-100 bg-slate-50 text-slate-600"
              }`}
            >
              <div className="text-[10px] font-mono">Step {s.num}</div>
              <div className="truncate">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Form Card */}
      <div className="rounded-2xl border border-slate-200 bg-slate-900/50 p-6 sm:p-8 space-y-6">
        {/* STEP 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-150 text-xs">
            <div className="space-y-1">
              <label className="block text-zinc-300 font-medium text-xs">Project Name *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. CampusConnect"
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.2] transition-colors text-sm"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-zinc-300 font-medium text-xs">Custom Slug</label>
              <div className="flex items-center bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-zinc-500">
                <span>vibecheck.dev/projects/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="bg-transparent text-emerald-400 focus:outline-none flex-1 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-zinc-300 font-medium text-xs">Tagline *</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="One sentence that summarizes the core value."
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.2] transition-colors"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-zinc-300 font-medium text-xs">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Brief summary of who it is for and what it accomplishes."
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.2] transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-zinc-300 font-medium text-xs flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  Live Web URL *
                </label>
                <input
                  type="url"
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  placeholder="https://myproject.vercel.app"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.2] transition-colors"
                  required
                />
                <span className="text-[10px] text-slate-500">Must be public & reachable for automated analysis</span>
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-300 font-medium text-xs flex items-center gap-1.5">
                  <GithubIcon className="w-3.5 h-3.5 text-zinc-500" />
                  GitHub Repository URL (Optional)
                </label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/user/project"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.2] transition-colors"
                />
                <span className="text-[10px] text-slate-500">Enables dependency & static hygiene checks</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Build & AI Tools */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-150 text-xs">
            <div className="space-y-1">
              <label className="block text-zinc-300 font-medium text-xs">Tech Stack (comma separated)</label>
              <input
                type="text"
                value={techStackInput}
                onChange={(e) => setTechStackInput(e.target.value)}
                placeholder="Next.js, TypeScript, Tailwind CSS, Prisma, PostgreSQL"
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.2] transition-colors font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-zinc-500 font-medium mb-1">Framework</label>
                <input
                  type="text"
                  value={framework}
                  onChange={(e) => setFramework(e.target.value)}
                  placeholder="Next.js 14"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-zinc-500 font-medium mb-1">Database</label>
                <input
                  type="text"
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  placeholder="PostgreSQL / Supabase"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-zinc-500 font-medium mb-1">Hosting</label>
                <input
                  type="text"
                  value={hosting}
                  onChange={(e) => setHosting(e.target.value)}
                  placeholder="Vercel / Cloudflare"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg p-2 text-slate-200"
                />
              </div>
            </div>

            {/* AI Tools Used */}
            <div className="space-y-2">
              <label className="block text-zinc-300 font-medium text-xs flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-purple-400" />
                AI Tools Used
              </label>
              <div className="flex flex-wrap gap-2">
                {aiToolOptions.map((tool) => {
                  const isSel = selectedAITools.includes(tool);
                  return (
                    <button
                      key={tool}
                      type="button"
                      onClick={() => toggleAITool(tool)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                        isSel
                          ? "border-purple-500/50 bg-purple-500/15 text-purple-300 font-semibold"
                          : "border-slate-200 bg-slate-50 text-zinc-500 hover:text-slate-200"
                      }`}
                    >
                      {tool}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Involvement Level */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-zinc-300 font-medium text-xs">
                How heavily did you use AI?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: "MINIMAL", title: "Minimal", desc: "Autocomplete or quick syntax lookups" },
                  { id: "MODERATE", title: "Moderate", desc: "Generated boilerplate and isolated functions" },
                  { id: "HEAVY", title: "Heavy", desc: "Scaffolded major components & API routes" },
                  { id: "ALMOST_ENTIRELY", title: "Almost entirely AI-assisted", desc: "Prompt-driven from zero to functional app" },
                ].map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => setAiInvolvement(inv.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      aiInvolvement === inv.id
                        ? "border-emerald-500 bg-emerald-950/20 text-emerald-300 ring-1 ring-emerald-500"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-900 text-zinc-500"
                    }`}
                  >
                    <div className="font-semibold text-slate-200">{inv.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{inv.desc}</div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 italic pt-1">
                This is transparent disclosure, not a penalty. We evaluate the resulting product quality.
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: Write-up Story */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-150 text-xs">
            <div>
              <label className="block text-zinc-300 font-medium text-xs mb-1">What did you build? *</label>
              <textarea
                value={whatBuilt}
                onChange={(e) => setWhatBuilt(e.target.value)}
                placeholder="Describe your project's main feature set and architecture..."
                rows={3}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg p-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium text-xs mb-1">Why did you build it? *</label>
              <textarea
                value={whyBuilt}
                onChange={(e) => setWhyBuilt(e.target.value)}
                placeholder="What personal frustration or market gap inspired this build?"
                rows={2}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg p-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium text-xs mb-1">What problem does it solve?</label>
              <textarea
                value={problemSolved}
                onChange={(e) => setProblemSolved(e.target.value)}
                placeholder="How does this improve the user's workflow or save time?"
                rows={2}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg p-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">What was difficult?</label>
                <textarea
                  value={difficultParts}
                  onChange={(e) => setDifficultParts(e.target.value)}
                  placeholder="Handling race conditions, CSS layouts..."
                  rows={2}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg p-2 text-white placeholder-slate-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">What are you unsure about?</label>
                <textarea
                  value={unsureParts}
                  onChange={(e) => setUnsureParts(e.target.value)}
                  placeholder="Auth verification, database query performance..."
                  rows={2}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg p-2 text-white placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium text-xs mb-1">
                What kind of feedback do you want most?
              </label>
              <input
                type="text"
                value={feedbackWanted}
                onChange={(e) => setFeedbackWanted(e.target.value)}
                placeholder="e.g. Stress-test trade checkout, check accessibility for screen readers..."
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.2] transition-colors"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Preview & Publish */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-150 text-xs">
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/10 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Sparkles className="w-4 h-4" /> Ready to Publish
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                Publishing will trigger VibeCheck's automated analysis engine to audit your security headers, accessibility landmarks, and response latency.
              </p>
            </div>

            {/* Live Card Preview */}
            <div className="rounded-xl border border-white/15 bg-slate-50 p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{title || "Untitled Project"}</h2>
                  <p className="text-zinc-500 text-xs mt-1">{tagline || "Your project tagline here."}</p>
                </div>
                <div className="px-3 py-1 rounded bg-slate-900 border border-slate-200 text-zinc-500 font-mono text-xs font-bold">
                  Score Pending Scan
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-slate-300 text-[11px]">
                <span className="font-mono text-emerald-400">URL: {liveUrl || "Not specified"}</span>
                {githubUrl && <span className="font-mono text-zinc-500">GitHub: {githubUrl}</span>}
              </div>

              <div className="flex flex-wrap gap-1">
                {techStackInput.split(",").map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-100 text-zinc-500 font-mono">
                    {t.trim()}
                  </span>
                ))}
              </div>

              {whatBuilt && (
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <span className="font-semibold text-zinc-500 text-[10px] uppercase tracking-wider block">
                    What was built:
                  </span>
                  <p className="text-slate-300 line-clamp-3 leading-relaxed">{whatBuilt}</p>
                </div>
              )}
            </div>

            {isSubmitting && (
              <div className="p-4 rounded-xl border border-emerald-500/40 bg-slate-50 text-center space-y-2 animate-pulse">
                <Zap className="w-6 h-6 text-emerald-400 mx-auto animate-bounce" />
                <div className="text-sm font-bold text-emerald-300">Analyzing your project...</div>
                <div className="text-xs text-zinc-500 font-mono">{scanStep}</div>
              </div>
            )}
          </div>
        )}

        {/* Wizard Footer Navigation */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-300 hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && (!title || !liveUrl)) {
                  toast.error("Title and Live URL are required.");
                  return;
                }
                setStep(step + 1);
              }}
              className="px-5 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-medium shadow-[0_0_15px_rgba(255,255,255,0.1)] text-xs transition-colors flex items-center gap-1.5"
            >
              Next Step <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Publishing & Scanning..." : "Publish Project"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
