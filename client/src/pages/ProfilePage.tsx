import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { LiquidGlass } from '../components/ui/LiquidGlass';
//import type { User } from "../types/index"
import {
  UserIcon,
  PencilIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'; //SunIcon, MoonIcon,vKeyIcon,

type TabType = 'general' | 'settings' | 'security';

const ProfilePage = () => {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [skills, setSkills] = useState<string[]>(['C#', 'Python', 'React', 'TypeScript']);
  const [newSkill, setNewSkill] = useState('');
  const [showSkillInput, setShowSkillInput] = useState(false);
  
  // Состояния для общей информации
  const [location, setLocation] = useState('Москва, Россия');
  const [specialization, setSpecialization] = useState('Fullstack разработчик');
  const [bio, setBio] = useState('Люблю создавать красивые интерфейсы и решать сложные задачи.');
  
  // Состояния для настроек
  const [darkMode, setDarkMode] = useState(user?.settings?.darkMode || false);
  const [bgColor, setBgColor] = useState('#4ecdc4');
  const [stylePreset, setStylePreset] = useState('glass');
  
  // Состояния для смены пароля
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Эффект для применения темы (простая демонстрация)
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
      setShowSkillInput(false);
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleSaveGeneral = () => {
    // Здесь можно отправить данные на сервер
    console.log({ location, specialization, bio, skills });
  };

  const handleSaveSettings = () => {
    // Обновляем настройки пользователя
    if (user) {
      setUser({
        ...user,
        settings: { ...user.settings, darkMode },
      });
    }
    // Здесь также можно сохранить bgColor, stylePreset в localStorage или на сервер
    localStorage.setItem('profile_settings', JSON.stringify({ bgColor, stylePreset }));
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('Пароли не совпадают');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Пароль должен быть не менее 6 символов');
      return;
    }
    setPasswordError('');
    // Отправка запроса на смену пароля (заглушка)
    console.log({ oldPassword, newPassword });
    // Очистить поля
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    alert('Пароль успешно изменён');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'не указана';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  return (
    <div className="min-h-screen relative">
      {/* Анимированный фон */}
      <div
        className="fixed inset-0 -z-10 animate-gradient"
        style={{
          background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #f9ca24)',
          backgroundSize: '400% 400%',
        }}
      />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Верхняя секция: аватар + заголовок */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Аватар */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <UserIcon className="h-16 w-16 text-white" />
            </div>
            <button
              onClick={() => setIsEditingAvatar(!isEditingAvatar)}
              className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition"
            >
              <PencilIcon className="h-4 w-4 text-gray-700" />
            </button>
          </div>
          
          {/* Заголовок */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white drop-shadow-md">
              {user?.username || 'Пользователь'} {user?.firstName || ''} {user?.surname || ''}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-white/70">Роль</p>
                <p className="text-white font-medium">{user?.role || 'Новый пользователь'}</p>
              </div>
              <div>
                <p className="text-sm text-white/70">Дата регистрации</p>
                <p className="text-white font-medium">{formatDate(user?.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Вкладки */}
        <div className="mb-6 border-b border-white/20">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'general'
                  ? 'text-white border-b-2 border-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Общая информация
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'settings'
                  ? 'text-white border-b-2 border-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Настройки профиля
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'security'
                  ? 'text-white border-b-2 border-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Безопасность
            </button>
          </div>
        </div>

        {/* Контент вкладок */}
        <LiquidGlass className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-1">Местоположение</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-lg border border-white/30 bg-white/10 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-1">Специализация</label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full rounded-lg border border-white/30 bg-white/10 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-1">Навыки</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm text-white"
                    >
                      {skill}
                      <button onClick={() => handleRemoveSkill(skill)} className="hover:text-red-300">
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                  {showSkillInput ? (
                    <div className="inline-flex items-center gap-1">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                        className="w-32 rounded-full bg-white/20 text-white px-3 py-1 text-sm focus:outline-none"
                        autoFocus
                      />
                      <button onClick={handleAddSkill} className="text-white hover:text-green-300">
                        <PlusIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowSkillInput(true)}
                      className="inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-sm text-white hover:bg-white/30"
                    >
                      <PlusIcon className="h-4 w-4" /> Добавить
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-white font-medium mb-1">О себе</label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full rounded-lg border border-white/30 bg-white/10 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <button
                onClick={handleSaveGeneral}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition"
              >
                Сохранить изменения
              </button>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">Тёмная тема</span>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition bg-white/20"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      darkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div>
                <label className="block text-white font-medium mb-1">Цвет фона (акцент)</label>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-full h-10 rounded border border-white/30 bg-white/10"
                />
                <p className="text-xs text-white/50 mt-1">Выберите основной цвет для элементов интерфейса</p>
              </div>
              <div>
                <label className="block text-white font-medium mb-1">Стиль оформления</label>
                <select
                  value={stylePreset}
                  onChange={(e) => setStylePreset(e.target.value)}
                  className="w-full rounded-lg border border-white/30 bg-white/10 text-white px-4 py-2 focus:outline-none"
                >
                  <option value="glass">Стекло (Liquid Glass)</option>
                  <option value="minimal">Минимализм</option>
                  <option value="vibrant">Яркий</option>
                </select>
              </div>
              <button
                onClick={handleSaveSettings}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition"
              >
                Сохранить настройки
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-1">Старый пароль</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/30 bg-white/10 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-1">Новый пароль</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/30 bg-white/10 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-1">Подтверждение пароля</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/30 bg-white/10 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {passwordError && <p className="text-red-300 text-sm mt-1">{passwordError}</p>}
              </div>
              <button
                onClick={handleChangePassword}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition"
              >
                Сменить пароль
              </button>
            </div>
          )}
        </LiquidGlass>
      </div>
    </div>
  );
};

export default ProfilePage;