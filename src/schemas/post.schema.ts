import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string(),
  content: z.string(),
  authorId: z.string(),
  slug: z.string(),
});

export const updatePostSchema = z.object({
  title: z.string(),
  content: z.string(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
