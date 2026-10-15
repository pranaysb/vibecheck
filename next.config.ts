import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium-min", "axe-core"],
  outputFileTracingIncludes: {
    "/**": ["./node_modules/playwright-core/**/*", "./node_modules/playwright-core/browsers.json"],
  },
  async headers() {
    // /preview serves uploaded sites with its own stricter, sandboxed headers.
    return [{ source: "/((?!preview/).*)", headers: securityHeaders }];
  },
};

export default nextConfig;
