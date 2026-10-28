import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User, UserRole, DonorProfile, RecipientProfile, BloodBank } from '../types';

interface AuthContextType {
  user: User | null;
  profile: DonorProfile | RecipientProfile | BloodBank | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: any) => Promise<{ success: boolean; message?: string }>;
  demoLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('hemamatch_token'));
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const storedToken = localStorage.getItem('hemamatch_token');
      if (!storedToken) {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
        return;
      }
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        setProfile(res.data.profile);
      }
    } catch (err) {
      console.error('Failed to load active user session:', err);
      localStorage.removeItem('hemamatch_token');
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        localStorage.setItem('hemamatch_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        await refreshUser();
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Check your credentials.'
      };
    }
  };

  const register = async (data: any) => {
    try {
      const res = await api.post('/auth/register', data);
      if (res.data.success) {
        localStorage.setItem('hemamatch_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        await refreshUser();
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed.'
      };
    }
  };

  const demoLogin = async (role: UserRole) => {
    try {
      setIsLoading(true);
      const res = await api.post('/auth/demo-login', { role });
      if (res.data.success) {
        localStorage.setItem('hemamatch_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        await refreshUser();
      }
    } catch (err: any) {
      console.error('Demo login error:', err);
      alert('Demo login failed. Please ensure the server seed has run.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('hemamatch_token');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        isLoading,
        login,
        register,
        demoLogin,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
