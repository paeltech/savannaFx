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

export function formatTzs(amount: number): string {
  return `${Math.round(amount).toLocaleString("en-TZ")} TZS`;
}

type QueryClient = {
  from: (table: string) => {
    select: (columns: string) => any;
  };
};

export async function fetchPaidSignalAccess(client: QueryClient, userId: string): Promise<boolean> {
  const { data, error } = await client
    .from("signal_subscriptions")
    .select("status, payment_status, amount_paid, end_date")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("end_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).some((row: PaidSubscriptionRow) => isPaidSignalSubscription(row));
}
