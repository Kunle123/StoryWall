import { create, StateCreator } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';
import { axiosInstance } from '../api/axios';

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl?: string;
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
  name: string;
  username: string;
  email: string;
  password: string;
}

type AuthPersist = (
  config: StateCreator<AuthState>,
  options: PersistOptions<AuthState, Pick<AuthState, 'isAuthenticated' | 'user' | 'token'>>
) => StateCreator<AuthState>;

export const useAuthStore = create<AuthState>()(
  (persist as AuthPersist)(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: null,
      
      login: async (email: string, password: string) => {
        try {
          set({ loading: true, error: null });
          
          // For development, simulate login if API isn't ready
          let response;
          try {
            response = await axiosInstance.post('/api/auth/login', {
              email,
              password
            });
            
            const { token, user } = response.data;
            
            // Set token in axios defaults for all future requests
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            set({
              isAuthenticated: true,
              user,
              token,
              loading: false
            });
          } catch (error) {
            console.log('API not available, simulating login');
            
            // Mock successful login for development
            if (email === 'user@example.com' && password === 'password') {
              const mockUser = {
                id: 'user-123',
                name: 'Test User',
                username: 'testuser',
                email: 'user@example.com',
                avatarUrl: 'https://via.placeholder.com/150'
              };
              
              const mockToken = 'mock-token-for-development';
              
              // Set token in axios defaults
              axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
              
              set({
                isAuthenticated: true,
                user: mockUser,
                token: mockToken,
                loading: false
              });
            } else {
              set({
                loading: false,
                error: 'Invalid email or password'
              });
            }
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.response?.data?.message || error.message || 'Login failed'
          });
        }
      },
      
      register: async (userData: RegisterData) => {
        try {
          set({ loading: true, error: null });
          
          // For development, simulate registration if API isn't ready
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const _response = await axiosInstance.post('/api/auth/register', userData);
          set({ loading: false });
        } catch (error: any) {
          set({
            loading: false,
            error: error.response?.data?.message || error.message || 'Registration failed'
          });
        }
      },
      
      logout: () => {
        // Remove token from axios defaults
        delete axiosInstance.defaults.headers.common['Authorization'];
        
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
      partialize: (state: AuthState) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token
      })
    }
  )
); 