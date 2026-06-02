export interface User {
  id: string;
  username: string;
  email: string;
  role: 'new_user' | 'verified_user' | 'team_lead' | 'admin';
  firstName: string | null;
  surname: string | null;
  location: string | null;
  bio: string | null;
  isActive: boolean;
  settings: {
    darkMode: boolean;
    
  };
  createdAt: string;
  avatarUrl: string | null;
}