import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from './lib/firebase';
import { doc, getDocFromCache, getDocFromServer } from 'firebase/firestore';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import Analytics from './components/Analytics';
import Reports from './components/Reports';
import Settings from './components/Settings';
import AddTransaction from './components/AddTransaction';
import SplashScreen from './components/SplashScreen';
import { AnimatePresence } from 'motion/react';

export default function App() {
  const [user, loading] = useAuthState(auth);
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    async function testConnection() {
      try {
        // Test connection to Firestore
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
        }
        // Skip logging for other errors, as this is simply a connection test.
      }
    }
    testConnection();
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const handleTabChange = (tab: string) => {
    if (tab === 'add') {
      setIsAddModalOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'transactions':
        return <TransactionList />;
      case 'analytics':
        return <Analytics />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <Layout activeTab={activeTab} setActiveTab={handleTabChange}>
        {renderContent()}
      </Layout>

      <AnimatePresence>
        {isAddModalOpen && (
          <AddTransaction onClose={() => setIsAddModalOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
