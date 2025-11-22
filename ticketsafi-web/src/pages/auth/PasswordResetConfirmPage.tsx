import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Lock, Loader2, CheckCircle } from 'lucide-react';
import api from '../../api/axios';

const PasswordResetConfirmPage = () => {
  const navigate = useNavigate();
  const { uid, token } = useParams<{ uid: string; token: string }>(); // Get token from URL
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
        setError("Passwords don't match");
        return;
    }

    setLoading(true);
    setError('');

    try {
      // Django endpoint to finalize reset
      await api.post('/api/auth/password/reset/confirm/', {
          uid,
          token,
          new_password1: password,
          new_password2: confirmPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError('Failed to reset password. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
       <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full opacity-40" />
       
       <div className="w-full max-w-md bg-surface/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
           
           <div className="text-center mb-8">
               <h1 className="text-2xl font-heading font-bold text-white">Set New Password</h1>
               <p className="text-zinc-400 text-sm mt-2">Create a secure password for your account.</p>
           </div>

           {success ? (
               <div className="text-center space-y-4 animate-fade-in">
                   <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto text-success">
                       <CheckCircle className="w-8 h-8" />
                   </div>
                   <div>
                       <h3 className="text-white font-bold">Password Reset!</h3>
                       <p className="text-zinc-400 text-sm mt-2">You can now log in with your new password.</p>
                   </div>
                   <button 
                       onClick={() => navigate('/login')} 
                       className="w-full py-3 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors mt-4"
                   >
                       Log In Now
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
                       <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">New Password</label>
                       <div className="relative">
                           <Lock className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                           <input 
                               type="password" 
                               className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-primary/50 outline-none"
                               placeholder="••••••••"
                               value={password}
                               onChange={(e) => setPassword(e.target.value)}
                               required
                           />
                       </div>
                   </div>

                   <div>
                       <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Confirm Password</label>
                       <div className="relative">
                           <Lock className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                           <input 
                               type="password" 
                               className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-primary/50 outline-none"
                               placeholder="••••••••"
                               value={confirmPassword}
                               onChange={(e) => setConfirmPassword(e.target.value)}
                               required
                           />
                       </div>
                   </div>

                   <button 
                       type="submit" 
                       disabled={loading}
                       className="w-full py-4 rounded-xl bg-neon-gradient text-white font-bold shadow-neon hover:scale-[1.02] transition-transform flex justify-center items-center disabled:opacity-50"
                   >
                       {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
                   </button>
               </form>
           )}
       </div>
    </div>
  );
};

export default PasswordResetConfirmPage;