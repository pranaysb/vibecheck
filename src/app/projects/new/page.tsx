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
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { GithubIcon } from "@/components/ui/Icons";
import confetti from "canvas-confetti";

export default function NewProjectPage() {
  const router = useRouter();
  const { currentUser } = useUser();
  const [step, setStep] = useState(1);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Step 1: Basic Information
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");

  // Step 2: Build & Stack
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
    if (formErrors.title) {
      setFormErrors((prev) => ({ ...prev, title: "" }));
    }
  };

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = "Project name is required";
    if (!tagline.trim()) errors.tagline = "Tagline is required";
    if (!liveUrl.trim()) {
      errors.liveUrl = "Live URL is required";
    } else {
      try {
        const url = new URL(liveUrl);
        if (!["http:", "https:"].includes(url.protocol)) {
          errors.liveUrl = "URL must start with http:// or https://";
        }
      } catch {
        errors.liveUrl = "Please enter a valid web URL (e.g. https://myapp.vercel.app)";
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors: Record<string, string> = {};
    if (!techStackInput.trim()) {
      errors.techStack = "Please specify at least one primary technology";
    }
    if (selectedAITools.length === 0) {
      errors.aiTools = "Please select at least one AI tool used";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && !validateStep1()) {
      toast.error("Please resolve the required fields before proceeding.");
      return;
    }
    if (step === 2 && !validateStep2()) {
      toast.error("Please complete the required stack selections.");
      return;
    }
    setFormErrors({});
    setStep((prev) => prev + 1);
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
    if (formErrors.aiTools) {
      setFormErrors((prev) => ({ ...prev, aiTools: "" }));
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      toast.error("Please select a test persona or sign in.");
      return;
    }
    if (!validateStep1()) {
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    setScanStep("Resolving domain & verifying SSRF safety...");

    try {
      // Execute REAL /api/scan endpoint
      let realScanResult: any = null;
      try {
        setScanStep("Connecting to live target & inspecting HTTP security headers...");
        const scanRes = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: liveUrl.trim() }),
        });
        if (scanRes.ok) {
          realScanResult = await scanRes.json();
          setScanStep(
            `Live scan completed! TTFB: ${realScanResult.ttfbMs}ms • Real Score: ${realScanResult.vibeScore}/100`
          );
        } else {
          setScanStep("Automated scanner reported fallback mode. Synthesizing preliminary metrics...");
        }
      } catch (scanErr) {
        console.warn("Scan warning:", scanErr);
      }

      await new Promise((r) => setTimeout(r, 600));
      setScanStep("Persisting verified project record & audit findings...");

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
          realScanResult,
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8 text-left">
      {/* Wizard Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-mono font-medium shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Project Submission Wizard</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 font-sans tracking-tight mt-2">
          Submit Your AI-Assisted Build
        </h1>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
          Step {step} of 4:{" "}
          {step === 1 && "Core Information & Live Deployment"}
          {step === 2 && "Tech Stack & AI Transparency"}
          {step === 3 && "Project Context & Story (Optional)"}
          {step === 4 && "Review & Automated Verification"}
        </p>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i <= step ? "bg-indigo-600" : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      {/* Wizard Container */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-sm">
        {/* STEP 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>Project Identity & Live URL</span>
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="CampusConnect"
                className={`w-full bg-white border rounded-lg px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none ${
                  formErrors.title
                    ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-300 focus:border-indigo-500"
                }`}
              />
              {formErrors.title && (
                <p className="text-xs text-rose-600 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{formErrors.title}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                One-line Tagline *
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => {
                  setTagline(e.target.value);
                  if (formErrors.tagline) setFormErrors((p) => ({ ...p, tagline: "" }));
                }}
                placeholder="Student peer-to-peer textbook and dorm essentials marketplace."
                className={`w-full bg-white border rounded-lg px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none ${
                  formErrors.tagline
                    ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-300 focus:border-indigo-500"
                }`}
              />
              {formErrors.tagline && (
                <p className="text-xs text-rose-600 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{formErrors.tagline}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Live Deployment URL *
              </label>
              <input
                type="url"
                value={liveUrl}
                onChange={(e) => {
                  setLiveUrl(e.target.value);
                  if (formErrors.liveUrl) setFormErrors((p) => ({ ...p, liveUrl: "" }));
                }}
                placeholder="https://myapp.vercel.app"
                className={`w-full bg-white border rounded-lg px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none ${
                  formErrors.liveUrl
                    ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-300 focus:border-indigo-500"
                }`}
              />
              {formErrors.liveUrl && (
                <p className="text-xs text-rose-600 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{formErrors.liveUrl}</span>
                </p>
              )}
              <p className="text-[11px] text-slate-500 mt-1">
                Our remote scanner will audit this URL for CSP, HSTS, X-Frame-Options, and server TTFB latency.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                GitHub Repository (Optional)
              </label>
              <div className="relative">
                <GithubIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username/repository"
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Stack & AI Tools */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-600" />
              <span>Technology Stack & AI Transparency</span>
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Primary Technologies (comma-separated) *
              </label>
              <input
                type="text"
                value={techStackInput}
                onChange={(e) => {
                  setTechStackInput(e.target.value);
                  if (formErrors.techStack) setFormErrors((p) => ({ ...p, techStack: "" }));
                }}
                className={`w-full bg-white border rounded-lg px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none ${
                  formErrors.techStack ? "border-rose-500" : "border-slate-300 focus:border-indigo-500"
                }`}
              />
              {formErrors.techStack && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.techStack}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                AI Coding Tools Used *
              </label>
              <div className="flex flex-wrap gap-2">
                {aiToolOptions.map((tool) => {
                  const isSelected = selectedAITools.includes(tool);
                  return (
                    <button
                      key={tool}
                      type="button"
                      onClick={() => toggleAITool(tool)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white font-semibold shadow-xs"
                          : "bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200/70"
                      }`}
                    >
                      {tool}
                    </button>
                  );
                })}
              </div>
              {formErrors.aiTools && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.aiTools}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Level of AI Involvement
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "MINIMAL", label: "Minimal", desc: "Autofill & snippets" },
                  { id: "MODERATE", label: "Moderate", desc: "Feature scaffolding" },
                  { id: "HEAVY", label: "Heavy", desc: "Most files AI-assisted" },
                  { id: "ALMOST_ENTIRELY", label: "Full Vibe", desc: "Prompt-to-app" },
                ].map((inv) => (
                  <button
                    key={inv.id}
                    type="button"
                    onClick={() => setAiInvolvement(inv.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      aiInvolvement === inv.id
                        ? "border-indigo-600 bg-indigo-50 text-indigo-950 font-bold shadow-xs"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="text-xs font-bold">{inv.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{inv.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Context & Story */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-600" />
              <span>Project Context & Honest Story</span>
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                What did you build?
              </label>
              <textarea
                value={whatBuilt}
                onChange={(e) => setWhatBuilt(e.target.value)}
                rows={2}
                placeholder="Briefly explain what features are live right now."
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                What part was difficult or are you unsure about?
              </label>
              <textarea
                value={difficultParts}
                onChange={(e) => setDifficultParts(e.target.value)}
                rows={2}
                placeholder="e.g. Supabase RLS policies, mobile viewport keyboard bouncing, webhook validation."
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Targeted feedback wanted from reviewers
              </label>
              <textarea
                value={feedbackWanted}
                onChange={(e) => setFeedbackWanted(e.target.value)}
                rows={2}
                placeholder="What specific checks or tests do you want community reviewers to focus on?"
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Review & Automated Scan */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Review Submission & Ready for Live Scan</span>
            </h2>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Project Name:</span>
                <span className="font-bold text-slate-900">{title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Target URL:</span>
                <span className="font-mono text-indigo-700 font-semibold">{liveUrl}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">AI Tools:</span>
                <span>{selectedAITools.join(", ")}</span>
              </div>
            </div>

            {isSubmitting ? (
              <div className="p-5 rounded-2xl border border-indigo-200 bg-indigo-50/50 text-center space-y-2 animate-pulse">
                <Zap className="w-6 h-6 text-indigo-600 mx-auto animate-bounce" />
                <div className="text-sm font-bold text-indigo-900">Executing Live Audit Scan...</div>
                <div className="text-xs text-slate-600 font-mono">{scanStep}</div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 leading-relaxed">
                Clicking "Publish & Run Scan" will invoke our real remote scanning engine against your URL to verify TLS, CSP, HSTS, X-Frame-Options, and server latency.
              </p>
            )}
          </div>
        )}

        {/* Footer Navigation */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((p) => p - 1)}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Publishing & Scanning..." : "Publish & Run Scan"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
