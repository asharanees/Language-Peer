import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  targetLanguage: string;
  nativeLanguage: string;
  currentLevel: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      try {
        // Simulate checking for existing session
        const savedUser = localStorage.getItem('languagepeer_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate login API call
      const mockUser: User = {
        id: '1',
        name: 'Demo User',
        email,
        targetLanguage: 'English',
        nativeLanguage: 'Spanish',
        currentLevel: 'intermediate'
      };
      
      localStorage.setItem('languagepeer_user', JSON.stringify(mockUser));
      setUser(mockUser);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('languagepeer_user');
    setUser(null);
  };

  const register = async (userData: Partial<User>) => {
    setIsLoading(true);
    try {
      // Simulate registration API call
      const newUser: User = {
        id: Date.now().toString(),
        name: userData.name || 'New User',
        email: userData.email || '',
        targetLanguage: userData.targetLanguage || 'English',
        nativeLanguage: userData.nativeLanguage || 'Spanish',
        currentLevel: userData.currentLevel || 'beginner'
      };
      
      localStorage.setItem('languagepeer_user', JSON.stringify(newUser));
      setUser(newUser);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    register
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};