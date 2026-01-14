/**
 * Shared Trade Analysis types
 * Used by both web and mobile apps
 */
export interface TradeAnalysis {
  id: string;
  trading_pair: string;
  analysis_date: string;
  title: string;
  content: string;
  summary: string | null;
  technical_analysis: Record<string, any> | null;
  fundamental_analysis: Record<string, any> | null;
  entry_levels: Record<string, any> | null;
  exit_levels: Record<string, any> | null;
  risk_level: "low" | "medium" | "high" | null;
  price: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface TradeAnalysisPurchase {
  id: string;
  user_id: string;
  trade_analysis_id: string;
  payment_status: "pending" | "completed" | "failed" | "refunded";
  payment_method: string | null;
  payment_reference: string | null;
  amount_paid: number;
  purchased_at: string;
}
