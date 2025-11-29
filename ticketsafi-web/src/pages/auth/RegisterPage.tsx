import React, { useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Ticket, Mail, Lock, User, Loader2, Briefcase, CheckCircle } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { GoogleIcon } from '../../components/ui/icons/GoogleIcon';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { type } = useParams<{ type: 'attendee' | 'organizer' }>();
  const { register, loginWithGoogle } = useAuth();
  
  const isOrganizer = type === 'organizer';
  
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode>('');

  const config = isOrganizer ? {
      title: "Become an Organizer",
      subtitle: "Start selling tickets in minutes",
      icon: Briefcase,
      themeColor: "text-secondary",
      gradient: "bg-gradient-to-r from-violet-600 to-indigo-600",
      loginLink: "/login/organizer",
      redirectPath: "/organizer",
      role: "ORGANIZER"
  } : {
      title: "Join TicketSafi",
      subtitle: "Create an account to get started",
      icon: Ticket,
      themeColor: "text-primary",
      gradient: "bg-neon-gradient",
      loginLink: "/login/attendee",
      redirectPath: "/",
      role: "ATTENDEE"
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
        console.error("Failed to fetch role", err);
        navigate(config.redirectPath);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
        setLoading(true);
        try {
            await loginWithGoogle(tokenResponse.access_token, config.role);
            await handleRoleBasedRedirect();
        } catch (err) {
            setError('Google Sign-Up failed. Please try again.');
            setLoading(false);
        }
    },
    onError: () => setError('Google Sign-Up failed.'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
        setError("Passwords don't match");
        return;
    }
    setLoading(true);
    setError('');

    try {
        await register({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            password1: formData.password,
            password2: formData.confirmPassword,
            role: config.role
        });
        await handleRoleBasedRedirect();

    } catch (err: any) {
        console.error(err);
        const errorData = err.response?.data;

        const errorCode = err.response?.data?.non_field_errors?.[0];

// CASE 1: Guest Account Found
if (errorCode === "ACCOUNT_EXISTS_NEEDS_ACTIVATION") {
     setError(
       <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-center animate-fade-in">
         <h3 className="text-emerald-400 font-bold mb-1 flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" /> Guest Account Found!
         </h3>
         <p className="text-sm text-zinc-300">
            We sent an activation link to <strong>{formData.email}</strong> to verify ownership.
         </p>
       </div>
     );
     setLoading(false);
     return;
}

// CASE 2: New Account Created (Standard)
if (errorCode === "ACCOUNT_CREATED_NEEDS_ACTIVATION") {
     setError(
       <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-center animate-fade-in">
         <h3 className="text-blue-400 font-bold mb-1 flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" /> Account Created!
         </h3>
         <p className="text-sm text-zinc-300">
            Please check <strong>{formData.email}</strong> for a verification link to complete setup.
         </p>
       </div>
     );
     setLoading(false);
     return;
}

        if (errorData?.email) {
             setError(
               <span>
                 An account with this email already exists. <br/>
                 <Link to="/login" className="underline font-bold hover:text-white">
                   Log in here.
                 </Link>
               </span>
             );
        } else if (errorData?.username) {
             setError('That username is already taken. Please choose another.');
        } else if (errorData?.password1) {
             setError('Password error: ' + errorData.password1[0]);
        } else {
             setError('Registration failed. Please check your details.');
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
              <span className="px-3 text-xs text-zinc-500 uppercase font-bold">Or sign up with email</span>
              <div className="flex-1 border-t border-white/10"></div>
           </div>

           {/* --- 2. FORM SECOND --- */}
           <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                   <div className="relative">
                       <User className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                       <input 
                           type="text" 
                           className={`w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 text-white placeholder:text-zinc-600 outline-none transition-all focus:ring-2 ${isOrganizer ? 'focus:ring-secondary/50' : 'focus:ring-primary/50'}`}
                           placeholder="Username"
                           value={formData.username}
                           onChange={(e) => setFormData({...formData, username: e.target.value})}
                           required
                       />
                   </div>
               </div>
               
               <div>
                   <div className="relative">
                       <Mail className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                       <input 
                           type="email" 
                           className={`w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 text-white placeholder:text-zinc-600 outline-none transition-all focus:ring-2 ${isOrganizer ? 'focus:ring-secondary/50' : 'focus:ring-primary/50'}`}
                           placeholder="Email Address"
                           value={formData.email}
                           onChange={(e) => setFormData({...formData, email: e.target.value})}
                           required
                       />
                   </div>
               </div>

               <div>
                   <div className="relative">
                       <Lock className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                       <input 
                           type="password" 
                           className={`w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 text-white placeholder:text-zinc-600 outline-none transition-all focus:ring-2 ${isOrganizer ? 'focus:ring-secondary/50' : 'focus:ring-primary/50'}`}
                           placeholder="Password"
                           value={formData.password}
                           onChange={(e) => setFormData({...formData, password: e.target.value})}
                           required
                       />
                   </div>
               </div>

               <div>
                   <div className="relative">
                       <Lock className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                       <input 
                           type="password" 
                           className={`w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 text-white placeholder:text-zinc-600 outline-none transition-all focus:ring-2 ${isOrganizer ? 'focus:ring-secondary/50' : 'focus:ring-primary/50'}`}
                           placeholder="Confirm Password"
                           value={formData.confirmPassword}
                           onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                           required
                       />
                   </div>
               </div>

               <button 
                   type="submit" 
                   disabled={loading}
                   className={`w-full py-4 rounded-xl text-white font-bold shadow-lg hover:scale-[1.02] transition-transform flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed ${config.gradient}`}
               >
                   {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
               </button>
           </form>

           <div className="mt-8 text-center">
               <p className="text-zinc-400 text-sm">
                   Already have an account?{' '}
                   <Link to={config.loginLink} className={`${config.themeColor} font-bold hover:underline`}>
                       Sign In
                   </Link>
               </p>
           </div>
       </div>
    </div>
  );
};

export default RegisterPage;