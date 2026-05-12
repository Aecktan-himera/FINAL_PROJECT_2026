import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email({ message: 'Введите корректный email' }),
  password: z.string(),
});
export type LoginInput = z.infer<typeof loginSchema>;