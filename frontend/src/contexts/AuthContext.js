import React, { createContext, useState, useEffect } from 'react';
import { getAuthStatus, login, logout, register } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const status = await getAuthStatus();
      setCurrentAccount(status.authenticated ? status.account : null);
      setLoading(false);
    };
    checkAuth();
  }, []);

  const signIn = async (credentials) => {
    const data = await login(credentials);
    setCurrentAccount(data.account);
  };

  const signUp = async (credentials) => {
    await register(credentials);
    await signIn(credentials);
  };

  const signOut = async () => {
    await logout();
    setCurrentAccount(null);
  };

  return (
    <AuthContext.Provider value={{ currentAccount, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}; 