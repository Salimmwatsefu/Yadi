import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../../api/axios';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Django endpoint to trigger password reset email
      await api.post('/api/auth/password/reset/', { email });
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
       <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full opacity-40" />
       
       <div className="w-full max-w-md bg-surface/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
           
           <button onClick={() => navigate('/login')} className="flex items-center text-zinc-400 hover:text-white mb-6 transition-colors text-sm">
               <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
           </button>

           <div className="text-center mb-8">
               <h1 className="text-2xl font-heading font-bold text-white">Forgot Password?</h1>
               <p className="text-zinc-400 text-sm mt-2">Enter your email to reset your password or claim your guest account.</p>
           </div>

           {success ? (
               <div className="text-center space-y-4 animate-fade-in">
                   <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto text-success">
                       <CheckCircle className="w-8 h-8" />
                   </div>
                   <div>
                       <h3 className="text-white font-bold">Check your email</h3>
                       <p className="text-zinc-400 text-sm mt-2">We've sent a password reset link to <span className="text-white">{email}</span>.</p>
                       <p className="text-zinc-500 text-xs mt-4">(Check your console terminal since we are in Dev mode)</p>
                   </div>
                   <button onClick={() => navigate('/login')} className="text-primary font-bold hover:underline text-sm">
                       Return to Sign In
                   </button>
               </div>
           ) : (
               <form onSubmit={handleSubmit} className="space-y-5">
                   {error && (
                       <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center">
                           {error}
                       </div>
                   )}

                   <div>
                       <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Email Address</label>
                       <div className="relative">
                           <Mail className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                           <input 
                               type="email" 
                               className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                               placeholder="name@example.com"
                               value={email}
                               onChange={(e) => setEmail(e.target.value)}
                               required
                           />
                       </div>
                   </div>

                   <button 
                       type="submit" 
                       disabled={loading}
                       className="w-full py-4 rounded-xl bg-neon-gradient text-white font-bold shadow-neon hover:scale-[1.02] transition-transform flex justify-center items-center disabled:opacity-50"
                   >
                       {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                   </button>
               </form>
           )}
       </div>
    </div>
  );
};

export default ForgotPasswordPage;