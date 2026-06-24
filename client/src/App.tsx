import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Login from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import WorkingPlace from "./pages/WorkingPlace";
import WaitingVerificationPage from "./pages/WaitingVerificationPage";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { Footer } from "./components/layout/Footer";
import { useTabsStore } from "./store/tabsStore";

const queryClient = new QueryClient();

// ---------- Хук глобальной темы ----------
const useGlobalTheme = () => {
  const user = useAuthStore((s) => s.user);
  const theme = user?.settings?.theme;

  useEffect(() => {
    // Значения по умолчанию (Мята‑лаванда)
    const defaultBg = "linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #f9ca24)";
    const defaultFont = "#ffffff";
    const defaultGlass = ["#22d3ee", "#a855f7", "#f472b6"];

    if (theme?.colors) {
      const { background, glass, font } = theme.colors;

      // Фон: проверяем, что это массив из 4 элементов
      if (Array.isArray(background) && background.length === 4) {
        document.documentElement.style.setProperty(
          "--profile-bg",
          `linear-gradient(45deg, ${background.join(", ")})`
        );
      } else {
        document.documentElement.style.setProperty("--profile-bg", defaultBg);
      }

      // Стекло: проверяем, что это массив из 3 элементов
      if (Array.isArray(glass) && glass.length === 3) {
        document.documentElement.style.setProperty("--glass-1", glass[0]);
        document.documentElement.style.setProperty("--glass-2", glass[1]);
        document.documentElement.style.setProperty("--glass-3", glass[2]);
      } else {
        document.documentElement.style.setProperty("--glass-1", defaultGlass[0]);
        document.documentElement.style.setProperty("--glass-2", defaultGlass[1]);
        document.documentElement.style.setProperty("--glass-3", defaultGlass[2]);
      }

      // Шрифт
      if (typeof font === "string") {
        document.documentElement.style.setProperty("--profile-font", font);
      } else {
        document.documentElement.style.setProperty("--profile-font", defaultFont);
      }
    } else {
      // Полный fallback, если theme или colors отсутствуют
      document.documentElement.style.setProperty("--profile-bg", defaultBg);
      document.documentElement.style.setProperty("--profile-font", defaultFont);
      document.documentElement.style.setProperty("--glass-1", defaultGlass[0]);
      document.documentElement.style.setProperty("--glass-2", defaultGlass[1]);
      document.documentElement.style.setProperty("--glass-3", defaultGlass[2]);
    }
  }, [theme]);
};

// Защищённый маршрут (без изменений)
function ProtectedRoute({
  children,
  requireActive = true,
}: {
  children: React.ReactNode;
  requireActive?: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" />;
  if (requireActive && user.role === "new_user")
    return <Navigate to="/waiting-verification" />;
  return children;
}

// Обёртка рабочей области – использует CSS‑переменные темы
const WorkingPlaceWithWrapper = () => (
  <div
    className="min-h-screen flex flex-col"
    style={{
      background: "var(--profile-bg)",
      backgroundSize: "400% 400%",
      color: "var(--profile-font)",
    }}
  >
    <Header />
    <div className="flex flex-1">
      <Sidebar />
      <main className="flex-1 p-8">
        <WorkingPlace />
      </main>
    </div>
    <Footer />
  </div>
);

function App() {
  useGlobalTheme();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      useAuthStore.getState().fetchUser();
    } else {
      useAuthStore.setState({ isLoading: false });
      useTabsStore.getState().resetToDefault();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/user/tabs" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/waiting-verification"
            element={<WaitingVerificationPage />}
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute requireActive={false}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/tabs"
            element={
              <ProtectedRoute requireActive>
                <WorkingPlaceWithWrapper />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;