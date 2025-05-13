import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3, { message: 'Username must be atleast 3 characters' })
    .max(16, { message: 'Username must bt at most 16 characters' }),
  password: z
    .string()
    .min(8, { message: 'Password must be atleast 8 characters' }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
