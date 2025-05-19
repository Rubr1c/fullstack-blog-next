import { jest } from '@jest/globals';
import type { PrismaClient } from '@prisma/client';
import { DeepMockProxy } from 'jest-mock-extended';

type UserRecord = {
  id: bigint;
  email: string;
  username: string;
  password: string;
  pfp?: string | null;
  createdAt: Date;
};

let users: UserRecord[] = [];
let idCounter = 1;

export const prisma = {
  user: {
    findUnique: jest.fn(
      async ({ where: { email } }: { where: { email: string } }) => {
        const user = users.find((u) => u.email === email);
        return user ? { ...user } : null;
      }
    ),
    create: jest.fn(
      async ({
        data,
      }: {
        data: { email: string; username: string; password: string };
      }) => {
        const newUser: UserRecord = {
          id: BigInt(idCounter++),
          email: data.email,
          username: data.username,
          password: data.password,
          pfp: null,
          createdAt: new Date(),
        };
        users.push(newUser);
        return { ...newUser };
      }
    ),
    deleteMany: jest.fn(async () => {
      users = [];
      return { count: 0 };
    }),
    count: jest.fn(async () => users.length),
  },
  $disconnect: jest.fn(async () => {}),
} as unknown as DeepMockProxy<PrismaClient>;

export type PrismaMock = DeepMockProxy<PrismaClient>;
