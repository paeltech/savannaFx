/**
 * Shared Signal types
 * Used by both web and mobile apps
 */
export interface Signal {
  id: string;
  trading_pair: string;
  signal_type: "buy" | "sell";
  entry_price: number;
  stop_loss: number;
  take_profit_1: number | null;
  take_profit_2: number | null;
  take_profit_3: number | null;
  title: string;
  analysis: string | null;
  confidence_level: "low" | "medium" | "high" | null;
  status: "active" | "closed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface SignalPricing {
  id: string;
  pricing_type: "monthly" | "per_pip";
  price: number;
  currency: string;
  description: string | null;
  features: string[] | null;
  is_active: boolean;
}
