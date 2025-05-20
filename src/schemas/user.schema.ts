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

export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const updateUserSchema = z
  .object({
    username: z
      .string()
      .min(3, { message: 'Username must be atleast 3 characters' })
      .max(16, { message: 'Username must bt at most 16 characters' }),
    password: z
      .string()
      .min(8, { message: 'Password must be atleast 8 characters' }),
    pfp: z.string().url({ message: 'pfp must be a valid URL' }),
  })
  .partial();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
