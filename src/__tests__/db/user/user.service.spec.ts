import { prisma } from '@/lib/prisma';
import type { PrismaClient } from '@prisma/client';
import { DeepMockProxy } from 'jest-mock-extended';
import bcrypt from 'bcrypt';
import { registerUser } from '@/db/user/user.service';
import { CreateUserInput } from '@/schemas/user.schema';
import { getUserByEmail } from '@/db/user/user.repository';
import { UserDTO } from '@/types/user';

jest.mock('@/db/user/user.repository', () => ({
  getUserByEmail: jest.fn(),
}));

jest.mock('@/lib/prisma');

const prismaMock = prisma as DeepMockProxy<PrismaClient>;
const bcryptHashSpy = jest.spyOn(bcrypt, 'hash') as jest.Mock;
const mockedGetUserByEmail = getUserByEmail as jest.Mock;

describe('registerUser service', () => {
  beforeAll(() => {
    // Initialization is done at module scope
  });

  beforeEach(() => {
    jest.clearAllMocks();
    bcryptHashSpy.mockClear();
    mockedGetUserByEmail.mockClear();
  });

  it('throws if a user with the email already exists', async () => {
    mockedGetUserByEmail.mockResolvedValue({
      id: '1',
      email: 'existing@example.com',
      username: 'existing',
    });

    const input: CreateUserInput = {
      email: 'existing@example.com',
      username: 'newuser',
      password: 'password123',
    };

    await expect(registerUser(input)).rejects.toThrow(
      'User with email already exists'
    );

    expect(mockedGetUserByEmail).toHaveBeenCalledWith(input.email);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('creates and returns a new user when email is unused', async () => {
    mockedGetUserByEmail.mockResolvedValue(null);
    bcryptHashSpy.mockResolvedValue('hashed-pwd');

    const prismaCreateResponse = {
      id: BigInt(2),
      email: 'new@example.com',
      username: 'newuser',
      password: 'hashed-pwd',
      pfp: null,
      createdAt: new Date('2025-05-13'),
    };
    prismaMock.user.create.mockResolvedValue(prismaCreateResponse);

    const input: CreateUserInput = {
      email: 'new@example.com',
      username: 'newuser',
      password: 'password123',
    };

    const result = await registerUser(input);

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        email: 'new@example.com',
        username: input.username,
        password: 'hashed-pwd',
      },
    });

    expect(mockedGetUserByEmail).toHaveBeenCalledWith(input.email);
    expect(bcryptHashSpy).toHaveBeenCalledWith(input.password, 10);

    expect(result).toEqual<UserDTO>({
      id: '2',
      email: 'new@example.com',
      username: 'newuser',
    });
  });
});
