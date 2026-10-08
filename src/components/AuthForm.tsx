"use client";

import { useFormAction } from "@/components/use-form-action";
import Link from "next/link";
import { signIn, signUp } from "@/app/actions/auth";

export function AuthForm({ mode, next }: { mode: "signin" | "signup"; next: string }) {
  const { state, onSubmit, pending } = useFormAction(mode === "signin" ? signIn : signUp);
  const q = next && next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:py-24">
      <h1 className="text-2xl font-semibold">{mode === "signin" ? "Sign in" : "Create your account"}</h1>
      <p className="mt-1.5 text-sm text-muted">
        {mode === "signin" ? "Welcome back." : "Needed for uploads, repo imports, and expert reviews."}
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <input type="hidden" name="next" value={next} />
        {mode === "signup" && (
          <div>
            <label htmlFor="name" className="label">Name</label>
            <input id="name" name="name" className="field" autoComplete="name" required maxLength={80} />
          </div>
        )}
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" className="field" autoComplete="email" required />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" name="password" type="password" className="field" autoComplete={mode === "signin" ? "current-password" : "new-password"} required minLength={mode === "signup" ? 10 : undefined} aria-describedby={mode === "signup" ? "pw-hint" : undefined} />
          {mode === "signup" && <p id="pw-hint" className="mt-1.5 text-xs text-muted">At least 10 characters.</p>}
        </div>
        {state?.error && <p role="alert" className="text-sm text-fail">{state.error}</p>}
        <button type="submit" className="btn btn-primary w-full h-11" disabled={pending}>
          {pending ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-sm text-muted">
        {mode === "signin" ? (
          <>New here? <Link href={`/signup${q}`} className="text-fg underline underline-offset-4">Create an account</Link></>
        ) : (
          <>Already have an account? <Link href={`/signin${q}`} className="text-fg underline underline-offset-4">Sign in</Link></>
        )}
      </p>
    </div>
  );
}
