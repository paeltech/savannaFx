/**
 * Deterministic "tip of the day" selection (UTC calendar day).
 * Must match logic in supabase/functions/distribute-daily-tip/index.ts
 */
export type TradingTipRow = {
  id: string;
  title: string;
  body: string;
  content_kind: 'tip' | 'quote';
  sort_order: number;
  active: boolean;
};

export function utcDayNumber(d: Date = new Date()): number {
  const utcMidnight = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.floor(utcMidnight / 86_400_000);
}

export function pickDailyTip<T extends Pick<TradingTipRow, 'id' | 'sort_order'>>(tips: T[], d: Date = new Date()): T | null {
  if (!tips.length) return null;
  const sorted = [...tips].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.id.localeCompare(b.id);
  });
  const idx = utcDayNumber(d) % sorted.length;
  return sorted[idx] ?? null;
}
