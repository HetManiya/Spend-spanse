import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Transaction } from '../types';
import { 
  PieChart as PieChartIcon, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  BrainCircuit,
  Sparkles
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

const COLORS = ['#1976D2', '#43A047', '#E53935', '#FB8C00', '#8E24AA', '#00ACC1', '#C0CA33', '#546E7A'];

export default function Analytics() {
  const [user] = useAuthState(auth);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [insights, setInsights] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

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
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });

    return () => unsubscribe();
  }, [user]);

  // Category data for Pie Chart
  const categoryData = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: any[], t) => {
      const existing = acc.find(item => item.name === t.category);
      if (existing) {
        existing.value += t.amount;
      } else {
        acc.push({ name: t.category, value: t.amount });
      }
      return acc;
    }, []);

  // Monthly trend data for Bar Chart
  const last6Months = eachMonthOfInterval({
    start: subMonths(new Date(), 5),
    end: new Date()
  });

  const trendData = last6Months.map(month => {
    const monthStr = format(month, 'yyyy-MM');
    const monthTransactions = transactions.filter(t => t.date.startsWith(monthStr));
    
    return {
      name: format(month, 'MMM'),
      income: monthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0),
      expense: monthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0),
    };
  });

  const generateInsights = async () => {
    if (transactions.length === 0) return;
    setAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `You are a professional financial advisor. Analyze these financial transactions and provide exactly 3 smart, actionable, and personalized insights for better money management. 
      Each insight should be concise (max 2 sentences) and highly relevant to the data provided.
      Format as markdown with a title for each insight and a bullet point.
      
      Transactions: ${JSON.stringify(transactions.slice(0, 30).map(t => ({ type: t.type, amount: t.amount, category: t.category, date: t.date, note: t.note })))}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      setInsights(response.text || "No insights available at the moment.");
    } catch (error) {
      console.error("AI Insight Error:", error);
      setInsights("Failed to generate insights. Please try again later.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl">Analytics</h1>
        <p className="text-slate-500">Visualizing your financial health</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Breakdown */}
        <div className="glass p-6 rounded-3xl border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <PieChartIcon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-xl">Category Breakdown</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="glass p-6 rounded-3xl border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-accent/10 rounded-lg">
              <BarChart3 className="w-5 h-5 text-accent" />
            </div>
            <h3 className="text-xl">Monthly Trend</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="income" fill="#43A047" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#E53935" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="glass p-8 rounded-[32px] bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <BrainCircuit className="w-40 h-40" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl">
                <Sparkles className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-2xl font-display">AI Financial Insights</h3>
            </div>
            <button
              onClick={generateInsights}
              disabled={analyzing || transactions.length === 0}
              className="px-6 py-2 bg-primary rounded-xl text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {analyzing ? "Analyzing..." : "Generate Insights"}
            </button>
          </div>

          {insights ? (
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown>{insights}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-slate-400 py-4">
              {transactions.length === 0 
                ? "Add some transactions to get personalized AI insights." 
                : "Click the button above to get smart insights about your spending habits."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
