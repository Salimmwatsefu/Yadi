import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { Briefcase, Key, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios';

const OrganizerGatePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { action } = useParams<{ action: string }>(); // Read 'login' or 'register' from URL
    
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false); 
    const [error, setError] = useState('');
    
    // Fallback to 'login' if action parameter is somehow missing
    const actionType = action === 'register' ? 'register' : 'login';

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const codeInUrl = params.get('code');
        if (codeInUrl) setCode(codeInUrl); 
    }, [location.search]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); 
        setLoading(true);
        setError('');

        try {
            await api.post('/api/auth/check-code/', { code });
            
            setSuccess(true); 
            setLoading(false); 
            
            // Redirect to the ACTUAL Login/Register page with the code attached
            const redirectPath = `/${actionType}/organizer?code=${code}`;
            
            setTimeout(() => {
                 navigate(redirectPath, { replace: true });
            }, 1000); 

        } catch (err: any) {
            console.error("Code check failed:", err);
            setError('Invalid or expired Invitation Code. Please check and try again.');
            setLoading(false);
        } 
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
           <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] blur-[120px] rounded-full opacity-40 bg-secondary/20" />
           <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] blur-[120px] rounded-full opacity-40 bg-blue-500/20" />

           <div className="w-full max-w-md bg-surface/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
               <div className="text-center mb-8">
                   <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-neon mx-auto mb-4 bg-gradient-to-r from-violet-600 to-indigo-600">
                      <Briefcase className="text-white w-6 h-6" />
                   </div>
                   <h1 className="text-2xl font-heading font-bold text-white">Organizer Access</h1>
                   <p className="text-zinc-400 text-sm mt-2">Enter your invitation code to {actionType}.</p>
               </div>
               
               {success ? (
                   <div className="text-center space-y-4 animate-fade-in py-6">
                       <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
                       <h2 className="text-xl font-bold text-white">Code Accepted!</h2>
                       <p className="text-zinc-400 text-sm">Proceeding to {actionType}...</p>
                   </div>
               ) : (
                   <form onSubmit={handleSubmit} className="space-y-6">
                       {error && (
                           <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center">
                               {error}
                           </div>
                       )}
                       <div>
                           <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Invitation Code</label>
                           <div className="relative">
                               <Key className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                               <input 
                                   type="text" 
                                   className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 text-white outline-none focus:ring-2 focus:ring-secondary/50"
                                   placeholder="e.g. ALPHA-2025"
                                   value={code}
                                   onChange={(e) => setCode(e.target.value.toUpperCase())}
                                   required
                               />
                           </div>
                       </div>
                       <button type="submit" disabled={loading} className="w-full py-4 rounded-xl text-white font-bold shadow-lg flex justify-center items-center bg-gradient-to-r from-violet-600 to-indigo-600 hover:scale-[1.02] transition-transform">
                           {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue <ArrowRight className="w-5 h-5 ml-2" /></>}
                       </button>
                   </form>
               )}

               <div className="mt-8 text-center">
                   <p className="text-zinc-400 text-sm">
                       Not an organizer?{' '}
                       <Link to="/login/attendee" className="text-primary font-bold hover:underline">Switch to Fan Sign In</Link>
                   </p>
               </div>
           </div>
        </div>
    );
};

export default OrganizerGatePage;