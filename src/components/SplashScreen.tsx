import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Wallet } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <div className="w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/30 mb-8">
          <Wallet className="w-12 h-12 text-white" />
        </div>
        
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-4xl font-display font-bold text-slate-900 mb-2"
        >
          SpendSense
        </motion.h1>
        
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-slate-500 text-center max-w-[250px]"
        >
          Simplify money management through smart insights.
        </motion.p>
      </motion.div>

      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: "120px" }}
        transition={{ delay: 1, duration: 1.2 }}
        className="absolute bottom-20 h-1 bg-primary/10 rounded-full overflow-hidden"
      >
        <motion.div 
          animate={{ x: ["-100%", "100%"] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="w-full h-full bg-primary"
        />
      </motion.div>
    </div>
  );
}
