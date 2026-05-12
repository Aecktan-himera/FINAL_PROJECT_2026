import { create } from 'zustand';
import api from '../services/api';
import type { User } from '../types/index';
import type {RegisterInput} from '../schemas/register.schema'

interface AuthState {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken, user } = res.data;
    localStorage.setItem('accessToken', accessToken);
    set({ user, accessToken });
  },
  register: async (data) => {
    await api.post('/auth/register', data);
    // после успешной регистрации просто перенаправляем на логин
  },
  logout: () => {
    localStorage.removeItem('accessToken');
    set({ user: null, accessToken: null });
    // можно также вызвать эндпоинт /auth/logout для инвалидации refresh
  },
  setUser: (user) => set({ user }),
})); 