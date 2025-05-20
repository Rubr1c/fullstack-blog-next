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
    id: comment.id,
    content: comment.content,
    authorId: comment.authorId.toString(),
    postId: comment.postId,
    createdAt: comment.createdAt,
  };
}
