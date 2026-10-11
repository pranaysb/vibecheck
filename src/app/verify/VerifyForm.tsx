"use client";

import { useFormAction } from "@/components/use-form-action";
import { sendVerificationCode, verifyEmail } from "@/app/actions/auth";
import { CodeInput } from "@/components/CodeInput";

export function VerifyForm({ email, next, sent }: { email: string; next: string; sent: boolean }) {
  const verify = useFormAction(verifyEmail);
  const resend = useFormAction(sendVerificationCode);
  const codeSent = sent || Boolean(resend.state?.ok);

  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:py-24">
      <h1 className="text-2xl font-semibold">Verify your email</h1>
      <p className="mt-1.5 text-sm text-muted">
        {codeSent ? (
          <>We sent a 6-digit code to <span className="text-fg font-medium break-all">{email}</span>. It expires in 10 minutes.</>
        ) : (
          <>Uploads, expert reviews and admin access need a verified email. We&rsquo;ll send a code to <span className="text-fg font-medium break-all">{email}</span>.</>
        )}
      </p>

      {codeSent ? (
        <form onSubmit={verify.onSubmit} className="mt-8 space-y-4">
          <input type="hidden" name="next" value={next} />
          <CodeInput />
          {verify.state?.error && <p role="alert" className="text-sm text-fail">{verify.state.error}</p>}
          <button type="submit" className="btn btn-primary w-full h-11" disabled={verify.pending}>
            {verify.pending ? "Checking…" : "Verify"}
          </button>
        </form>
      ) : null}

      <form onSubmit={resend.onSubmit} className={codeSent ? "mt-6" : "mt-8"}>
        <button type="submit" className={codeSent ? "btn btn-ghost btn-sm px-0 hover:bg-transparent underline underline-offset-4" : "btn btn-primary w-full h-11"} disabled={resend.pending}>
          {resend.pending ? "Sending…" : codeSent ? "Send a new code" : "Send code"}
        </button>
        {resend.state?.error && <p role="alert" className="mt-2 text-sm text-fail">{resend.state.error}</p>}
        {resend.state?.ok && codeSent && sent && <p role="status" className="mt-2 text-sm text-muted">{resend.state.ok}</p>}
      </form>
    </div>
  );
}
