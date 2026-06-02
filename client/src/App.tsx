import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Login from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import WorkingPlace from "./pages/WorkingPlace";
import WaitingVerificationPage from './pages/WaitingVerificationPage';
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { Footer } from "./components/layout/Footer";
import { initTabsStore } from "./store/tabsStore";
import { useTabsStore } from './store/tabsStore';

const queryClient = new QueryClient();

// Защищённый маршрут с опциональной проверкой активации
function ProtectedRoute({ 
  children, 
  requireActive = true 
}: { 
  children: React.ReactNode; 
  requireActive?: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" />;
  // Проверяем, нужно ли требовать активации (для new_user роль new_user – это неактивированный)
  if (requireActive && user.role === "new_user") {
    return <Navigate to="/waiting-verification" />;
  }
  return children;
}

// Обёртка для рабочей области (без проверки на new_user, т.к. они сюда не попадут)
const WorkingPlaceWithWrapper = () => (
  <div className="min-h-screen flex flex-col">
    <div
      className="fixed inset-0 -z-10 animate-gradient"
      style={{
        background: "linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #f9ca24)",
        backgroundSize: "400% 400%",
      }}
    />
    <Header />
    <div className="flex flex-1">
      <Sidebar />
      <main className="flex-1 p-8 text-white">
        <WorkingPlace />
      </main>
    </div>
    <Footer />
  </div>
);

function App() {
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      useAuthStore.getState().fetchUser().finally(() => {
        const user = useAuthStore.getState().user;
        if (user && user.role !== 'new_user') {
          initTabsStore();
        } else {
          useTabsStore.setState({ isLoading: false });
        }
      });
    } else {
      useAuthStore.setState({ isLoading: false });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/user/tabs" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/waiting-verification" element={<WaitingVerificationPage />} />
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
          <Route path="*" element={<Navigate to="/user/tabs" />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;