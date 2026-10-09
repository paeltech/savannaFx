export type SignalDuration = "daily" | "weekly" | "monthly";
export type SignalProviderId = "mpesa" | "airtel" | "mixx" | "halotel";

export const SIGNAL_DURATIONS: { id: SignalDuration; label: string; days: number }[] = [
  { id: "daily", label: "Daily", days: 1 },
  { id: "weekly", label: "Weekly", days: 7 },
  { id: "monthly", label: "Monthly", days: 30 },
];

export const SIGNAL_PROVIDERS: { id: SignalProviderId; label: string; prefixes: string[] }[] = [
  { id: "mpesa", label: "M-Pesa", prefixes: ["74", "75", "76"] },
  { id: "airtel", label: "Airtel Money", prefixes: ["68", "69", "78"] },
  { id: "mixx", label: "Mixx by Yas", prefixes: ["65", "67", "71"] },
  { id: "halotel", label: "Halotel", prefixes: ["61", "62"] },
];

export interface PaidSubscriptionRow {
  status: string;
  payment_status: string;
  amount_paid: number | string;
  end_date: string | null;
}

export function isPaidSignalSubscription(row: PaidSubscriptionRow | null | undefined): boolean {
  if (!row) return false;
  if (row.status !== "active" || row.payment_status !== "completed") return false;
  if (!(Number(row.amount_paid) > 0)) return false;
  if (!row.end_date) return false;
  return new Date(row.end_date).getTime() > Date.now();
}

/** Returns 255XXXXXXXXX or null when the number is not a TZ mobile number. */
export function normalizeTzPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let local = digits;
  if (local.startsWith("255") && local.length === 12) local = local.slice(3);
  else if (local.startsWith("0") && local.length === 10) local = local.slice(1);
  if (!/^[6-7]\d{8}$/.test(local)) return null;
  return `255${local}`;
}

export function providerForPhone(phone: string): SignalProviderId | null {
  const normalized = normalizeTzPhone(phone);
  if (!normalized) return null;
  const prefix = normalized.slice(3, 5);
  const match = SIGNAL_PROVIDERS.find((provider) => provider.prefixes.includes(prefix));
  return match?.id ?? null;
}

export function phoneMatchesProvider(phone: string, providerId: string): boolean {
  return providerForPhone(phone) === providerId;
}

export const MIN_SIGNAL_PAYMENT_TZS = 500;

export function formatTzs(amount: number): string {
  return formatMoney(amount, "TZS");
}

export function formatMoney(amount: number, currency = "TZS"): string {
  return `${Math.round(amount).toLocaleString("en-TZ")} ${currency}`;
}

/** Matches the payment function: an active TZS plan of at least 500 can be charged. */
export function isSellableSignalPlan(
  plan: { price: number | string; currency: string; is_active?: boolean } | null | undefined,
): boolean {
  return sellablePlanIssue(plan) === null;
}

export function sellablePlanIssue(
  plan: { price: number | string; currency: string; is_active?: boolean } | null | undefined,
): string | null {
  if (!plan) return "This duration is not set up.";
  if (plan.is_active === false) return "This plan is turned off.";
  if (plan.currency !== "TZS") return "Mobile money only accepts TZS.";
  const amount = Math.round(Number(plan.price));
  if (!Number.isFinite(amount) || amount < MIN_SIGNAL_PAYMENT_TZS) {
    return `Price must be at least ${MIN_SIGNAL_PAYMENT_TZS} TZS.`;
  }
  return null;
}

export function calendarDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const endDay = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((endDay - today) / 86400000));
}

export function accessRemainingLabel(endDate: string): string {
  const days = calendarDaysRemaining(endDate);
  if (days <= 0) return "Expires today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

type QueryClient = {
  from: (table: string) => {
    select: (columns: string) => any;
  };
};

export async function fetchSignalAccessDetails(
  client: QueryClient,
  userId: string,
): Promise<{ active: boolean; endDate: string | null }> {
  const { data, error } = await client
    .from("signal_subscriptions")
    .select("status, payment_status, amount_paid, end_date")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("end_date", { ascending: false });
  if (error) throw error;
  const paid = ((data ?? []) as PaidSubscriptionRow[]).filter(isPaidSignalSubscription);
  const endDate = paid.reduce<string | null>((latest, row) => {
    if (!row.end_date) return latest;
    if (!latest || new Date(row.end_date).getTime() > new Date(latest).getTime()) return row.end_date;
    return latest;
  }, null);
  return { active: paid.length > 0, endDate };
}

export async function fetchPaidSignalAccess(client: QueryClient, userId: string): Promise<boolean> {
  const access = await fetchSignalAccessDetails(client, userId);
  return access.active;
}
