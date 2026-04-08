export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  category: string;
  date: string; // ISO format
  note: string;
  type: TransactionType;
  paymentMethod?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  limit: number;
  month: string; // YYYY-MM
  category?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  currency: string;
  incomeRange?: string;
  monthlyBudget?: number;
}

export const CATEGORIES = {
  expense: [
    'Food',
    'Travel',
    'Shopping',
    'Rent',
    'Health',
    'Entertainment',
    'Utilities',
    'Others',
  ],
  income: [
    'Salary',
    'Freelance',
    'Investment',
    'Gift',
    'Others',
  ],
};
