export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  surname?: string;
  location?: string;
  bio?: string;
  isActive: boolean;
  settings: {
    darkMode: boolean;
    testTimer: number | null;
  };
  createdAt?: string;
  avatarUrl?: string;
}