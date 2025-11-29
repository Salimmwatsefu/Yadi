import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

interface User {
  pk: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: 'ORGANIZER' | 'ATTENDEE' | 'SCANNER' | 'ADMIN'; 
  is_staff?: boolean; 
  wallet_id?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  // FIX: Add the optional role argument here so TypeScript allows it
  loginWithGoogle: (token: string, role?: string) => Promise<void>; 
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      const response = await api.get('/api/auth/user/');
      setUser(response.data);

      if (response.data.role === 'SCANNER' && window.location.pathname !== '/scanner') {
          window.location.href = '/scanner';
      }
      
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async (credentials: any) => {
    await api.post('/api/auth/login/', credentials);
    await checkAuthStatus();
  };

  const register = async (data: any) => {
    await api.post('/api/auth/registration/', data);
    await checkAuthStatus();
  };

  // 4. Google Login Action
  // The logic here is perfect. It sends the role to your custom Adapter.
  const loginWithGoogle = async (token: string, role = 'ATTENDEE') => {
    // CHANGE: Append ?role=${role} to the URL
    await api.post(`/api/auth/google/?role=${role}`, {
        access_token: token,
        role: role 
    });
    await checkAuthStatus();
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout/');
      setUser(null);
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, checkAuthStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};