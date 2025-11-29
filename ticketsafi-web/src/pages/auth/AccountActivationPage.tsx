import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const AccountActivationPage = () => {
    const { uid, token } = useParams();
    const navigate = useNavigate();
    const { checkAuthStatus } = useAuth(); // We'll need a helper to set token
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    useEffect(() => {
        const activate = async () => {
            try {
                const res = await api.post('/api/auth/guest/activate/', { uid, token });
                
                // AUTO LOGIN LOGIC
                // We need to force a browser refresh or update context manually
                // Since api/axios handles cookies automatically if HttpOnly, 
                // we might just need to refresh user profile.
                
                // If using cookies (your setup):
                await checkAuthStatus();
                
                setStatus('success');
                setTimeout(() => navigate('/my-tickets'), 2000);
            } catch (err) {
                setStatus('error');
            }
        };
        activate();
    }, []);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="bg-surface border border-white/10 p-8 rounded-3xl text-center max-w-md w-full">
                {status === 'loading' && (
                    <>
                        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white">Verifying...</h2>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white">Account Verified!</h2>
                        <p className="text-zinc-400 mt-2">Logging you in...</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white">Verification Failed</h2>
                        <p className="text-zinc-400 mt-2">Link may be expired or invalid.</p>
                        <button onClick={() => navigate('/login')} className="mt-4 text-primary font-bold">Go to Login</button>
                    </>
                )}
            </div>
        </div>
    );
};

export default AccountActivationPage;