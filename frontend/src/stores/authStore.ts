import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  role: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: null,
      
      login: async (email: string, password: string) => {
        try {
          set({ loading: true, error: null });
          
          const response = await api.post('/api/auth/login', {
            email,
            password
          });
          
          if (response.data.success) {
            const { user, token } = response.data.data;
            
            // Set token in axios defaults for all future requests
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            set({
              isAuthenticated: true,
              user,
              token,
              loading: false
            });
          } else {
            set({
              loading: false,
              error: response.data.error?.message || 'Login failed'
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.response?.data?.error?.message || error.message || 'Login failed'
          });
        }
      },
      
      register: async (userData: RegisterData) => {
        try {
          set({ loading: true, error: null });
          
          const response = await api.post('/api/auth/register', userData);
          
          if (response.data.success) {
            set({ loading: false });
            return;
          } else {
            set({
              loading: false,
              error: response.data.error?.message || 'Registration failed'
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.response?.data?.error?.message || error.message || 'Registration failed'
          });
        }
      },
      
      logout: () => {
        // Remove token from axios defaults
        delete api.defaults.headers.common['Authorization'];
        
        set({
          isAuthenticated: false,
          user: null,
          token: null
        });
      },
      
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token
      })
    }
  )
); 