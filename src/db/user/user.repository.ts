import { prisma } from '@/lib/prisma';

export const getUserByEmail = (email: string) =>
  prisma.user.findUnique({ where: { email } });

export const getUserById = (id: bigint) =>
  prisma.user.findUnique({ where: { id } });
