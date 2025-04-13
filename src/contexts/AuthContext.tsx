
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/sonner';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('lunestock_token');
        
        if (!token) {
          setIsLoading(false);
          return;
        }
        
        // Fetch user profile with the token
        const userData = await apiClient.get('/auth/me');
        setUser(userData);
      } catch (error) {
        // If token is invalid, clear it
        localStorage.removeItem('lunestock_token');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      
      if (response.token) {
        localStorage.setItem('lunestock_token', response.token);
        
        // Fetch user data
        const userData = await apiClient.get('/auth/me');
        setUser(userData);
        
        toast.success('Inicio de sesión exitoso');
      }
    } catch (error) {
      toast.error('Credenciales inválidas');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('lunestock_token');
    setUser(null);
    toast.success('Sesión cerrada exitosamente');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
