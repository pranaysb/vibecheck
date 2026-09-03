import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/lib/auth/UserContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ToastProvider } from "@/components/ui/ToastProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VibeCheck — You built it. Now prove it's good.",
  description: "VibeCheck gives AI-assisted developers honest feedback, automated checks, and expert engineering reviews before they ship.",
  openGraph: {
    title: "VibeCheck — Don't just vibe code. Vibe check.",
    description: "Automated analysis, structured community feedback, and expert reviews for AI-assisted indie developers.",
    siteName: "VibeCheck",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-[#08080a] text-white font-sans selection:bg-white/20 selection:text-white">
        <UserProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <ToastProvider />
        </UserProvider>
      </body>
    </html>
  );
}
