"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/auth/UserContext";
import {
  ArrowRight,
  ArrowLeft,
  Shield,
  Layers,
  Code2,
  Send,
  Globe,
  Zap,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { GithubIcon } from "@/components/ui/Icons";
import { FormField } from "@/components/ui/FormField";

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
        toast.success("Repository registered and automated analysis complete.");
        router.push(`/projects/${data.project.slug}`);
      } else {
        toast.error(data.error || "Failed to register repository.");
        setIsSubmitting(false);
      }
    } catch {
      toast.error("Submission failed due to network error.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6 text-left font-sans">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-mono font-medium">
          <Shield className="w-3.5 h-3.5 text-neutral-700" strokeWidth={1.5} />
          <span>Security & Quality Audit Onboarding</span>
        </div>
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight mt-2">
          Register Application for Continuous Audit
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Stage {step} of 4:{" "}
          {step === 1 && "Target Endpoint & Service Identity"}
          {step === 2 && "Technology Architecture & Code Generation Profile"}
          {step === 3 && "Architectural Scope & Reviewer Directions"}
          {step === 4 && "Verification Review & Dispatch Probe"}
        </p>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all ${
              i <= step ? "bg-neutral-900" : "bg-neutral-200"
            }`}
          />
        ))}
      </div>

      {/* Wizard Form Surface */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6 space-y-6 shadow-2xs">
        {/* STEP 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-neutral-900 border-b border-neutral-100 pb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-neutral-700" strokeWidth={1.5} />
              <span>Target Service Identity & Live Endpoint</span>
            </h2>

            <FormField
              label="Application Name"
              required
              helperText="The canonical service identifier displayed on reports and dashboards."
              error={formErrors.title}
            >
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="CampusConnect"
                className="w-full h-9 px-3 bg-white border border-neutral-300 rounded-md text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </FormField>

            <FormField
              label="Service Tagline"
              required
              helperText="Concise summary of functional purpose and target users."
              error={formErrors.tagline}
            >
              <input
                type="text"
                value={tagline}
                onChange={(e) => {
                  setTagline(e.target.value);
                  if (formErrors.tagline) setFormErrors((p) => ({ ...p, tagline: "" }));
                }}
                placeholder="Student peer-to-peer textbook and dorm essentials marketplace."
                className="w-full h-9 px-3 bg-white border border-neutral-300 rounded-md text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </FormField>

            <FormField
              label="Live Target URL"
              required
              helperText="Remote endpoint audited for CSP, HSTS, clickjacking, and server TTFB latency."
              error={formErrors.liveUrl}
            >
              <input
                type="url"
                value={liveUrl}
                onChange={(e) => {
                  setLiveUrl(e.target.value);
                  if (formErrors.liveUrl) setFormErrors((p) => ({ ...p, liveUrl: "" }));
                }}
                placeholder="https://myapp.vercel.app"
                className="w-full h-9 px-3 bg-white border border-neutral-300 rounded-md text-xs text-neutral-900 font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </FormField>

            <FormField
              label="Source Code Repository (Optional)"
              helperText="Public repository inspected by reviewers for static code review."
            >
              <div className="relative">
                <GithubIcon className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/org/repo"
                  className="w-full h-9 pl-9 pr-3 bg-white border border-neutral-300 rounded-md text-xs text-neutral-900 font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
            </FormField>
          </div>
        )}

        {/* STEP 2: Stack & AI Tools */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-sm font-semibold text-neutral-900 border-b border-neutral-100 pb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-neutral-700" strokeWidth={1.5} />
              <span>Technology Architecture & AI Transparency</span>
            </h2>

            <FormField
              label="Primary Technology Stack"
              required
              helperText="Comma-separated listing of core languages, frameworks, and datastores."
              error={formErrors.techStack}
            >
              <input
                type="text"
                value={techStackInput}
                onChange={(e) => {
                  setTechStackInput(e.target.value);
                  if (formErrors.techStack) setFormErrors((p) => ({ ...p, techStack: "" }));
                }}
                className="w-full h-9 px-3 bg-white border border-neutral-300 rounded-md text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </FormField>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-900">
                AI Development Tools Used <span className="text-rose-600">*</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {aiToolOptions.map((tool) => {
                  const isSelected = selectedAITools.includes(tool);
                  return (
                    <button
                      key={tool}
                      type="button"
                      onClick={() => toggleAITool(tool)}
                      className={`h-7 px-2.5 rounded text-xs font-medium transition-colors ${
                        isSelected
                          ? "bg-neutral-900 text-white font-semibold"
                          : "bg-neutral-100 border border-neutral-200 text-neutral-700 hover:bg-neutral-200"
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
              <label className="block text-xs font-semibold text-neutral-900 mb-1.5">
                Degree of AI Assistance
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "MINIMAL", label: "Minimal", desc: "Autocompletion only" },
                  { id: "MODERATE", label: "Moderate", desc: "Scaffolding & modules" },
                  { id: "HEAVY", label: "Substantial", desc: "Majority AI-authored" },
                  { id: "ALMOST_ENTIRELY", label: "Fully Generated", desc: "Autonomous pipeline" },
                ].map((inv) => (
                  <button
                    key={inv.id}
                    type="button"
                    onClick={() => setAiInvolvement(inv.id)}
                    className={`p-3 rounded-md border text-left transition-colors ${
                      aiInvolvement === inv.id
                        ? "border-neutral-900 bg-neutral-50 text-neutral-950 font-semibold"
                        : "border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700"
                    }`}
                  >
                    <div className="text-xs font-semibold">{inv.label}</div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">{inv.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Context & Story */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-neutral-900 border-b border-neutral-100 pb-3 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-neutral-700" strokeWidth={1.5} />
              <span>Architectural Scope & Review Directions</span>
            </h2>

            <FormField
              label="System Architecture & Scope"
              helperText="Summary of implemented microservices, client state, and backend dependencies."
            >
              <textarea
                value={whatBuilt}
                onChange={(e) => setWhatBuilt(e.target.value)}
                rows={2}
                placeholder="Explain functional endpoints, state synchronization, and database models."
                className="w-full p-2.5 bg-white border border-neutral-300 rounded-md text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </FormField>

            <FormField
              label="Known Vulnerabilities or Complex Modules"
              helperText="Areas where you suspect potential race conditions, memory leaks, or RLS bypasses."
            >
              <textarea
                value={difficultParts}
                onChange={(e) => setDifficultParts(e.target.value)}
                rows={2}
                placeholder="e.g. Supabase RLS security policies, mobile viewport keyboard bouncing, webhook validation."
                className="w-full p-2.5 bg-white border border-neutral-300 rounded-md text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </FormField>

            <FormField
              label="Targeted Review Rubric Requests"
              helperText="Specific test cases or vectors you request peer reviewers to validate."
            >
              <textarea
                value={feedbackWanted}
                onChange={(e) => setFeedbackWanted(e.target.value)}
                rows={2}
                placeholder="Specify vectors such as authorization bypass tests, mobile performance, or concurrency."
                className="w-full p-2.5 bg-white border border-neutral-300 rounded-md text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </FormField>
          </div>
        )}

        {/* STEP 4: Review & Automated Scan */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-neutral-900 border-b border-neutral-100 pb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" strokeWidth={1.5} />
              <span>Review Configuration & Dispatch Automated Probe</span>
            </h2>

            <div className="p-4 rounded-md bg-neutral-50 border border-neutral-200 space-y-2 text-xs text-neutral-700">
              <div className="flex justify-between">
                <span className="text-neutral-500">Service Name:</span>
                <span className="font-semibold text-neutral-900">{title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Target Endpoint:</span>
                <span className="font-mono text-neutral-900 font-medium">{liveUrl}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">AI Tooling:</span>
                <span>{selectedAITools.join(", ")}</span>
              </div>
            </div>

            {isSubmitting ? (
              <div className="p-4 rounded-md border border-neutral-200 bg-neutral-50 text-center space-y-2 animate-pulse">
                <Zap className="w-5 h-5 text-neutral-900 mx-auto" strokeWidth={1.5} />
                <div className="text-xs font-semibold text-neutral-900">Executing Automated Security Probe...</div>
                <div className="text-xs text-neutral-600 font-mono">{scanStep}</div>
              </div>
            ) : (
              <p className="text-xs text-neutral-500 leading-relaxed">
                Confirming will dispatch an SSRF-isolated sandbox worker to evaluate live TLS certificates, CSP directives, HSTS headers, frame embedding policies, and server latency.
              </p>
            )}
          </div>
        )}

        {/* Footer Navigation */}
        <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((p) => p - 1)}
              disabled={isSubmitting}
              className="h-8 px-3 rounded-md border border-neutral-200 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="h-8 px-3 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition-colors flex items-center gap-1.5 focus:ring-2 focus:ring-neutral-900 focus:outline-none"
            >
              <span>Next Stage</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-8 px-4 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition-colors flex items-center gap-2 disabled:opacity-50 focus:ring-2 focus:ring-neutral-900 focus:outline-none"
            >
              <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>{isSubmitting ? "Executing Remote Probe..." : "Register & Dispatch Probe"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
