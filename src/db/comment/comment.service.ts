import { HttpError, HttpStatus } from '@/lib/errors';
import { getCommentById, getCommentsByPostId } from './comment.repository';
import { prisma } from '@/lib/prisma';
import { type CommentDTO, createCommentDto } from '@/types/comment.types';
import type {
  CreateCommentInput,
  UpdateCommentInput,
} from '@/schemas/comment.schema';

export async function createCommentForPost(
  input: CreateCommentInput,
  userId: bigint
): Promise<CommentDTO> {
  const comment = await prisma.comment.create({
    data: { ...input, authorId: userId },
  });
  return createCommentDto(comment);
}

export async function fetchCommentById(id: string): Promise<CommentDTO> {
  const comment = await getCommentById(id);
  if (!comment) {
    throw new HttpError(
      `Comment with id ${id} not found`,
      HttpStatus.NOT_FOUND
    );
  }
  return createCommentDto(comment);
}

export async function fetchCommentsByPost(
  postId: string,
  page: number,
  pageSize: number
): Promise<CommentDTO[]> {
  const comments = await getCommentsByPostId(postId, page, pageSize);
  return comments.map(createCommentDto);
}

export async function updateExistingComment(
  commentId: string,
  input: UpdateCommentInput,
  userId: bigint
): Promise<CommentDTO> {
  const existingComment = await getCommentById(commentId);

  if (!existingComment) {
    throw new HttpError(
      `Comment with id ${commentId} not found`,
      HttpStatus.NOT_FOUND
    );
  }

  if (existingComment.authorId !== userId) {
    throw new HttpError(
      'User is not authorized to update this comment',
      HttpStatus.UNAUTHORIZED
    );
  }

  const updatedComment = await prisma.comment.update({
    where: { id: commentId },
    data: input,
  });
  return createCommentDto(updatedComment);
}

export async function removeComment(
  commentId: string,
  userId: bigint
): Promise<CommentDTO> {
  const existingComment = await getCommentById(commentId);

  if (!existingComment) {
    throw new HttpError(
      `Comment with id ${commentId} not found`,
      HttpStatus.NOT_FOUND
    );
  }

  if (existingComment.authorId !== userId) {
    throw new HttpError(
      'User is not authorized to delete this comment',
      HttpStatus.UNAUTHORIZED
    );
  }

  const deletedComment = await prisma.comment.delete({
    where: { id: commentId },
  });
  return createCommentDto(deletedComment);
}
