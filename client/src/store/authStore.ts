import { create } from "zustand";
import api from "../services/api";
import type { User } from "../types/index";
import type { RegisterInput } from "../schemas/register.schema";
import { useTabsStore, initTabsStore } from "./tabsStore";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  fetchUser: () => Promise<void>;
  fetchAllUsers: () => Promise<User[]>;
  updateUserRole: (userId: string, newRole: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<User>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem("accessToken"),
  isLoading: true,

  login: async (email, password) => {
  const res = await api.post("/auth/login", { email, password });
  const { accessToken } = res.data;          // user из ответа игнорируем
  localStorage.setItem("accessToken", accessToken);

  // Сразу получаем полный профиль
  const { data: fullUser } = await api.get("/user/profile");
  set({ user: fullUser, accessToken, isLoading: false });

  await initTabsStore();
},

  register: async (data) => {
    await api.post("/auth/register", data);
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.debug("Logout API error", error);
    } finally {
      localStorage.removeItem("accessToken");
      set({ user: null, accessToken: null });
      useTabsStore.getState().resetToDefault();
    }
  },

  setUser: (user) => set({ user }),

  fetchUser: async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      set({ user: null, accessToken: null, isLoading: false });
      return;
    }
    try {
      const { data } = await api.get("/user/profile");
      set({ user: data, isLoading: false });
      await initTabsStore();
    } catch (error) {
      console.error("Failed to fetch user", error);
      set({ user: null, accessToken: null, isLoading: false });
      localStorage.removeItem("accessToken");
    }
  },

  // Новый метод: получить всех пользователей (только для admin)
  fetchAllUsers: async () => {
    const { data } = await api.get("/admin/users");
    return data;
  },

  // Новый метод: сменить роль пользователя
  updateUserRole: async (userId: string, newRole: string) => {
    await api.patch(`/admin/users/${userId}/role`, { role: newRole });
  },

  updateProfile: async (profileData: Partial<User>) => {
    const { data } = await api.patch("/user/profile", profileData);
    set({ user: data });
    return data;
  },

}));
