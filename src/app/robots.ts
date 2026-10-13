import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Audit reports, previews and account pages are unlisted by design.
    rules: { userAgent: "*", allow: "/", disallow: ["/audits/", "/preview/", "/reviews/", "/dashboard", "/admin", "/expert", "/notifications", "/api/"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
