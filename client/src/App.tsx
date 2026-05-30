import { useEffect} from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Login from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import WorkingPlace from "./pages/WorkingPlace";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { Footer } from "./components/layout/Footer";
import { initTabsStore } from "./store/tabsStore";

// Создаём экземпляр QueryClient один раз вне компонента
const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" />;
  // Доп. проверка: если роль new_user и не активирован – можно тоже редиректить на страницу ожидания
  if (user.role === "new_user" && !user.isActive) {
    // Можно перенаправить на специальную страницу "Ожидание активации"
    return <Navigate to="/waiting-activation" />;
  }
  return children;
}

const WorkingPlaceWithWrapper = () => (
  <div className="min-h-screen">
    <div
      className="fixed inset-0 -z-10 animate-gradient"
      style={{
        background:
          "linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #f9ca24)",
        backgroundSize: "400% 400%",
      }}
    />
    <Header />
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8 text-white">
        <WorkingPlace />
      </main>
    </div>
    <Footer />
  </div>
);

function App() {
  const fetchUser = useAuthStore((s) => s.fetchUser);
  useEffect(() => {
    fetchUser();
    initTabsStore();
  }, [fetchUser]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/user/tabs" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/tabs"
            element={<WorkingPlaceWithWrapper />}
          />
          {/* Можно добавить страницу ожидания активации */}
          <Route
            path="/waiting-activation"
            element={
              <div className="p-8 text-center text-white">
                <h1>Аккаунт ожидает активации администратором</h1>
                <p>Вам придет уведомление на почту после активации.</p>
              </div>
            }
          />
          {/* Fallback 404 */}
          <Route path="*" element={<Navigate to="/user/tabs" />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;