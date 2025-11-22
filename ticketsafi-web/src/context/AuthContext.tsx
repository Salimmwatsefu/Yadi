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
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  loginWithGoogle: (token: string) => Promise<void>; // NEW
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Check if user is already logged in (Session persistence)
  const checkAuthStatus = async () => {
    try {
      const response = await api.get('/api/auth/user/');
      setUser(response.data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // 2. Login Action (Email/Pass)
  const login = async (credentials: any) => {
    await api.post('/api/auth/login/', credentials);
    await checkAuthStatus();
  };

  // 3. Register Action
  const register = async (data: any) => {
    await api.post('/api/auth/registration/', data);
    await checkAuthStatus();
  };

  // 4. Google Login Action (NEW)
  const loginWithGoogle = async (token: string) => {
    // Send the Google Access Token to Django
    await api.post('/api/auth/google/', {
        access_token: token,
    });
    await checkAuthStatus();
  };

  // 5. Logout Action
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