import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: { default: "VibeCheck — Website audits you can verify", template: "%s · VibeCheck" },
  description: "Run a deterministic audit of any website, upload, or GitHub repo, then get a written review from an approved human expert.",
  openGraph: { title: "VibeCheck", description: "Automated audit + human expert review for websites.", type: "website" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

/** Clerk's sign-in and account UI reads VibeCheck's own tokens, so it follows light and dark mode. */
const clerkAppearance = {
  variables: {
    colorPrimary: "var(--invert)",
    colorPrimaryForeground: "var(--invert-fg)",
    colorBackground: "var(--raised)",
    colorForeground: "var(--fg)",
    colorMuted: "var(--surface)",
    colorMutedForeground: "var(--muted)",
    colorInput: "var(--raised)",
    colorInputForeground: "var(--fg)",
    colorBorder: "var(--line-strong)",
    colorRing: "var(--ring)",
    colorDanger: "var(--fail)",
    colorSuccess: "var(--pass)",
    colorWarning: "var(--warn)",
    colorNeutral: "var(--fg)",
    colorShadow: "transparent",
    fontFamily: "\"Google Sans Flex\", \"Google Sans\", ui-sans-serif, system-ui, sans-serif",
    borderRadius: "0.625rem",
  },
  elements: {
    // Match VibeCheck's .field: a visible 1px boundary (WCAG 1.4.11) on a slightly recessed fill.
    formFieldInput: { border: "1px solid var(--line-strong)", backgroundColor: "var(--surface)", boxShadow: "none" },
    card: { border: "1px solid var(--line)" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh flex flex-col overflow-x-clip">
        <ClerkProvider appearance={clerkAppearance}>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 btn btn-primary btn-sm">
            Skip to content
          </a>
          <Header />
          <main id="main" className="flex-1 w-full">
            {children}
          </main>
          <footer className="border-t border-line">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row gap-3 sm:items-center justify-between text-[13px] text-muted">
              <p>VibeCheck · MIT licensed · every check is open source and documented.</p>
              <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer">
                <Link href="/methodology" className="hover:text-fg">Methodology</Link>
                <Link href="/experts" className="hover:text-fg">Experts</Link>
                <Link href="/privacy" className="hover:text-fg">Privacy</Link>
                <Link href="/terms" className="hover:text-fg">Terms</Link>
                <a href="https://github.com/pranaysb/vibecheck" className="hover:text-fg">Source</a>
              </nav>
            </div>
          </footer>
        </ClerkProvider>
      </body>
    </html>
  );
}
