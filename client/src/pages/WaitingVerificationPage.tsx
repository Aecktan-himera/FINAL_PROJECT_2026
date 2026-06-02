import { Link, useNavigate } from 'react-router-dom';
import { LiquidGlass } from '../components/ui/LiquidGlass';
import { useAuthStore } from '../store/authStore';

export default function WaitingVerificationPage() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <div
        className="fixed inset-0 -z-10 animate-gradient"
        style={{
          background: "linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #f9ca24)",
          backgroundSize: "400% 400%",
        }}
      />
      <LiquidGlass className="max-w-md p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">
          Аккаунт ожидает активации администратором
        </h1>
        <p className="text-white/80 mb-6">
          Вам придёт уведомление на почту после активации.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/profile"
            className="inline-block px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition"
          >
            Перейти в профиль
          </Link>
          <button
            onClick={handleLogout}
            className="inline-block px-4 py-2 bg-red-500/50 hover:bg-red-600/70 rounded-lg text-white transition"
          >
            Выйти
          </button>
        </div>
      </LiquidGlass>
    </div>
  );
}