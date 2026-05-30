import { create } from 'zustand';
import api from '../services/api';
import type { User } from '../types/index';
import type { RegisterInput } from '../schemas/register.schema';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean; // добавим для индикации загрузки
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  isLoading: true,
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken, user } = res.data;
    localStorage.setItem('accessToken', accessToken);
    set({ user, accessToken });
  },
  register: async (data) => {
    await api.post('/auth/register', data);
  },
  logout: () => {
    localStorage.removeItem('accessToken');
    set({ user: null, accessToken: null });
  },
  setUser: (user) => set({ user }),
  fetchUser: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch user', error);
      set({ user: null, accessToken: null, isLoading: false });
      localStorage.removeItem('accessToken');
    }
  },
}));