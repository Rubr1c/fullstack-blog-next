import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  content: z.string().min(1, { message: 'Content is required' }),
  published: z.boolean().optional(),
});

export const updatePostSchema = z.object({
  title: z.string(),
  content: z.string(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
