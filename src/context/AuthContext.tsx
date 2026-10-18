import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api, getAuthToken, setAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    dateOfBirth: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    bloodGroup?: string;
    contactNumber: string;
    emergencyContact?: string;
    address?: string;
    pincode?: string;
    allergies?: string;
    chronicConditions?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<void>;
}

const DEMO_CREDENTIALS: Record<UserRole, { email: string; pass: string }> = {
  ADMIN: { email: 'admin@medpulse.in', pass: 'Password123!' },
  DOCTOR: { email: 'doctor@medpulse.in', pass: 'Password123!' },
  RECEPTIONIST: { email: 'reception@medpulse.in', pass: 'Password123!' },
  PATIENT: { email: 'patient@medpulse.in', pass: 'Password123!' },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const profile = await api.getMe();
        setUser(profile);
      } catch (err) {
        console.warn('Session expired or invalid token:', err);
        setAuthToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const { user: loggedInUser } = await api.login({ email, password: pass });
      setUser(loggedInUser);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    dateOfBirth: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    bloodGroup?: string;
    contactNumber: string;
    emergencyContact?: string;
    address?: string;
    pincode?: string;
    allergies?: string;
    chronicConditions?: string;
  }) => {
    setLoading(true);
    try {
      await api.register(data);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Continue even if server logout errored
    } finally {
      setUser(null);
    }
  };

  const switchDemoRole = async (role: UserRole) => {
    const creds = DEMO_CREDENTIALS[role];
    if (creds) {
      await login(creds.email, creds.pass);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, switchDemoRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
