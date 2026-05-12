import { z } from "zod";

export const authSchema = z.object({
  email: z.email({ message: 'Введите корректный email' }),
  password: z.string().min(8, 'Пароль должен быть не менее 8 символов'),
});

export type LoginFormData = z.infer<typeof authSchema>;