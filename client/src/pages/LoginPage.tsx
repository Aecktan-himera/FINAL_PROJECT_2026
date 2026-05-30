import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "../store/authStore";
import { useNavigate, Link } from "react-router-dom";
import { authSchema } from "../schemas/auth.schema";
import type { LoginFormData } from "../schemas/auth.schema";
import { LiquidGlass } from "../components/ui/LiquidGlass";

// Безопасное извлечение сообщения из любой ошибки
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Проверяем, похожа ли ошибка на AxiosError (имеет isAxiosError и response)
    if ("isAxiosError" in error && "response" in error) {
      // Безопасное приведение через unknown
      const axiosError = error as unknown as {
        response: { data?: { message?: string } };
      };
      return axiosError.response.data?.message ?? error.message;
    }
    return error.message;
  }

  if (typeof error === "string") return error;
  return "Ошибка входа";
};




export default function Login() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(authSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    try {
      await login(data.email, data.password);
      navigate("/user/tabs");
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      setError(message);
    }
  };

  return (
    <div className="h-400px relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div
        className="fixed inset-0 -z-10 animate-gradient"
        style={{
          background:
            "linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #f9ca24)",
          backgroundSize: "400% 400%",
        }}
      />
      <LiquidGlass
        as="div"
        className="min-h-400px relative flex items-center justify-center"
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-sm space-y-4 p-6"
        >
          <h1 className="text-2xl font-bold text-blue-900">Вход</h1>
          {error && (
            <div className="rounded-md bg-red-100/80 p-3 text-sm text-red-800 backdrop-blur-sm">
              {error}
            </div>
          )}
          <div>
            <input
              {...register("email")}
              placeholder="Email"
              className="w-full rounded border border-white/30 bg-white/50 p-2 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <input
              type="password"
              {...register("password")}
              placeholder="Пароль"
              className="w-full rounded border border-white/30 bg-white/50 p-2 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 transition"
          >
            Войти
          </button>

          <p className="text-center text-sm text-gray-700">
            Нет аккаунта?{" "}
            <Link
              to="/register"
              className="text-blue-600 hover:underline font-medium"
            >
              Зарегистрироваться
            </Link>
          </p>
        </form>
      </LiquidGlass>
    </div>
  );
}
