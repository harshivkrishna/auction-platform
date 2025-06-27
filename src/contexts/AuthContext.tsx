import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'auctioneer' | 'bidder';
  avatar: string;
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: 'auctioneer' | 'bidder') => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          // Check if token is expired
          const decoded = jwtDecode(storedToken);
          if (decoded.exp && decoded.exp * 1000 > Date.now()) {
            setToken(storedToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            
            // Get user data
            const response = await api.get('/auth/me');
            setUser(response.data.data.user);
          } else {
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Token validation failed:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, token: userToken } = response.data.data;
      
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('token', userToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (name: string, email: string, password: string, role: 'auctioneer' | 'bidder') => {
    try {
      const response = await api.post('/auth/register', { name, email, password, role });
      const { user: userData, token: userToken } = response.data.data;
      
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('token', userToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};