import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, LogIn, AlertCircle, Loader2 } from 'lucide-react';

export default function Auth() {
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    
    // Optional: Add custom parameters if needed
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-cancelled') {
        setError('Login was cancelled. Please keep the popup open to sign in.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups for this site.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google sign-in is not enabled in Firebase Console.');
      } else {
        setError(err.message || 'An unexpected error occurred during login.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass max-w-md w-full p-8 rounded-3xl text-center relative overflow-hidden"
      >
        <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Wallet className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl mb-2 font-display">SpendSense</h1>
        <p className="text-slate-500 mb-8">
          Smart expense management for a better financial future.
        </p>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-warning/10 text-warning rounded-2xl text-sm flex items-start gap-3 text-left"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 border border-slate-200 py-4 px-6 rounded-2xl font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
        >
          {isLoggingIn ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          ) : (
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          )}
          {isLoggingIn ? 'Connecting...' : 'Continue with Google'}
        </button>
        
        <div className="mt-8 space-y-4">
          <p className="text-xs text-slate-400">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Tip: Ensure popups are enabled in your browser
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
