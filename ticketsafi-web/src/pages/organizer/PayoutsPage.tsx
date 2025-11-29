import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, AlertCircle, Loader2, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  date: string;
  reference: string;
}

const PayoutsPage = () => {
  const { user } = useAuth();
  
  const [balance, setBalance] = useState({ 
      amount: 0, 
      pending_payouts: 0, 
      currency: 'KES', 
      is_frozen: false,
      is_kyc_verified: false
  });
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  // Helper to store pagination metadata separately
  const [pagination, setPagination] = useState({
      current_page: 1,
      total_pages: 1,
      has_next: false,
      has_previous: false
  });
  
  const [loading, setLoading] = useState(true);
  
  // Withdrawal Modal State
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawStatus, setWithdrawStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  // --- FIX 1: Call BOTH fetchers on load ---
  useEffect(() => {
    if (user?.wallet_id) {
        fetchWalletData();
        fetchHistory(1); // <--- THIS WAS MISSING
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      const res = await api.get('/api/organizer/wallet/');
      // --- FIX 2: Prevent NaN with Nullish Coalescing (?? 0) ---
      setBalance({
          amount: res.data.balance ?? 0,
          pending_payouts: res.data.pending_payouts ?? 0, 
          currency: res.data.currency || 'KES',
          is_frozen: res.data.is_frozen || false,
          is_kyc_verified: res.data.is_kyc_verified || false
      });
    } catch (err) {
      console.error("Wallet load failed", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (page: number) => {
      try {
          const res = await api.get(`/api/organizer/wallet/?action=history&page=${page}&page_size=5`);
          // Ensure we are setting the array correctly
          if (res.data.results) {
              setTransactions(res.data.results);
              setPagination({
                  current_page: res.data.current_page,
                  total_pages: res.data.total_pages,
                  has_next: res.data.has_next,
                  has_previous: res.data.has_previous
              });
          }
      } catch (err) {
          console.error("History load failed", err);
      }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawStatus('processing');
    try {
        await api.post('/api/organizer/wallet/', { amount: withdrawAmount });
        setWithdrawStatus('success');
        setWithdrawAmount('');
        // Refresh data after withdrawal
        fetchWalletData(); 
        fetchHistory(1); 
        setTimeout(() => setIsWithdrawing(false), 3000);
    } catch (err) {
        console.error(err);
        setWithdrawStatus('error');
    }
  };

  const handleVerify = async () => {
      try {
          const res = await api.get('/api/organizer/wallet/link/');
          window.open(res.data.magic_link, '_blank');
      } catch (err) {
          alert("Failed to connect to Identity Server.");
      }
  };

  if (!user?.wallet_id) {
      return (
          <div className="text-center py-20">
              <Wallet className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white">Wallet Not Active</h2>
              <p className="text-zinc-400 mt-2">Please activate your wallet on the Dashboard.</p>
          </div>
      );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
              <h1 className="text-3xl font-heading font-bold text-white">Financials</h1>
              <p className="text-zinc-400 mt-1">Manage earnings and payouts.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono">SECURE VAULT</span>
          </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
          
          {/* Balance Card */}
          <div className="md:col-span-2 bg-gradient-to-br from-emerald-900 to-zinc-900 border border-emerald-500/30 p-8 rounded-3xl relative overflow-hidden">
              <div className="relative z-10 grid grid-cols-2 gap-8">
                  <div>
                      <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Available
                      </p>
                      <h2 className="text-4xl font-mono font-bold text-white tracking-tight">
                          {balance.currency} {Number(balance.amount).toLocaleString()}
                      </h2>
                  </div>
                  <div className="opacity-80 border-l border-white/10 pl-8">
                      <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center">
                          <Clock className="w-3 h-3 mr-1" /> Processing
                      </p>
                      <h2 className="text-2xl font-mono font-bold text-zinc-300 tracking-tight">
                          {balance.currency} {Number(balance.pending_payouts).toLocaleString()}
                      </h2>
                  </div>
              </div>
                  
              <div className="mt-8 flex gap-4 relative z-10">
                  <button 
                      onClick={() => { setWithdrawStatus('idle'); setIsWithdrawing(true); }}
                      disabled={balance.is_frozen || Number(balance.amount) <= 0 || !balance.is_kyc_verified}
                      className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-transform hover:scale-105 shadow-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <ArrowUpRight className="w-5 h-5 mr-2" /> 
                      {balance.is_kyc_verified ? 'Withdraw Funds' : 'Verify ID to Withdraw'}
                  </button>
              </div>
              <Wallet className="absolute -bottom-4 -right-4 w-48 h-48 text-emerald-500/10 rotate-[-10deg]" />
          </div>

          {/* Status Card */}
          <div className="bg-surface border border-white/10 p-6 rounded-3xl flex flex-col justify-between">
              <div>
                  <h3 className="font-bold text-white mb-4">Account Status</h3>
                  <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-400">Verification</span>
                          {balance.is_kyc_verified ? (
                              <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded text-xs font-bold border border-green-500/20 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Verified
                              </span>
                          ) : (
                              <button onClick={handleVerify} className="px-3 py-1 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 rounded text-xs font-bold border border-yellow-500/20 transition-colors flex items-center gap-1">
                                  Verify Now <ArrowUpRight className="w-3 h-3" />
                              </button>
                          )}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-400">Method</span>
                          <span className="text-white font-mono">M-Pesa B2C</span>
                      </div>
                  </div>
              </div>
              {balance.is_frozen && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                      <p className="text-xs text-red-400 leading-relaxed">Wallet frozen. Contact support.</p>
                  </div>
              )}
          </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-surface border border-white/5 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-bold text-white text-lg">Recent Activity</h3>
              <span className="text-xs text-zinc-500">Page {pagination.current_page} of {pagination.total_pages}</span>
          </div>
          
          <table className="w-full text-left">
              <thead className="bg-surface-highlight text-zinc-500 text-xs uppercase tracking-wider">
                  <tr>
                      <th className="p-4 pl-6">Transaction</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right pr-6">Amount</th>
                  </tr>
              </thead>
              <tbody className="text-sm text-zinc-300 divide-y divide-white/5">
                  {transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 pl-6">
                              <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-full ${tx.amount > 0 ? 'bg-green-500/10 text-green-500' : 'bg-zinc-700/50 text-zinc-400'}`}>
                                      {tx.amount > 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                  </div>
                                  <div>
                                      <p className="font-medium text-white">{tx.type ? tx.type.replace(/_/g, ' ') : 'Transaction'}</p>
                                      <p className="text-xs text-zinc-500">{tx.reference}</p>
                                  </div>
                              </div>
                          </td>
                          <td className="p-4 text-zinc-400 flex items-center gap-2">
                              <Clock className="w-3 h-3" /> {tx.date}
                          </td>
                          <td className="p-4">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                                  tx.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                  tx.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                  'bg-white/5 border-white/10 text-zinc-400'
                              }`}>
                                  {tx.status ? tx.status.replace('_', ' ') : 'UNKNOWN'}
                              </span>
                          </td>
                          <td className={`p-4 pr-6 text-right font-mono font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-white'}`}>
                              {tx.amount > 0 ? '+' : ''}{Number(tx.amount).toLocaleString()}
                          </td>
                      </tr>
                  ))}

                  {transactions.length === 0 && (
                      <tr>
                          <td colSpan={4} className="p-8 text-center text-zinc-500">No transactions found.</td>
                      </tr>
                  )}
              </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-white/5 flex justify-end gap-2">
              <button 
                  onClick={() => fetchHistory(pagination.current_page - 1)}
                  disabled={!pagination.has_previous}
                  className="p-2 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                  <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <button 
                  onClick={() => fetchHistory(pagination.current_page + 1)}
                  disabled={!pagination.has_next}
                  className="p-2 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                  <ChevronRight className="w-4 h-4 text-white" />
              </button>
          </div>
      
      </div>

      {/* Withdrawal Modal */}
      {isWithdrawing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-surface border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-slide-up">
                  {withdrawStatus === 'success' ? (
                      <div className="text-center py-4">
                          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                              <CheckCircle2 className="w-8 h-8" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">Request Sent</h3>
                          <p className="text-zinc-400 text-sm">Your withdrawal is pending approval. Funds are reserved.</p>
                      </div>
                  ) : (
                      <>
                        <h3 className="text-xl font-bold text-white mb-6">Withdraw Funds</h3>
                        <form onSubmit={handleWithdraw} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Amount (KES)</label>
                                <input 
                                    type="number" 
                                    autoFocus
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-2xl font-mono focus:border-emerald-500 outline-none text-center"
                                    placeholder="0"
                                    value={withdrawAmount}
                                    onChange={e => setWithdrawAmount(e.target.value)}
                                    max={Number(balance.amount)}
                                    min={100}
                                />
                                <p className="text-xs text-zinc-500 mt-2 text-center">
                                    Available: {Number(balance.amount).toLocaleString()}
                                </p>
                            </div>
                            
                            {withdrawStatus === 'error' && (
                                <p className="text-red-500 text-xs text-center">Failed to process request.</p>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button 
                                    type="button"
                                    onClick={() => setIsWithdrawing(false)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={withdrawStatus === 'processing' || !withdrawAmount}
                                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors flex items-center justify-center disabled:opacity-50"
                                >
                                    {withdrawStatus === 'processing' ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Confirm'}
                                </button>
                            </div>
                        </form>
                      </>
                  )}
              </div>
          </div>
      )}

    </div>
  );
};

export default PayoutsPage;