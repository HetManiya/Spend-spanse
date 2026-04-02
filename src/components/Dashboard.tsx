import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Transaction, CATEGORIES } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Tag,
  MoreVertical,
  Trash2,
  Edit2
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const [user] = useAuthState(auth);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      setTransactions(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const chartData = transactions
    .slice(0, 7)
    .reverse()
    .map(t => ({
      date: format(new Date(t.date), 'MMM dd'),
      amount: t.type === 'income' ? t.amount : -t.amount
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl">Dashboard</h1>
          <p className="text-slate-500">Welcome back, {user?.displayName?.split(' ')[0]}</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200">
          <button className="px-4 py-2 bg-slate-100 rounded-xl text-sm font-medium">Monthly</button>
          <button className="px-4 py-2 text-slate-500 text-sm font-medium">Weekly</button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-3xl bg-gradient-to-br from-primary to-blue-600 text-white border-none">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-white/80">Total Balance</span>
            <div className="p-2 bg-white/20 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-4xl font-bold mb-2">${balance.toLocaleString()}</h2>
          <div className="flex items-center gap-2 text-sm text-white/80">
            <ArrowUpRight className="w-4 h-4" />
            <span>+12.5% from last month</span>
          </div>
        </div>

        <div className="glass p-6 rounded-3xl border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500">Income</span>
            <div className="p-2 bg-accent/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-2 text-slate-900">${totalIncome.toLocaleString()}</h2>
          <div className="flex items-center gap-2 text-sm text-accent">
            <ArrowUpRight className="w-4 h-4" />
            <span>Healthy growth</span>
          </div>
        </div>

        <div className="glass p-6 rounded-3xl border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500">Expenses</span>
            <div className="p-2 bg-warning/10 rounded-lg">
              <TrendingDown className="w-5 h-5 text-warning" />
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-2 text-slate-900">${totalExpense.toLocaleString()}</h2>
          <div className="flex items-center gap-2 text-sm text-warning">
            <ArrowDownRight className="w-4 h-4" />
            <span>Keep it in check</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="glass p-6 rounded-3xl border-slate-200">
        <h3 className="text-xl mb-6">Spending Trend</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1976D2" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#1976D2" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#1976D2" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorAmount)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass p-6 rounded-3xl border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl">Recent Transactions</h3>
          <button className="text-sm font-medium text-primary hover:underline">View All</button>
        </div>
        <div className="space-y-4">
          {transactions.slice(0, 5).map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all group">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  t.type === 'income' ? "bg-accent/10 text-accent" : "bg-warning/10 text-warning"
                )}>
                  {t.type === 'income' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{t.category}</p>
                  <p className="text-xs text-slate-500">{format(new Date(t.date), 'MMM dd, yyyy')}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "font-bold",
                  t.type === 'income' ? "text-accent" : "text-warning"
                )}>
                  {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                </p>
                <p className="text-xs text-slate-400">{t.paymentMethod || 'Cash'}</p>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="text-center py-10">
              <p className="text-slate-400">No transactions yet. Start by adding one!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
