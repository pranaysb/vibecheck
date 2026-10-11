"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormAction } from "@/components/use-form-action";
import { CodeInput } from "@/components/CodeInput";
import { requestSignInCode, signIn, signInWithCode, signUp } from "@/app/actions/auth";

export function AuthForm({ mode, next }: { mode: "signin" | "signup"; next: string }) {
  const [method, setMethod] = useState<"password" | "code">("password");
  const q = next && next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:py-24">
      <h1 className="text-2xl font-semibold">{mode === "signin" ? "Sign in" : "Create your account"}</h1>
      <p className="mt-1.5 text-sm text-muted">
        {mode === "signin" ? "Welcome back." : "We'll email you a code to confirm the address is yours."}
      </p>

      {mode === "signin" && (
        <div role="tablist" aria-label="Sign-in method" className="mt-8 grid grid-cols-2 gap-1 rounded-xl border border-line p-1">
          {(["password", "code"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={method === m}
              onClick={() => setMethod(m)}
              className={`btn btn-sm ${method === m ? "bg-surface text-fg border border-line" : "btn-ghost border border-transparent"}`}
            >
              {m === "password" ? "Password" : "Email me a code"}
            </button>
          ))}
        </div>
      )}

      {mode === "signin" && method === "code" ? <CodeSignIn next={next} /> : <PasswordForm mode={mode} next={next} />}

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

function PasswordForm({ mode, next }: { mode: "signin" | "signup"; next: string }) {
  const { state, onSubmit, pending } = useFormAction(mode === "signin" ? signIn : signUp);
  return (
    <form onSubmit={onSubmit} className={`${mode === "signin" ? "mt-6" : "mt-8"} space-y-4`}>
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
  );
}

function CodeSignIn({ next }: { next: string }) {
  const request = useFormAction(requestSignInCode);
  const confirm = useFormAction(signInWithCode);
  const [editing, setEditing] = useState(false);
  const email = request.state?.email;
  const sent = Boolean(request.state?.ok && email) && !editing;

  if (!sent) {
    return (
      <form
        onSubmit={(e) => {
          setEditing(false);
          request.onSubmit(e);
        }}
        className="mt-6 space-y-4"
      >
        <div>
          <label htmlFor="code-email" className="label">Email</label>
          <input id="code-email" name="email" type="email" className="field" autoComplete="email" defaultValue={email} required />
        </div>
        {request.state?.error && <p role="alert" className="text-sm text-fail">{request.state.error}</p>}
        <button type="submit" className="btn btn-primary w-full h-11" disabled={request.pending}>
          {request.pending ? "Sending…" : "Send code"}
        </button>
      </form>
    );
  }

  return (
    <div className="mt-6">
      <p role="status" className="text-sm text-muted">
        {request.state?.ok} <button type="button" className="text-fg underline underline-offset-4" onClick={() => setEditing(true)}>Change email</button>
      </p>
      <form onSubmit={confirm.onSubmit} className="mt-4 space-y-4">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />
        <CodeInput />
        {confirm.state?.error && <p role="alert" className="text-sm text-fail">{confirm.state.error}</p>}
        <button type="submit" className="btn btn-primary w-full h-11" disabled={confirm.pending}>
          {confirm.pending ? "Checking…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
