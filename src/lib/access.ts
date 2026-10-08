import type { Audit, ReviewRequest } from "@prisma/client";
import type { SessionUser } from "@/lib/auth/session";

type AuditWithRequests = Pick<Audit, "source" | "ownerId"> & { requests: Pick<ReviewRequest, "status" | "expertId">[] };

/**
 * URL and public GitHub audits are viewable by anyone with the link (the inputs are public already).
 * Uploaded .zip audits are private: the owner, admins, and approved experts once a review is requested.
 */
export function canViewAudit(audit: AuditWithRequests, user: SessionUser | null): boolean {
  if (audit.source !== "ZIP") return true;
  if (!user) return false;
  if (audit.ownerId === user.id || user.isAdmin) return true;
  if (user.expertStatus !== "APPROVED") return false;
  return audit.requests.some((r) => r.status === "OPEN" || r.expertId === user.id);
}

export const FOCUS_AREAS = ["Security", "Accessibility", "Performance", "UX & visual design", "Copy & positioning", "Code quality", "SEO", "Mobile"] as const;
