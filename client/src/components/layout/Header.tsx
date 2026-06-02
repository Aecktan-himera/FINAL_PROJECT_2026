import { useTabsStore } from '../../store/tabsStore';
import { useAuthStore } from '../../store/authStore';
import { UserIcon, MoonIcon, ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import Logo from "../../assets/logo1.png";
import { LiquidGlass } from '../ui/LiquidGlass';
import { useNavigate, Link } from 'react-router-dom';

export const Header = () => {
  const addTab = useTabsStore((state) => state.addTab);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isNewUser = user?.role === 'new_user';

  const handleOpenProjects = () => {
    addTab({
      title: 'Список проектов',
      type: 'projects-list',
    });
  };

  const handleOpenCalendar = () => {
    addTab({
      title: 'Календарь',
      type: 'calendar',
    });
  };

  const handleOpenContacts = () => {
    addTab({
      title: 'Совещания в Zoom',
      type: 'contacts',
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <LiquidGlass
      as="header"
      className="sticky top-0 z-20 mx-4 p-4 h-20 flex items-center justify-between"
    >
      <div className="flex items-center gap-5">
        <img src={Logo} className="w-15 h-15" alt="logo" />
        <h1 className="text-blue-900 font-bold text-xl">Трекер задач</h1>
      </div>
      {!isNewUser && (
        <nav className="space-x-4 text-white/80">
          <button onClick={handleOpenProjects} className="hover:text-white transition">
            Проекты
          </button>
          <button onClick={handleOpenCalendar} className="hover:text-white transition">
            Календарь
          </button>
          <button onClick={handleOpenContacts} className="hover:text-white transition">
            Совещания в Zoom
          </button>
        </nav>
      )}
      <div className="flex items-center">
        <button className="p-2 rounded-full mr-3 bg-gray-100 hover:bg-gray-200 transition">
          <MoonIcon className="h-5 w-5 text-indigo-700" />
        </button>
        <div className="ml-4 relative flex items-center group">
          <button className="flex text-sm rounded-full focus:outline-none">
            <div className="h-8 w-8 rounded-full flex items-center justify-center bg-emerald-100">
              <UserIcon className="h-5 w-5 text-emerald-600" />
            </div>
          </button>
          <div className="origin-top-right absolute right-0 top-full mt-2 w-48 rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bg-white ring-1 ring-black ring-opacity-5 z-50">
            <div className="px-4 py-2 border-b border-gray-200">
              <p className="text-sm font-medium truncate">{user?.username || 'Гость'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
            </div>
            {/* Ссылка на профиль */}
            <Link
              to="/profile"
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <UserCircleIcon className="h-4 w-4 inline mr-2" />
              Профиль
            </Link>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 inline mr-2" />
              Выйти
            </button>
          </div>
        </div>
      </div>
    </LiquidGlass>
  );
};