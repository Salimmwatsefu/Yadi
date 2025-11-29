import React, { useState } from 'react';
import { Wallet, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const WalletActivationBanner = () => {
  const { user, checkAuthStatus } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!user || user.wallet_id) return null;

  const handleActivate = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/api/organizer/wallet/activate/');
      
      setSuccess(true);
      
      // Refresh user data so the context updates with the new wallet_id
      // This will cause this banner to disappear automatically via the check above
      setTimeout(() => {
          checkAuthStatus();
      }, 2000);

    } catch (err) {
      console.error(err);
      setError('Connection to Banking Service failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900/80 to-teal-900/80 border border-emerald-500/30 p-6 mb-8 shadow-lg">
      
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30 text-emerald-400">
            <Wallet className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-heading font-bold text-white">Activate Payouts</h3>
            <p className="text-emerald-200/80 text-sm mt-1 max-w-md">
              To receive ticket revenue, you need to activate your secure Yadi Wallet. 
              This creates a dedicated ledger for your events.
            </p>
            {error && <p className="text-red-400 text-xs mt-2 font-bold">{error}</p>}
          </div>
        </div>

        <div className="flex-shrink-0">
          {success ? (
             <div className="flex items-center px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold animate-fade-in">
                <CheckCircle className="w-5 h-5 mr-2" />
                Wallet Active!
             </div>
          ) : (
             <button 
                onClick={handleActivate}
                disabled={loading}
                className="group flex items-center px-6 py-3 bg-white text-emerald-900 rounded-xl font-bold hover:bg-emerald-50 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-70"
             >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <>
                      Activate Now <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                )}
             </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default WalletActivationBanner;