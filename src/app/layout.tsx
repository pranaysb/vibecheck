import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "@/lib/auth/UserContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { CookieConsent } from "@/components/compliance/CookieConsent";

export const metadata: Metadata = {
  title: "VibeCheck — Enterprise Code Quality & Security Audit Platform",
  description: "Continuous architectural validation, SSRF-protected remote probes, and structured peer engineering reviews for mission-critical software.",
  openGraph: {
    title: "VibeCheck — Enterprise Code Quality & Security Audit Platform",
    description: "Continuous architectural validation, SSRF-protected remote probes, and structured peer engineering reviews.",
    siteName: "VibeCheck Enterprise",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#f8fafc] text-[#0f172a] selection:bg-neutral-200 selection:text-neutral-900">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-1.5 focus:bg-neutral-900 focus:text-white focus:text-xs focus:font-medium focus:rounded-md focus:shadow-md focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2"
        >
          Skip to main content
        </a>
        <UserProvider>
          <Navbar />
          <main id="main-content" className="flex-1 focus:outline-none">
            {children}
          </main>
          <Footer />
          <ToastProvider />
          <CookieConsent />
        </UserProvider>
      </body>
    </html>
  );
}
