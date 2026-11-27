export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  show_on_leaderboard: boolean;
  trading_goals: string | null;
  role: "member" | "admin";
  subscription_status: "none" | "active" | "expired";
  subscription_until: string | null;
  referral_code: string;
  created_at: string;
};

export type Trade = {
  id: string;
  user_id: string;
  symbol: string;
  direction: "buy" | "sell";
  status: "open" | "closed";
  entry_price: number;
  exit_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  lot_size: number | null;
  pnl: number | null;
  risk_amount: number | null;
  opened_at: string;
  closed_at: string | null;
  setup: string | null;
  notes: string | null;
};
