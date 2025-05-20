import { Post } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';

export const getPostById = async (id: string): Promise<Post | null> => {
  return await prisma.post.findUnique({ where: { id } });
};

export const getPostBySlug = async (slug: string): Promise<Post | null> => {
  return await prisma.post.findUnique({ where: { slug } });
};

export const getPostsPaged = async (
  page: number,
  pageSize: number
): Promise<Post[]> => {
  const skip = (page - 1) * pageSize;
  return await prisma.post.findMany({
    skip,
    take: pageSize,
    orderBy: {
      createdAt: 'desc',
    },
  });
};
