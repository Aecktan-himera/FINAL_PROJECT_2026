import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { registerSchema } from '../schemas/register.schema';
import type { RegisterInput } from '../schemas/register.schema';
import { LiquidGlass } from '../components/ui/LiquidGlass';

function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message ?? 'Ошибка регистрации';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Неизвестная ошибка регистрации';
}

export default function RegisterPage() {
  const { register: registerUser } = useAuthStore();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    setIsLoading(true);
    try {
      await registerUser(data);
      navigate('/login', { state: { message: 'Регистрация успешна. Ожидайте активации.' } });
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div
        className="fixed inset-0 -z-10 animate-gradient"
        style={{
          background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #f9ca24)',
          backgroundSize: '400% 400%',
        }}
      />
      <LiquidGlass as="div" className="w-full max-w-md space-y-8 p-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-blue-900">Создать аккаунт</h2>
          <p className="mt-2 text-sm text-gray-700">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:underline">
              Войти
            </Link>
          </p>
        </div>

        {serverError && (
          <div className="rounded-md bg-red-100/80 p-4 text-sm text-red-800 backdrop-blur-sm">
            {serverError}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-800">
              Имя пользователя
            </label>
            <input
              {...register('username')}
              id="username"
              type="text"
              autoComplete="username"
              className="mt-1 block w-full rounded border border-white/30 bg-white/50 px-3 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.username && (
              <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-800">
              Email
            </label>
            <input
              {...register('email')}
              id="email"
              type="email"
              autoComplete="email"
              className="mt-1 block w-full rounded border border-white/30 bg-white/50 px-3 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-800">
              Пароль
            </label>
            <input
              {...register('password')}
              id="password"
              type="password"
              autoComplete="new-password"
              className="mt-1 block w-full rounded border border-white/30 bg-white/50 px-3 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-800">
              Имя (необязательно)
            </label>
            <input
              {...register('firstName')}
              id="firstName"
              type="text"
              className="mt-1 block w-full rounded border border-white/30 bg-white/50 px-3 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="surname" className="block text-sm font-medium text-gray-800">
              Фамилия (необязательно)
            </label>
            <input
              {...register('surname')}
              id="surname"
              type="text"
              className="mt-1 block w-full rounded border border-white/30 bg-white/50 px-3 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
      </LiquidGlass>
    </div>
  );
}