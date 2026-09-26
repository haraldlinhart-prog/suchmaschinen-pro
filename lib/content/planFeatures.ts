// What each plan includes beyond the publishing cadence (chat 26.09.26).
// Premium is justified by better articles, not just more of them.
export const PLAN_FEATURES: Record<string, { internalLinks: boolean; backlinkOlder: boolean; refresh: boolean }> = {
  free: { internalLinks: false, backlinkOlder: false, refresh: false },
  basic: { internalLinks: false, backlinkOlder: false, refresh: false },
  pro: { internalLinks: true, backlinkOlder: false, refresh: false },
  premium: { internalLinks: true, backlinkOlder: true, refresh: true },
};

export function featuresFor(plan: string | null | undefined) {
  return PLAN_FEATURES[plan || 'free'] || PLAN_FEATURES.free;
}
