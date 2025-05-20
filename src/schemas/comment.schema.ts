import { z } from 'zod';

export const CreateCommentSchema = z.object({
  content: z.string().min(1, 'Comment content cannot be empty'),
  postId: z.string().cuid('Invalid post ID format'),
});

export const UpdateCommentSchema = z.object({
  content: z.string().min(1, 'Comment content cannot be empty').optional(),
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
export type UpdateCommentInput = z.infer<typeof UpdateCommentSchema>;
