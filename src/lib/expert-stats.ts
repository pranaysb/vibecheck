import type { Verdict } from "@prisma/client";

export interface DeliveredReview {
  rating: number | null;
  verdict: Verdict;
  claimedAt: Date | null;
  deliveredAt: Date;
}

export interface ExpertStats {
  delivered: number;
  rated: number;
  /** Mean of the ratings given, or null before the first one. */
  average: number | null;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  verdicts: Record<Verdict, number>;
  /** Median time from claiming a request to delivering the review. */
  medianTurnaroundMs: number | null;
}

/** An expert's public record, from their visible (not moderator-hidden) delivered reviews only. */
export function expertStats(reviews: DeliveredReview[]): ExpertStats {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const verdicts: Record<Verdict, number> = { SHIP: 0, FIX_FIRST: 0, NOT_READY: 0 };
  const ratings: number[] = [];
  const turnarounds: number[] = [];
  for (const r of reviews) {
    verdicts[r.verdict]++;
    if (r.rating !== null && r.rating >= 1 && r.rating <= 5) {
      ratings.push(r.rating);
      distribution[r.rating as 1 | 2 | 3 | 4 | 5]++;
    }
    if (r.claimedAt) turnarounds.push(Math.max(0, r.deliveredAt.getTime() - r.claimedAt.getTime()));
  }
  turnarounds.sort((a, b) => a - b);
  const mid = turnarounds.length >> 1;
  return {
    delivered: reviews.length,
    rated: ratings.length,
    average: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
    distribution,
    verdicts,
    medianTurnaroundMs: turnarounds.length ? (turnarounds.length % 2 ? turnarounds[mid] : (turnarounds[mid - 1] + turnarounds[mid]) / 2) : null,
  };
}
