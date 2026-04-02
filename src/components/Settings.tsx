import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  setDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { UserProfile, Budget } from '../types';
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  CreditCard, 
  Check,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Settings() {
  const [user] = useAuthState(auth);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        const newProfile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName || 'User',
          email: user.email || '',
          currency: 'USD',
        };
        await setDoc(docRef, newProfile);
        setProfile(newProfile);
      }
    };

    const currentMonth = new Date().toISOString().slice(0, 7);
    const q = query(
      collection(db, 'budgets'),
      where('userId', '==', user.uid),
      where('month', '==', currentMonth)
    );

    const unsubscribeBudget = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setBudget({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Budget);
      }
    });

    fetchProfile();
    return () => unsubscribeBudget();
  }, [user]);

  const handleSaveBudget = async (limit: string) => {
    if (!user) return;
    setSaving(true);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const budgetId = budget?.id || `${user.uid}_${currentMonth}`;
      await setDoc(doc(db, 'budgets', budgetId), {
        userId: user.uid,
        limit: parseFloat(limit),
        month: currentMonth,
      });
      setMessage({ type: 'success', text: 'Budget updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update budget.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl">Settings</h1>
        <p className="text-slate-500">Manage your profile and preferences</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass p-6 rounded-[32px] border-slate-200 text-center">
            <div className="relative inline-block mb-4">
              <img 
                src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName}`} 
                alt="Profile" 
                className="w-24 h-24 rounded-3xl object-cover border-4 border-white shadow-lg"
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl">{user?.displayName}</h3>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>

          <div className="glass p-6 rounded-[32px] border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Notifications
            </h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Budget Alerts</span>
              <div className="w-10 h-6 bg-primary rounded-full relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Weekly Reports</span>
              <div className="w-10 h-6 bg-slate-200 rounded-full relative">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Settings Forms */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass p-8 rounded-[32px] border-slate-200">
            <h3 className="text-xl mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Budget Settings
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 uppercase ml-1">Monthly Budget Limit</label>
                <div className="relative">
                  <input
                    type="number"
                    defaultValue={budget?.limit}
                    placeholder="Enter amount"
                    onBlur={(e) => handleSaveBudget(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-xl font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</div>
                </div>
                <p className="text-xs text-slate-400 ml-1">We'll notify you when you reach 80% of this limit.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 uppercase ml-1">Currency</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20">
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 uppercase ml-1">Language</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20">
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </select>
                </div>
              </div>
            </div>

            {message && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "mt-6 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium",
                  message.type === 'success' ? "bg-accent/10 text-accent" : "bg-warning/10 text-warning"
                )}
              >
                {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                {message.text}
              </motion.div>
            )}
          </div>

          <div className="glass p-8 rounded-[32px] border-slate-200">
            <h3 className="text-xl mb-6 flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Export Data
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              Download all your transaction history in CSV format for external analysis.
            </p>
            <button className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95">
              Export to CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
