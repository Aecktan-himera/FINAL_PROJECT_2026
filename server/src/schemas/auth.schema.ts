import { z } from 'zod';

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  username: z.string().min(3).max(50),
  firstName: z.string().optional(),
  surname: z.string().optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

