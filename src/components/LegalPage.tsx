export const LEGAL_UPDATED = "October 13, 2026";

export function contactLine() {
  const email = process.env.CONTACT_EMAIL;
  return email ? (
    <a className="underline underline-offset-4" href={`mailto:${email}`}>{email}</a>
  ) : (
    <a className="underline underline-offset-4" href="https://github.com/pranaysb/vibecheck/issues">github.com/pranaysb/vibecheck/issues</a>
  );
}

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-2xl px-4 sm:px-6 py-12 sm:py-16">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted">Last updated {LEGAL_UPDATED}</p>
      <div className="mt-10 space-y-8 text-[15px] leading-relaxed [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_p+p]:mt-3 [&_a]:underline [&_a]:underline-offset-4">
        {children}
      </div>
    </article>
  );
}
