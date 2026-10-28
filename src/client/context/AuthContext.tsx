import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserRole } from '../types';
import { apiClient } from '../services/api';

export interface UserSession {
  id: string;
  displayName: string;
  email?: string;
  role: UserRole;
  phoneNumber?: string;
  bloodGroup?: string;
  allergies?: string;
  preferredLanguage?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface RegisterPayload {
  displayName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  bloodGroup?: string;
  allergies?: string;
  preferredLanguage?: string;
}

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isOperator: boolean;
  isCommander: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<UserSession>) => Promise<{ success: boolean; error?: string }>;
  authorizeOperatorWorkstation: (passkey?: string) => Promise<boolean>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('aapda_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = !!user;
  const isOperator = user?.role === 'OPERATOR' || user?.role === 'COMMANDER';
  const isCommander = user?.role === 'COMMANDER';

  // Fetch verified profile from backend
  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem('aapda_auth_token');
    if (!token) return;

    try {
      const res = await apiClient.get('/auth/me');
      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('aapda_user', JSON.stringify(res.data.user));
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('aapda_auth_token');
        localStorage.removeItem('aapda_user');
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  // Victim Login
  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await apiClient.post('/auth/login', { email, password: pass });
      const { token, user: userData } = res.data;
      localStorage.setItem('aapda_auth_token', token);
      localStorage.setItem('aapda_user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Invalid credentials. Please check your email and password.';
      return { success: false, error: errMsg };
    }
  };

  // Victim Registration
  const register = async (payload: RegisterPayload): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await apiClient.post('/auth/register', payload);
      const { token, user: userData } = res.data;
      localStorage.setItem('aapda_auth_token', token);
      localStorage.setItem('aapda_user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Registration failed. Please check your inputs.';
      return { success: false, error: errMsg };
    }
  };

  // Update Profile
  const updateProfile = async (updates: Partial<UserSession>): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await apiClient.patch('/auth/profile', updates);
      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('aapda_user', JSON.stringify(res.data.user));
        return { success: true };
      }
      return { success: false, error: 'Failed to update profile' };
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to update profile';
      return { success: false, error: errMsg };
    }
  };

  // Operator Workstation Access
  const authorizeOperatorWorkstation = async (passkey: string = 'AAPDA_OPS_TACTICAL_2026'): Promise<boolean> => {
    try {
      const res = await apiClient.post('/auth/operator-session', { passkey });
      const { token, user: operatorData } = res.data;
      localStorage.setItem('aapda_operator_token', token);
      localStorage.setItem('aapda_operator_user', JSON.stringify(operatorData));
      // Set for immediate operational use
      localStorage.setItem('aapda_auth_token', token);
      setUser(operatorData);
      return true;
    } catch (err) {
      console.warn('Operator workstation authorization rejected:', err);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('aapda_auth_token');
    localStorage.removeItem('aapda_user');
    localStorage.removeItem('aapda_operator_token');
    localStorage.removeItem('aapda_operator_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isOperator,
        isCommander,
        login,
        register,
        updateProfile,
        authorizeOperatorWorkstation,
        logout,
        refreshProfile,
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
