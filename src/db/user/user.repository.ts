import { prisma } from '@/lib/prisma';

export const getUserByEmail = (email: string) =>
  prisma.user.findUnique({ where: { email } });
