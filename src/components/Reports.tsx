import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  getDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Transaction, UserProfile, CATEGORIES } from '../types';
import { 
  Download, 
  Filter, 
  Calendar, 
  Tag, 
  ArrowUpRight, 
  ArrowDownRight,
  FileText
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { cn } from '../lib/utils';

export default function Reports() {
  const [user] = useAuthState(auth);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [selectedCategory, setSelectedCategory] = useState('All');
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

  const filteredTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    const isInRange = isWithinInterval(transactionDate, { start: startDate, end: endDate });
    const isCategoryMatch = selectedCategory === 'All' || t.category === selectedCategory;
    
    return isInRange && isCategoryMatch;
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Payment Method', 'Note'];
    const rows = filteredTransactions.map(t => [
      t.date,
      t.type,
      t.category,
      t.amount,
      t.paymentMethod || 'Cash',
      `"${(t.note || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `SpendSense_Report_${dateRange.start}_to_${dateRange.end}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCurrencySymbol = (currency?: string) => {
    switch (currency) {
      case 'INR': return '₹';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return '$';
    }
  };

  const symbol = getCurrencySymbol(profile?.currency);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold text-slate-900">Financial Reports</h1>
          <p className="text-slate-500">Analyze and export your spending data</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </header>

      {/* Filters */}
      <div className="glass p-6 rounded-[32px] border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase ml-2">Start Date</label>
          <div className="relative">
            <input 
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
            />
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase ml-2">End Date</label>
          <div className="relative">
            <input 
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
            />
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase ml-2">Category</label>
          <div className="relative">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 appearance-none"
            >
              <option value="All">All Categories</option>
              {Array.from(new Set(Object.values(CATEGORIES).flat())).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-8 rounded-[32px] border-slate-200 flex items-center gap-6">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center">
            <ArrowUpRight className="w-8 h-8 text-accent" />
          </div>
          <div>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">Period Income</p>
            <h3 className="text-3xl font-display font-bold text-slate-900">{symbol}{totalIncome.toLocaleString()}</h3>
          </div>
        </div>
        <div className="glass p-8 rounded-[32px] border-slate-200 flex items-center gap-6">
          <div className="w-16 h-16 bg-warning/10 rounded-2xl flex items-center justify-center">
            <ArrowDownRight className="w-8 h-8 text-warning" />
          </div>
          <div>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">Period Expense</p>
            <h3 className="text-3xl font-display font-bold text-slate-900">{symbol}{totalExpense.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="glass rounded-[32px] border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Filtered Transactions ({filteredTransactions.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600">{format(new Date(t.date), 'MMM dd, yyyy')}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{t.category}</span>
                      {t.note && <span className="text-xs text-slate-400 truncate max-w-[100px]">{t.note}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                      t.type === 'income' ? "bg-accent/10 text-accent" : "bg-warning/10 text-warning"
                    )}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{t.paymentMethod || 'Cash'}</td>
                  <td className={cn(
                    "px-6 py-4 text-right font-bold",
                    t.type === 'income' ? "text-accent" : "text-warning"
                  )}>
                    {t.type === 'income' ? '+' : '-'}{symbol}{t.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTransactions.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No transactions found for the selected filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
