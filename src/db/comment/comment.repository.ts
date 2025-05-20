import { prisma } from '@/lib/prisma';
import { type Comment } from '@/generated/prisma';

export const getCommentById = async (
  id: string
): Promise<Comment | null> => {
  return await prisma.comment.findUnique({ where: { id } });
};

export const getCommentsByPostId = async (
  postId: string,
  page: number,
  pageSize: number
): Promise<Comment[]> => {
  const skip = (page - 1) * pageSize;
  return await prisma.comment.findMany({
    where: { postId },
    skip,
    take: pageSize,
    orderBy: {
      createdAt: 'asc',
    },
  });
};
