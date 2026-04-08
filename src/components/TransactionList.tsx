import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  deleteDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Transaction, UserProfile } from '../types';
import { 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  Trash2,
  Calendar,
  Tag,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function TransactionList() {
  const [user] = useAuthState(auth);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });

    fetchProfile();
    return () => unsubscribe();
  }, [user]);

  const getCurrencySymbol = (currency?: string) => {
    switch (currency) {
      case 'INR': return '₹';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return '$';
    }
  };

  const symbol = getCurrencySymbol(profile?.currency);

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         t.note.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'transactions', id));
      setDeletingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `transactions/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl">History</h1>
        <p className="text-slate-500">Manage your past transactions</p>
      </header>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <div className="flex p-1 bg-white border border-slate-200 rounded-2xl">
          {(['all', 'income', 'expense'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold capitalize transition-all",
                filterType === type ? "bg-slate-100 text-primary" : "text-slate-500"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredTransactions.map((t) => (
          <div 
            key={t.id} 
            className="glass p-4 rounded-3xl border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center",
                t.type === 'income' ? "bg-accent/10 text-accent" : "bg-warning/10 text-warning"
              )}>
                {t.type === 'income' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-900">{t.category}</p>
                  {t.note && <span className="text-xs text-slate-400">• {t.note}</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(t.date), 'MMM dd, yyyy')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {t.paymentMethod || 'Cash'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className={cn(
                  "text-lg font-bold",
                  t.type === 'income' ? "text-accent" : "text-warning"
                )}>
                  {t.type === 'income' ? '+' : '-'}{symbol}{t.amount.toLocaleString()}
                </p>
              </div>
              <button 
                onClick={() => setDeletingId(t.id)}
                className="p-2 text-slate-300 hover:text-warning hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
        
        {/* Delete Confirmation Modal */}
        {deletingId && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-[32px] max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-xl font-display font-bold text-slate-900 mb-2">Delete Transaction?</h3>
              <p className="text-slate-500 mb-8">This action cannot be undone. Are you sure you want to proceed?</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeletingId(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDelete(deletingId)}
                  className="flex-1 py-3 bg-warning text-white rounded-2xl font-bold hover:bg-warning/90 transition-all shadow-lg shadow-warning/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
        
        {filteredTransactions.length === 0 && (
          <div className="text-center py-20 glass rounded-[32px] border-dashed border-2 border-slate-200">
            <p className="text-slate-400">No transactions found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
