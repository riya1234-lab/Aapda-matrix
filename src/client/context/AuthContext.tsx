import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '../types';
import { apiClient } from '../services/api';

export interface UserSession {
  id: string;
  displayName: string;
  email?: string;
  role: UserRole;
  phoneNumber?: string;
}

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isOperator: boolean;
  isCommander: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  demoLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('aapda_user');
    return saved ? JSON.parse(saved) : null;
  });

  const isAuthenticated = !!user;
  const isOperator = user?.role === 'OPERATOR' || user?.role === 'COMMANDER';
  const isCommander = user?.role === 'COMMANDER';

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await apiClient.post('/auth/login', { email, password: pass });
      const { token, user: userData } = res.data;
      localStorage.setItem('aapda_auth_token', token);
      localStorage.setItem('aapda_user', JSON.stringify(userData));
      setUser(userData);
      return true;
    } catch (err) {
      console.error('Login failed:', err);
      return false;
    }
  };

  const demoLogin = async (role: UserRole) => {
    if (role === 'COMMANDER') {
      const success = await login('commander@aapdamatrix.org', 'commander123');
      if (!success) {
        // Fallback local session if server is offline
        const mockCommander: UserSession = {
          id: 'usr_commander_01',
          displayName: 'Commander Rajesh Sharma',
          email: 'commander@aapdamatrix.org',
          role: 'COMMANDER',
        };
        setUser(mockCommander);
        localStorage.setItem('aapda_user', JSON.stringify(mockCommander));
      }
    } else {
      const success = await login('citizen@example.com', 'commander123');
      if (!success) {
        const mockCitizen: UserSession = {
          id: 'usr_citizen_01',
          displayName: 'Aarav Patel',
          email: 'citizen@example.com',
          role: 'CITIZEN',
        };
        setUser(mockCitizen);
        localStorage.setItem('aapda_user', JSON.stringify(mockCitizen));
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('aapda_auth_token');
    localStorage.removeItem('aapda_user');
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
        demoLogin,
        logout,
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
