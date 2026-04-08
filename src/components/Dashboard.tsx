import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Transaction, CATEGORIES, UserProfile } from '../types';
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
  Edit2,
  Wallet
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      }
    };

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
      handleFirestoreError(error, OperationType.LIST, 'transactions');
      setLoading(false);
    });

    fetchProfile();
    return () => unsubscribe();
  }, [user]);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const mostSpentCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: { [key: string]: number }, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const topCategory = Object.entries(mostSpentCategory)
    .sort(([, a], [, b]) => b - a)[0];

  const getCurrencySymbol = (currency?: string) => {
    switch (currency) {
      case 'INR': return '₹';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return '$';
    }
  };

  const symbol = getCurrencySymbol(profile?.currency);

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
          <h1 className="text-4xl font-display font-bold text-slate-900">
            Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-slate-500">Here's your financial overview for today.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Date</p>
            <p className="font-bold text-slate-900">{format(new Date(), 'MMMM dd, yyyy')}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-primary/20">
            <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName}`} alt="Profile" referrerPolicy="no-referrer" />
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-8 rounded-[32px] bg-gradient-to-br from-primary to-blue-700 text-white border-none shadow-2xl shadow-primary/30 md:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Wallet className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-bold uppercase tracking-widest text-white/70">Remaining Balance</span>
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <h2 className="text-5xl font-display font-bold mb-4">{symbol}{balance.toLocaleString()}</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <ArrowUpRight className="w-4 h-4 text-accent" />
                <span>{symbol}{totalIncome.toLocaleString()} Income</span>
              </div>
              <div className="flex items-center gap-2 text-sm bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <ArrowDownRight className="w-4 h-4 text-warning" />
                <span>{symbol}{totalExpense.toLocaleString()} Expense</span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass p-8 rounded-[32px] border-slate-200 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Most Spent</span>
            <div className="p-3 bg-warning/10 rounded-2xl">
              <Tag className="w-6 h-6 text-warning" />
            </div>
          </div>
          {topCategory ? (
            <>
              <h2 className="text-3xl font-display font-bold text-slate-900 mb-1">{topCategory[0]}</h2>
              <p className="text-warning font-bold text-xl">{symbol}{topCategory[1].toLocaleString()}</p>
            </>
          ) : (
            <p className="text-slate-400">No data yet</p>
          )}
        </div>
      </div>

      {/* Budget Progress */}
      {profile?.monthlyBudget && (
        <div className="glass p-8 rounded-[32px] border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-display font-bold text-slate-900">Monthly Budget</h3>
              <p className="text-slate-500 text-sm">Target: {symbol}{profile.monthlyBudget.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-display font-bold text-slate-900">
                {Math.round((totalExpense / profile.monthlyBudget) * 100)}%
              </p>
              <p className="text-slate-500 text-sm">Consumed</p>
            </div>
          </div>
          
          <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden mb-4">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((totalExpense / profile.monthlyBudget) * 100, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full transition-colors duration-500",
                (totalExpense / profile.monthlyBudget) >= 1 ? "bg-warning" : 
                (totalExpense / profile.monthlyBudget) >= 0.8 ? "bg-orange-500" : "bg-primary"
              )}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(totalExpense / profile.monthlyBudget) >= 1 ? (
                <div className="flex items-center gap-2 text-warning font-bold text-sm bg-warning/10 px-3 py-1 rounded-full">
                  <TrendingDown className="w-4 h-4" />
                  <span>Budget Exceeded!</span>
                </div>
              ) : (totalExpense / profile.monthlyBudget) >= 0.8 ? (
                <div className="flex items-center gap-2 text-orange-500 font-bold text-sm bg-orange-500/10 px-3 py-1 rounded-full">
                  <TrendingDown className="w-4 h-4" />
                  <span>Nearing Limit (80%+)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-accent font-bold text-sm bg-accent/10 px-3 py-1 rounded-full">
                  <TrendingUp className="w-4 h-4" />
                  <span>On Track</span>
                </div>
              )}
            </div>
            <p className="text-slate-400 text-sm">
              {symbol}{(profile.monthlyBudget - totalExpense).toLocaleString()} remaining
            </p>
          </div>
        </div>
      )}

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
                  {t.type === 'income' ? '+' : '-'}{symbol}{t.amount.toLocaleString()}
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
