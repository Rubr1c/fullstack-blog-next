import { prisma } from '@/lib/prisma';
import { type Media } from '@/generated/prisma';
import { type CreateMediaInput } from '@/schemas/media.schema';


export const createMedia = async (
  data: CreateMediaInput
): Promise<Media> => {
  return await prisma.media.create({
    data,
  });
};

export const getMediaById = async (id: string): Promise<Media | null> => {
  return await prisma.media.findUnique({ where: { id } });
};

export const getMediaByPostId = async (
  postId: string
): Promise<Media[]> => {
  return await prisma.media.findMany({
    where: { postId },
    orderBy: {
      position: 'asc',
    },
  });
};


