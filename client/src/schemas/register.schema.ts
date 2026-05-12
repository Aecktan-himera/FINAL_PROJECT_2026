import { z } from 'zod';

export const registerSchema = z.object({
  email: z.email({ message: 'Введите корректный email' }),
  password: z.string().min(8, 'Пароль должен быть не менее 8 символов'),
  username: z.string().min(3, 'Минимум 3 символа').max(50, 'Максимум 50 символов'),
  firstName: z.string().optional(),
  surname: z.string().optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;