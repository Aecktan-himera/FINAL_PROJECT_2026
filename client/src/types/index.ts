export interface User {
  id: string;
  username: string;
  email: string;
  role: 'new_user' | 'verified_user' | 'team_lead' | 'admin';
  firstName: string | null;
  surname: string | null;
  location: string | null;
  specialization?: string;
  skills?: string[];
  bio: string | null;
  isActive: boolean;
  settings: {
    darkMode: boolean;
    theme?: {
      preset?: string;
      colors?: {
        background: [string, string, string, string]; // 4 цвета фона страницы
        glass: [string, string, string];               // 3 цвета для LiquidGlass
        font: string;                                  // цвет шрифта
      };
    };
    customThemes?: {
      name: string;
      background: [string, string, string, string];
      glass: [string, string, string];
      font: string;
    }[];
  };
  createdAt: string;
  avatarUrl: string | null;
}