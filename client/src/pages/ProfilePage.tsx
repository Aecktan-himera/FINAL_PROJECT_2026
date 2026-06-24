import { useState, useEffect, useCallback } from "react";
import { useRef, ChangeEvent } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import type { User } from "../types/index";
import { LiquidGlass } from "../components/ui/LiquidGlass";
import {
  UserIcon,
  PencilIcon,
  PlusIcon,
  XMarkIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import api from "../services/api";
import axios from "axios";

type TabType = "general" | "settings" | "security";
type ThemeConfig = {
  background: [string, string, string, string];
  glass: [string, string, string];
  font: string;
};

//type PresetName = "mint-lavender" | "sunset" | "ocean" | "forest" | "dark-mint" | "midnight-ocean" |"dark-forest" | "dark-sunset"| "custom";

type CustomTheme = ThemeConfig & { name: string };
// ---------- Предустановленные темы ----------
const THEME_PRESETS = {
  "mint-lavender": {
    label: "Мята-лаванда",
    background: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24"] as [string, string, string, string],
    glass: ["#22d3ee", "#a855f7", "#f472b6"] as [string, string, string], // cyan-400, purple-500, pink-400
    font: "#ffffff",
  },
  sunset: {
    label: "Закат",
    background: ["#ff7e5f", "#feb47b", "#fceabb", "#ff9a9e"] as [string, string, string, string],
    glass: ["#fbbf24", "#f97316", "#ef4444"] as [string, string, string],   // amber-400, orange-500, red-500
    font: "#2d3436",
  },
  ocean: {
    label: "Океан",
    background: ["#2193b0", "#6dd5ed", "#ffffff", "#c2e9fb"] as [string, string, string, string],
    glass: ["#38bdf8", "#818cf8", "#c084fc"] as [string, string, string],   // sky-400, indigo-400, purple-400
    font: "#0a3d62",
  },
  forest: {
    label: "Лес",
    background: ["#11998e", "#38ef7d", "#d4fc79", "#96fbc4"] as [string, string, string, string],
    glass: ["#34d399", "#a3e635", "#facc15"] as [string, string, string],   // emerald-400, lime-400, yellow-400
    font: "#1e272e",
  },
  "dark-mint": {
    label: "Тёмная мята",
    background: ["#0f2027", "#203a43", "#2c5364", "#1d2b30"],
    glass: ["#22d3ee", "#a855f7", "#f472b6"],   // те же стеклянные цвета
    font: "#e0f2fe",
    isDark: true,
  },
  "dark-sunset": {
    label: "Последний Закат",
    background: ["#42221a", "#bd5b10", "#3c372b", "#f12314"] as [string, string, string, string],
    glass: ["#564210", "#542809", "#5b1717"] as [string, string, string],   // amber-400, orange-500, red-500
    font: "#ffffff",
    isDark: true,
  },

  "midnight-ocean": {
    label: "Полуночный океан",
    background: ["#0a192f", "#112240", "#1a3460", "#233554"],
    glass: ["#38bdf8", "#818cf8", "#c084fc"],
    font: "#ccd6f6",
    isDark: true,
  },
  "dark-forest": {
    label: "Тёмный лес",
    background: ["#0b4a45", "#0e7738", "#739e0d", "#39654d"] as [string, string, string, string],
    glass: ["#19523d", "#354b12", "#524309"] as [string, string, string],   
    font: "#addba3",
    isDark: true,
  },

} as const;

type PresetName = keyof typeof THEME_PRESETS | "custom";

// ======================== Вспомогательные функции ========================
function getColorBrightness(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// ======================== useProfileForm ========================
const useProfileForm = (user: User) => {
  const { updateProfile } = useAuthStore();

  // ---------- Общие поля ----------
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [surname, setSurname] = useState(user.surname || "");
  const [location, setLocation] = useState(user.location || "");
  const [specialization, setSpecialization] = useState(user.specialization || "");
  const [bio, setBio] = useState(user.bio || "");
  const [skills, setSkills] = useState<string[]>(user.skills || []);
  const [newSkill, setNewSkill] = useState("");
  const [showSkillInput, setShowSkillInput] = useState(false);

  // ---------- Настройки ----------
  const [darkMode, setDarkMode] = useState(user.settings?.darkMode || false);
  const [darkModeOverridden, setDarkModeOverridden] = useState(false);

  // ---------- Тема ----------
  const savedTheme = user.settings?.theme;
  const [themePreset, setThemePreset] = useState<PresetName>(
    (savedTheme?.preset as PresetName) || "mint-lavender"
  );
  const [backgroundColors, setBackgroundColors] = useState<[string, string, string, string]>(
    savedTheme?.colors?.background
      ? ([...savedTheme.colors.background] as [string, string, string, string])
      : ([...THEME_PRESETS["mint-lavender"].background] as [string, string, string, string])
  );
  const [glassColors, setGlassColors] = useState<[string, string, string]>(
    savedTheme?.colors?.glass
      ? ([...savedTheme.colors.glass] as [string, string, string])
      : ([...THEME_PRESETS["mint-lavender"].glass] as [string, string, string])
  );
  const [fontColor, setFontColor] = useState(
    savedTheme?.colors?.font || THEME_PRESETS["mint-lavender"].font
  );

  // Пользовательские темы
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>(user.settings?.customThemes || []);
  const [newThemeName, setNewThemeName] = useState("");

  // ---------- Обработчики цветов ----------
  const updateBackgroundColor = (idx: number, color: string) => {
    setBackgroundColors(prev => {
      const next = [...prev] as [string, string, string, string];
      next[idx] = color;
      return next;
    });
    setThemePreset("custom");
  };

  const updateGlassColor = (idx: number, color: string) => {
    setGlassColors(prev => {
      const next = [...prev] as [string, string, string];
      next[idx] = color;
      return next;
    });
    setThemePreset("custom");
  };

  const updateFontColor = (color: string) => {
    setFontColor(color);
    setThemePreset("custom");
  };

  // Выбор пресета
  const handlePresetChange = (preset: PresetName) => {
    if (preset === "custom") return;
    setThemePreset(preset);
    const cfg = THEME_PRESETS[preset];
    setBackgroundColors([...cfg.background] as [string, string, string, string]);
    setGlassColors([...cfg.glass] as [string, string, string]);
    setFontColor(cfg.font);

    if (!darkModeOverridden) {
      const brightness = getColorBrightness(cfg.background[0]);
      setDarkMode(brightness < 128);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
    setDarkModeOverridden(true);
  };

  // Живой предпросмотр – CSS-переменные
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--profile-bg",
      `linear-gradient(45deg, ${backgroundColors.join(", ")})`
    );
    document.documentElement.style.setProperty("--profile-font", fontColor);

    const [c1, c2, c3] = glassColors;
    const rgb1 = hexToRgb(c1);
    const rgb2 = hexToRgb(c2);
    const rgb3 = hexToRgb(c3);

    if (rgb1) document.documentElement.style.setProperty("--glass-from", `rgba(${rgb1.r},${rgb1.g},${rgb1.b},0.4)`);
    if (rgb2) document.documentElement.style.setProperty("--glass-via", `rgba(${rgb2.r},${rgb2.g},${rgb2.b},0.3)`);
    if (rgb3) document.documentElement.style.setProperty("--glass-to", `rgba(${rgb3.r},${rgb3.g},${rgb3.b},0.4)`);
  }, [backgroundColors, glassColors, fontColor]);

  // ---------- Управление кастомными темами ----------
  const handleSaveCustomTheme = useCallback(() => {
    const name = newThemeName.trim();
    if (!name) return alert("Введите название темы");
    if (customThemes.some(t => t.name === name)) return alert("Тема с таким названием уже существует");

    setCustomThemes(prev => [...prev, { name, background: backgroundColors, glass: glassColors, font: fontColor }]);
    setNewThemeName("");
  }, [newThemeName, backgroundColors, glassColors, fontColor, customThemes]);

  const handleApplyCustomTheme = useCallback((theme: CustomTheme) => {
    setBackgroundColors(theme.background);
    setGlassColors(theme.glass);
    setFontColor(theme.font);
    setThemePreset("custom");
  }, []);

  const handleDeleteCustomTheme = useCallback((name: string) => {
    setCustomThemes(prev => prev.filter(t => t.name !== name));
  }, []);

  // ---------- Сохранения ----------
  const handleSaveGeneral = useCallback(async () => {
    try {
      await updateProfile({ firstName, surname, location, bio, specialization, skills });
      alert("Данные сохранены");
    } catch (error) {
      console.error("Ошибка сохранения профиля", error);
      alert("Ошибка сохранения");
    }
  }, [firstName, surname, location, bio, specialization, skills, updateProfile]);

  const handleSaveSettings = useCallback(async () => {
    try {
      await updateProfile({
        settings: {
          darkMode,
          theme: {
            preset: themePreset,
            colors: {
              background: backgroundColors,
              glass: glassColors,
              font: fontColor,
            },
          },
          customThemes,
        },
      });
      alert("Настройки сохранены");
    } catch (error) {
      console.error("Ошибка сохранения настроек", error);
      alert("Ошибка сохранения");
    }
  }, [darkMode, themePreset, backgroundColors, glassColors, fontColor, customThemes, updateProfile]);

  // ---------- Пароль ----------
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleChangePassword = useCallback(async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError("Пароли не совпадают");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Пароль должен быть не менее 6 символов");
      return;
    }
    setPasswordError("");
    try {
      await api.post("/user/change-password", { oldPassword, newPassword });
      alert("Пароль успешно изменён");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setPasswordError(err.response?.data?.message || "Ошибка смены пароля");
      } else {
        setPasswordError("Неизвестная ошибка");
      }
    }
  }, [oldPassword, newPassword, confirmPassword]);

  // ---------- Навыки ----------
  const handleAddSkill = useCallback(() => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills(prev => [...prev, newSkill.trim()]);
      setNewSkill("");
      setShowSkillInput(false);
    }
  }, [newSkill, skills]);

  const handleRemoveSkill = useCallback((skill: string) => {
    setSkills(prev => prev.filter(s => s !== skill));
  }, []);

  // ---------- Возвращаемые значения ----------
  return {
    // общая информация
    firstName, setFirstName,
    surname, setSurname,
    location, setLocation,
    specialization, setSpecialization,
    bio, setBio,
    skills, newSkill, showSkillInput,
    setNewSkill, setShowSkillInput,
    handleAddSkill, handleRemoveSkill,
    handleSaveGeneral,

    // настройки
    darkMode, toggleDarkMode,
    themePreset, backgroundColors, glassColors, fontColor,
    updateBackgroundColor, updateGlassColor, updateFontColor,
    handlePresetChange,
    customThemes, newThemeName, setNewThemeName,
    handleSaveCustomTheme, handleApplyCustomTheme, handleDeleteCustomTheme,
    handleSaveSettings,

    // безопасность
    oldPassword, setOldPassword,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    passwordError,
    handleChangePassword,
  };
};

