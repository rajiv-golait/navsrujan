export type TransactionCategory =
  | "Food"
  | "Transport"
  | "Entertainment"
  | "Shopping"
  | "Bills"
  | "Education"
  | "Health"
  | "Other"
  | "Academic";

export const TRANSACTION_CATEGORIES: TransactionCategory[] = [
  "Food",
  "Transport",
  "Entertainment",
  "Shopping",
  "Bills",
  "Education",
  "Health",
  "Other",
  "Academic",
];

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  category: TransactionCategory;
  merchant: string | null;
  description: string | null;
  transaction_date: string;
  created_at: string;
  entry_method: string;
  source_text: string | null;
  confidence_score: number | null;
  semester_number: number | null;
  is_academic: boolean;
  transaction_type?: "debit" | "credit";
}

export interface TransactionCreate {
  amount: number;
  category: TransactionCategory;
  merchant?: string;
  description?: string;
  transaction_date: string;
  entry_method?: string;
  is_academic?: boolean;
}

export interface CategorySummary {
  category: string;
  total: number;
  count: number;
}

export interface MonthSummary {
  month: string;
  total_spent: number;
  transaction_count: number;
  categories: CategorySummary[];
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  college: string | null;
  course: string | null;
  year: number | null;
  monthly_budget: number | null;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    full_name?: string;
  };
  session: AuthSession | null;
}
