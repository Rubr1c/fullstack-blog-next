import { z } from 'zod';

export const CreateMediaSchema = z.object({
  url: z.string().url('Invalid URL format'),
  postId: z.string().cuid('Invalid post ID format'),
  caption: z.string().optional(),
  position: z.number().int().min(0, 'Position must be a non-negative integer'),
});

export const UpdateMediaSchema = z.object({
  url: z.string().url('Invalid URL format').optional(),
  caption: z.string().optional().nullable(),
  position: z
    .number()
    .int()
    .min(0, 'Position must be a non-negative integer')
    .optional(),
});

export type CreateMediaInput = z.infer<typeof CreateMediaSchema>;
export type UpdateMediaInput = z.infer<typeof UpdateMediaSchema>;
