import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { buildApiUrl } from '@/utils/formatters';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  apiKey: string;
  subscription: {
    plan: 'free' | 'starter' | 'pro' | 'enterprise';
    status: 'active' | 'canceled' | 'past_due' | 'unpaid';
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd: boolean;
  };
  usage: {
    monthlyImages: number;
    monthlyBandwidth: number;
    lastResetDate: Date;
  };
  isAdmin: boolean;
  emailVerified: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hasRehydrated: boolean;
}

interface AuthActions {
  login: (userData: any, token: string) => void;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
  setRehydrated: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company?: string;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      hasRehydrated: false,

      // Actions
      login: (userData: any, token: string) => {
        set({
          user: userData,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await axios.post(buildApiUrl('/api/auth/register'), userData);
          
          const { user, token } = response.data.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Registration failed';
          set({ isLoading: false, error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      logout: () => {
        delete axios.defaults.headers.common['Authorization'];
        set({ user: null, token: null, isAuthenticated: false, isLoading: false, error: null });
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },

      clearError: () => { set({ error: null }); },

      checkAuth: async () => {
        const { token, isAuthenticated } = get();
        if (!token) {
          set({ isAuthenticated: false, isLoading: false });
          return;
        }
        set({ isLoading: true });
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await axios.get(buildApiUrl('/api/auth/me'));
          const { user } = response.data.data;
          set({ user, isAuthenticated: true, isLoading: false, error: null });
        } catch (error: any) {
          const status = error?.response?.status;
          if (status === 401 || status === 403) {
            delete axios.defaults.headers.common['Authorization'];
            set({ user: null, token: null, isAuthenticated: false, isLoading: false, error: null });
          } else {
            console.error('Auth check transient error:', error?.message || error);
            set({ isLoading: false, error: null, isAuthenticated });
          }
        }
      },

      // Mark rehydration as complete
      setRehydrated: () => set({ hasRehydrated: true }),
    }),
    {
      name: 'pixelsqueeze-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state, error) => {
        if (state?.token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        } else {
          delete axios.defaults.headers.common['Authorization'];
        }
        // Note: hasRehydrated will be set to true by the persist middleware automatically
        // We don't need to manually set it here to avoid React hook errors
      },
    }
  )
);

 