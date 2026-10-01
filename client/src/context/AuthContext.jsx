import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('eduproctor_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyUser() {
      if (!token) {
        console.log('[TRIGGER-1-JWT] AuthContext: No token present in storage.');
        setLoading(false);
        return;
      }
      try {
        console.log('[TRIGGER-1-JWT] AuthContext: Verifying token with authApi.getMe()...');
        const res = await authApi.getMe();
        if (res.success && res.user) {
          console.log('[TRIGGER-1-JWT] AuthContext: User session valid for:', res.user.email);
          setUser(res.user);
        } else {
          console.warn('[TRIGGER-1-JWT] AuthContext: authApi.getMe() returned unsuccessful, logging out.');
          logout();
        }
      } catch (err) {
        console.warn('[TRIGGER-1-JWT] Session verification failed, resetting token:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    }
    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.success && res.token) {
      localStorage.setItem('eduproctor_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    if (res.success && res.token) {
      localStorage.setItem('eduproctor_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const demoLogin = async (email) => {
    return await login(email, 'password123');
  };

  const logout = () => {
    console.warn('[TRIGGER-1-JWT] AuthContext: logout() executed! Clearing eduproctor_token from localStorage and clearing state.');
    localStorage.removeItem('eduproctor_token');
    setToken(null);
    setUser(null);
  };

  const isStudent = user?.role === 'STUDENT';
  const isFaculty = user?.role === 'FACULTY';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        loading,
        login,
        register,
        demoLogin,
        logout,
        isAuthenticated: !!user,
        isStudent,
        isFaculty,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
