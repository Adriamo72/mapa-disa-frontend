// src/AuthContext.tsx (mejorado)
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Credenciales predefinidas
const VALID_CREDENTIALS = [
  { username: 'admin', password: 'admin123' },
  { username: 'disa', password: 'disa2024' },
  { username: 'usuario', password: 'usuario123' }
];

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar si ya está autenticado al cargar la aplicación
  useEffect(() => {
    const checkAuthStatus = () => {
      const savedAuth = localStorage.getItem('isAuthenticated');
      const savedUser = localStorage.getItem('user');

      if (savedAuth === 'true' && savedUser) {
        setIsAuthenticated(true);
        setUser(savedUser);
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = (username: string, password: string): boolean => {
    const isValid = VALID_CREDENTIALS.some(
      cred => cred.username === username && cred.password === password
    );

    if (isValid) {
      setIsAuthenticated(true);
      setUser(username);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', username);
      return true;
    }

    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    login,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};