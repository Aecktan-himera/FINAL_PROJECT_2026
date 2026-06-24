import { create } from "zustand";
import api from "../services/api";
import { useAuthStore } from "./authStore";

export type TabType =
  | "projects-list"
  | "project-detail"
  | "users-list"
  | "teams-list"
  | "calendar"
  | "project-form"
  | "contacts"
  | "kanban-board"      // новый тип
  | "admin-users";      // новый тип


export type TabData =
  | { projectId: string }
  | { userId?: string }
  | { projectId: string; boardId?: string }  // для kanban-board
  | Record<string, unknown>;

export interface Tab {
  id: string;
  title: string;
  type: TabType;
  data?: TabData;
}

interface TabsState {
  tabs: Tab[];
  activeTabId: string | null;
  isLoading: boolean;
  addTab: (tab: Omit<Tab, "id">) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  loadFromServer: () => Promise<void>;
  saveToServer: (tabs: Tab[], activeId: string | null) => Promise<void>;
  resetToDefault: () => void;
  updateTabData: (tabId: string, data: TabData) => void;
}

// Исправленный debounce с корректной типизацией
function debounce<F extends (...args: Parameters<F>) => ReturnType<F>>(
  fn: F,
  delay: number,
): (...args: Parameters<F>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<F>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const createDefaultTab = (): Omit<Tab, "id"> => ({
  title: "Список проектов",
  type: "projects-list",
});

const getDefaultState = () => {
  const defaultTab = createDefaultTab();
  const id = `${defaultTab.type}-${Date.now()}-${Math.random()}`;
  return {
    tabs: [{ ...defaultTab, id }],
    activeTabId: id,
  };
};

export const useTabsStore = create<TabsState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  isLoading: true,

  addTab: (tab) => {
    const id = `${tab.type}-${Date.now()}-${Math.random()}`;
    set((state) => ({
      tabs: [...state.tabs, { ...tab, id }],
      activeTabId: id,
    }));
  },

  closeTab: (tabId) => {
    set((state) => {
      const index = state.tabs.findIndex((t) => t.id === tabId);
      const newTabs = state.tabs.filter((t) => t.id !== tabId);
      let newActiveId = state.activeTabId;
      if (state.activeTabId === tabId) {
        if (newTabs.length > 0) {
          newActiveId = newTabs[Math.min(index, newTabs.length - 1)].id;
        } else {
          newActiveId = null;
        }
      }
      return { tabs: newTabs, activeTabId: newActiveId };
    });
  },

  setActiveTab: (tabId) => {
    set({ activeTabId: tabId });
  },


  resetToDefault: () => {
    const defaultState = getDefaultState();
    set({ ...defaultState, isLoading: false });
  },

  loadFromServer: async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      get().resetToDefault();
      return;
    }


    
    //  Защита для new_user
    const user = useAuthStore.getState().user;
    if (user?.role === "new_user") {
      get().resetToDefault();
      set({ isLoading: false });
      return;
    }

    try {
      const { data } = await api.get("/user/tabs");
      const { tabs, activeId } = data;
      if (tabs && Array.isArray(tabs) && tabs.length > 0) {
        set({ tabs, activeTabId: activeId, isLoading: false });
      } else {
        get().resetToDefault();
      }
    } catch (error) {
      console.error("Failed to load tabs", error);
      get().resetToDefault();
    }
  },

updateTabData: (tabId, data) => {
  set((state) => ({
    tabs: state.tabs.map(tab =>
      tab.id === tabId ? { ...tab, data: { ...tab.data, ...data } } : tab
    ),
  }));
},

  saveToServer: async (tabs, activeId) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

     //  Защита для new_user
    const user = useAuthStore.getState().user;
    if (user?.role === 'new_user') return;

    try {
      await api.post("/user/tabs", { tabs, activeId });
    } catch (error) {
      console.debug("Failed to save tabs (non-critical)", error);
    }
  },
}));

const debouncedSave = debounce((tabs: Tab[], activeId: string | null) => {
  useTabsStore.getState().saveToServer(tabs, activeId);
}, 1000);

useTabsStore.subscribe((state) => {
  if (!state.isLoading) {
    debouncedSave(state.tabs, state.activeTabId);
  }
});

export const initTabsStore = () => {
  useTabsStore.getState().loadFromServer();
};

export const reloadTabs = () => {
  useTabsStore.getState().loadFromServer();
};
