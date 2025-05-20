import { type Comment } from '@/generated/prisma';

export interface CommentDTO {
  id: string;
  content: string;
  authorId: string;
  postId: string;
  createdAt: Date;
}

export function createCommentDto(comment: Comment): CommentDTO {
  return {
    ...comment,
    authorId: comment.authorId.toString(),
  };
}