/* =========================== Контент страницы =========================== */
const ProfilePageContent = ({ user }: { user: User }) => {

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
const fileInputRef = useRef<HTMLInputElement>(null);

const handleAvatarClick = () => {
  fileInputRef.current?.click();
};

const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('avatar', file);

  setUploadingAvatar(true);
  try {
    const { data } = await api.post('/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // Обновляем локального пользователя в сторе
    const { user, setUser } = useAuthStore.getState();
    if (user) {
      setUser({ ...user, avatarUrl: data.avatarUrl });
    }
    // также можно обновить через updateProfile, но setUser быстрее
  } catch (error) {
    console.error('Failed to upload avatar', error);
    alert('Ошибка загрузки аватара');
  } finally {
    setUploadingAvatar(false);
    // сбросим input, чтобы можно было загрузить тот же файл повторно
    if (fileInputRef.current) fileInputRef.current.value = '';
  }
};

  const {
    firstName, setFirstName,
    surname, setSurname,
    location, setLocation,
    specialization, setSpecialization,
    bio, setBio,
    skills, newSkill, showSkillInput,
    setNewSkill, setShowSkillInput,
    handleAddSkill, handleRemoveSkill,
    handleSaveGeneral,

    darkMode, toggleDarkMode,
    themePreset, backgroundColors, glassColors, fontColor,
    updateBackgroundColor, updateGlassColor, updateFontColor,
    handlePresetChange,
    customThemes, newThemeName, setNewThemeName,
    handleSaveCustomTheme, handleApplyCustomTheme, handleDeleteCustomTheme,
    handleSaveSettings,

    oldPassword, setOldPassword,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    passwordError,
    handleChangePassword,
  } = useProfileForm(user);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "не указана";
    return new Date(dateString).toLocaleDateString("ru-RU");
  };

  const handleGoHome = () => {
    if (user.role === "new_user") navigate("/waiting-verification");
    else navigate("/user/tabs");
  };

  const bgStyle = {
    background: `linear-gradient(45deg, ${backgroundColors.join(", ")})`,
    backgroundSize: "400% 400%",
  };

  return (
    <div className="min-h-screen relative" style={{ color: fontColor }}>
      <div className="fixed inset-0 -z-10 animate-gradient" style={bgStyle} />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* ========== Верхняя секция ========== */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="relative">
  {user.avatarUrl ? (
    <img
      src={user.avatarUrl}
      alt="Avatar"
      className="w-32 h-32 rounded-full object-cover shadow-lg"
    />
  ) : (
    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
      <UserIcon className="h-16 w-16 text-white" />
    </div>
  )}
  <button
    onClick={handleAvatarClick}
    className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition"
    disabled={uploadingAvatar}
  >
    {uploadingAvatar ? (
      <div className="h-4 w-4 border-2 border-gray-700 border-t-transparent rounded-full animate-spin" />
    ) : (
      <PencilIcon className="h-4 w-4 text-gray-700" />
    )}
  </button>
  <input
    type="file"
    ref={fileInputRef}
    onChange={handleAvatarChange}
    accept="image/jpeg,image/png,image/gif,image/webp"
    className="hidden"
  />
</div>

          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold drop-shadow-md">
                {user.username} {firstName || user.firstName || ""} {surname || user.surname || ""}
              </h1>
              <button onClick={handleGoHome} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition">
                <HomeIcon className="h-5 w-5" /> На главную
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm opacity-70">Роль</p>
                <p className="font-medium">{user.role || "Новый пользователь"}</p>
              </div>
              <div>
                <p className="text-sm opacity-70">Дата регистрации</p>
                <p className="font-medium">{formatDate(user.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ========== Вкладки ========== */}
        <div className="mb-6 border-b border-white/20">
          <div className="flex gap-4">
            {(["general", "settings", "security"] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium transition ${
                  activeTab === tab ? "border-b-2 border-current" : "opacity-60 hover:opacity-100"
                }`}
              >
                {tab === "general" && "Общая информация"}
                {tab === "settings" && "Настройки профиля"}
                {tab === "security" && "Безопасность"}
              </button>
            ))}
          </div>
        </div>

        {/* ========== Контент вкладок ========== */}
        <LiquidGlass className="p-6">
          {/* ---------- Общая информация ---------- */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">Имя</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full rounded-lg border border-white/30 bg-white/10 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block font-medium mb-1">Фамилия</label>
                  <input type="text" value={surname} onChange={e => setSurname(e.target.value)} className="w-full rounded-lg border border-white/30 bg-white/10 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1">Местоположение</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full rounded-lg border border-white/30 bg-white/10 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block font-medium mb-1">Специализация</label>
                <input type="text" value={specialization} onChange={e => setSpecialization(e.target.value)} className="w-full rounded-lg border border-white/30 bg-white/10 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block font-medium mb-1">Навыки</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {skills.map(skill => (
                    <span key={skill} className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm">
                      {skill}
                      <button onClick={() => handleRemoveSkill(skill)} className="hover:text-red-300">
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                  {showSkillInput ? (
                    <div className="inline-flex items-center gap-1">
                      <input type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddSkill()} className="w-32 rounded-full bg-white/20 px-3 py-1 text-sm focus:outline-none" autoFocus />
                      <button onClick={handleAddSkill} className="hover:text-green-300"><PlusIcon className="h-5 w-5" /></button>
                    </div>
                  ) : (
                    <button onClick={() => setShowSkillInput(true)} className="inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-sm hover:bg-white/30">
                      <PlusIcon className="h-4 w-4" /> Добавить
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1">О себе</label>
                <textarea rows={4} value={bio} onChange={e => setBio(e.target.value)} className="w-full rounded-lg border border-white/30 bg-white/10 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <button onClick={handleSaveGeneral} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition">Сохранить изменения</button>
            </div>
          )}

          {/* ---------- Настройки ---------- */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              {/* Тёмная тема */}
              <div className="flex items-center justify-between">
                <span className="font-medium">Тёмная тема</span>
                <button onClick={toggleDarkMode} className="relative inline-flex h-6 w-11 items-center rounded-full transition bg-white/20">
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${darkMode ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>

              {/* Пресет */}
              <div>
                <label className="block font-medium mb-1">Тема оформления</label>
                <select
                  value={themePreset}
                  onChange={e => handlePresetChange(e.target.value as PresetName)}
                  className="w-full rounded-lg border border-white/30 bg-white/10 px-4 py-2 focus:outline-none"
                >
                  {Object.entries(THEME_PRESETS).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                  {themePreset === "custom" && <option value="custom" disabled>Своя тема</option>}
                </select>
              </div>

              {/* 4 цвета фона */}
              <div>
                <label className="block font-medium mb-1">Цвета фона (4)</label>
                <div className="grid grid-cols-4 gap-3">
                  {backgroundColors.map((color, idx) => (
                    <div key={idx}>
                      <input type="color" value={color} onChange={e => updateBackgroundColor(idx, e.target.value)} className="w-full h-10 rounded border border-white/30 bg-white/10" />
                      <p className="text-xs text-center mt-1">{color}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3 цвета стекла */}
              <div>
                <label className="block font-medium mb-1">Градиент стекла (3)</label>
                <div className="grid grid-cols-3 gap-3">
                  {glassColors.map((color, idx) => (
                    <div key={idx}>
                      <input type="color" value={color} onChange={e => updateGlassColor(idx, e.target.value)} className="w-full h-10 rounded border border-white/30 bg-white/10" />
                      <p className="text-xs text-center mt-1">{color}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs opacity-70 mt-1">Прозрачность фиксирована (40%/30%/40%)</p>
              </div>

              {/* Цвет шрифта */}
              <div>
                <label className="block font-medium mb-1">Цвет шрифта</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={fontColor} onChange={e => updateFontColor(e.target.value)} className="w-16 h-10 rounded border border-white/30 bg-white/10" />
                  <span className="text-sm">{fontColor}</span>
                </div>
              </div>

              {/* Сохранение кастомной темы */}
              <div>
                <label className="block font-medium mb-1">Сохранить текущую тему</label>
                <div className="flex gap-2">
                  <input type="text" value={newThemeName} onChange={e => setNewThemeName(e.target.value)} placeholder="Название темы" className="flex-1 rounded-lg border border-white/30 bg-white/10 px-4 py-2 focus:outline-none" />
                  <button onClick={handleSaveCustomTheme} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition">Сохранить</button>
                </div>
              </div>

              {/* Список сохранённых тем */}
              {customThemes.length > 0 && (
                <div>
                  <label className="block font-medium mb-2">Сохранённые темы</label>
                  <div className="space-y-2">
                    {customThemes.map(theme => (
                      <div key={theme.name} className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-2">
                        <div className="flex items-center gap-3">
                          <span>{theme.name}</span>
                          <div className="flex gap-1">
                            {theme.background.slice(0, 3).map((c, i) => (
                              <span key={i} className="w-4 h-4 rounded-full border border-white/30" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleApplyCustomTheme(theme)} className="text-sm px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded transition">Применить</button>
                          <button onClick={() => handleDeleteCustomTheme(theme.name)} className="text-sm px-2 py-1 bg-red-600 hover:bg-red-700 rounded transition">Удалить</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={handleSaveSettings} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition">Сохранить настройки</button>
            </div>
          )}

          {/* ---------- Безопасность ---------- */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <label className="block font-medium mb-1">Старый пароль</label>
                <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="w-full rounded-lg border border-white/30 bg-white/10 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block font-medium mb-1">Новый пароль</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full rounded-lg border border-white/30 bg-white/10 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block font-medium mb-1">Подтверждение пароля</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full rounded-lg border border-white/30 bg-white/10 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                {passwordError && <p className="text-red-300 text-sm mt-1">{passwordError}</p>}
              </div>
              <button onClick={handleChangePassword} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition">Сменить пароль</button>
            </div>
          )}
        </LiquidGlass>
      </div>
    </div>
  );
};

/* =========================== Обёртка =========================== */
const ProfilePage = () => {
  const { user } = useAuthStore();
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }
  return <ProfilePageContent key={user.id} user={user} />;
};

export default ProfilePage;