export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  settings: {
    darkMode: boolean;
    testTimer: number | null;
  };
  createdAt?: string;
}