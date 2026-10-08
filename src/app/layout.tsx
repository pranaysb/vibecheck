import type { Metadata, Viewport } from "next";
import "./globals.css";
import Link from "next/link";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh flex flex-col overflow-x-clip">
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
            <nav className="flex gap-5" aria-label="Footer">
              <Link href="/methodology" className="hover:text-fg">Methodology</Link>
              <Link href="/experts" className="hover:text-fg">Experts</Link>
              <a href="https://github.com/pranaysb/vibecheck" className="hover:text-fg">Source</a>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
