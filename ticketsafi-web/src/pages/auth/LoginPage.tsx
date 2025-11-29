import React, { useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Ticket, Lock, Loader2, User, Briefcase } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { GoogleIcon } from '../../components/ui/icons/GoogleIcon';

const LoginPage = () => {
  const navigate = useNavigate();
  const { type } = useParams<{ type: 'attendee' | 'organizer' }>();
  const { login, loginWithGoogle } = useAuth();
  
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode>('');

  const isOrganizer = type === 'organizer';

  const config = isOrganizer ? {
      title: "Organizer Portal",
      subtitle: "Manage your events and revenue",
      icon: Briefcase,
      themeColor: "text-secondary",
      gradient: "bg-gradient-to-r from-violet-600 to-indigo-600",
      registerLink: "/register/organizer",
      redirectPath: "/organizer"
  } : {
      title: "Welcome Back",
      subtitle: "Sign in to access your tickets",
      icon: Ticket,
      themeColor: "text-primary",
      gradient: "bg-neon-gradient",
      registerLink: "/register/attendee",
      redirectPath: "/"
  };

  const handleRoleBasedRedirect = async () => {
    try {
        const userRes = await api.get('/api/auth/user/');
        const role = userRes.data.role;

        if (role === 'SCANNER') {
            navigate('/scanner', { replace: true });
        } else if (role === 'ORGANIZER') {
             navigate('/organizer', { replace: true });
        } else {
             navigate('/', { replace: true }); 
        }
    } catch (err) {
        console.error("Failed to fetch role after login", err);
        navigate(config.redirectPath);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
        setLoading(true);
        try {
            const roleToAssign = isOrganizer ? 'ORGANIZER' : 'ATTENDEE';
            await loginWithGoogle(tokenResponse.access_token, roleToAssign);
            await handleRoleBasedRedirect();
        } catch (err) {
            setError('Google Sign-In failed. Please try again.');
            setLoading(false);
        }
    },
    onError: () => {
        setError('Google Sign-In failed.');
        setLoading(false);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        const isEmail = formData.identifier.includes('@');
        const loginPayload: any = { password: formData.password };

        if (isEmail) {
            loginPayload.email = formData.identifier;
        } else {
            loginPayload.username = formData.identifier;
        }

        await login(loginPayload);
        await handleRoleBasedRedirect();

    } catch (err: any) {
        console.error(err);
        if (err.response?.data?.non_field_errors) {
            setError(
                <span>
                    {err.response.data.non_field_errors[0]} <br/>
                    Guest checkout user?{' '}
                    <Link to="/forgot-password" className="underline font-bold hover:text-white">
                        Reset Password
                    </Link>
                </span>
            );
        } else {
            setError('Invalid credentials. Please try again.');
        }
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
       <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] blur-[120px] rounded-full opacity-40 ${isOrganizer ? 'bg-secondary/20' : 'bg-primary/20'}`} />
       <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] blur-[120px] rounded-full opacity-40 ${isOrganizer ? 'bg-blue-500/20' : 'bg-secondary/20'}`} />

       <div className="w-full max-w-md bg-surface/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
           
           <div className="text-center mb-8">
               <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-neon mx-auto mb-4 ${config.gradient}`}>
                  <config.icon className="text-white w-6 h-6" />
               </div>
               <h1 className="text-2xl font-heading font-bold text-white">{config.title}</h1>
               <p className="text-zinc-400 text-sm mt-2">{config.subtitle}</p>
           </div>

           {error && (
               <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center leading-relaxed animate-slide-up">
                   {error}
               </div>
           )}

           {/* --- 1. GOOGLE FIRST --- */}
           <button 
             onClick={() => handleGoogleLogin()}
             className="w-full py-3.5 rounded-xl bg-white text-zinc-900 font-bold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-3 mb-6"
           >
            <GoogleIcon className="w-5 h-5" />
             <span>Continue with Google</span>
           </button>

           {/* --- DIVIDER --- */}
           <div className="flex items-center mb-6">
              <div className="flex-1 border-t border-white/10"></div>
              <span className="px-3 text-xs text-zinc-500 uppercase font-bold">Or sign in with email</span>
              <div className="flex-1 border-t border-white/10"></div>
           </div>

           {/* --- 2. FORM SECOND --- */}
           <form onSubmit={handleSubmit} className="space-y-5">
               <div>
                   <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Email or Username</label>
                   <div className="relative">
                       <User className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                       <input 
                           type="text" 
                           className={`w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 text-white placeholder:text-zinc-600 outline-none transition-all focus:ring-2 ${isOrganizer ? 'focus:ring-secondary/50' : 'focus:ring-primary/50'}`}
                           placeholder="username or email@example.com"
                           value={formData.identifier}
                           onChange={(e) => setFormData({...formData, identifier: e.target.value})}
                           required
                       />
                   </div>
               </div>

               <div>
                   <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Password</label>
                   <div className="relative">
                       <Lock className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                       <input 
                           type="password" 
                           className={`w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 text-white placeholder:text-zinc-600 outline-none transition-all focus:ring-2 ${isOrganizer ? 'focus:ring-secondary/50' : 'focus:ring-primary/50'}`}
                           placeholder="••••••••"
                           value={formData.password}
                           onChange={(e) => setFormData({...formData, password: e.target.value})}
                           required
                       />
                   </div>
               </div>

               <div className="flex justify-end">
                   <Link 
                       to="/forgot-password" 
                       className="text-xs font-bold text-zinc-400 hover:text-white transition-colors"
                   >
                       Forgot Password?
                   </Link>
               </div>

               <button 
                   type="submit" 
                   disabled={loading}
                   className={`w-full py-4 rounded-xl text-white font-bold shadow-lg hover:scale-[1.02] transition-transform flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed ${config.gradient}`}
               >
                   {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
               </button>
           </form>

           <div className="mt-8 text-center">
               <p className="text-zinc-400 text-sm">
                   Don't have an account?{' '}
                   <Link to={config.registerLink} className={`${config.themeColor} font-bold hover:underline`}>
                       Create {isOrganizer ? 'Organizer' : 'Fan'} Account
                   </Link>
               </p>
           </div>
       </div>
    </div>
  );
};

export default LoginPage;