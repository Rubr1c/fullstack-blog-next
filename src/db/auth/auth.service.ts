import { CreateUserInput, LoginUserInput } from '@/schemas/user.schema';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { getUserByEmail, getUserById } from '../user/user.repository';
import type { AuthenticatedUserDTO, UserDTO } from '@/types/user.types';
import { generateToken, verifyToken } from '@/lib/jwts';
import { HttpError, HttpStatus } from '@/lib/errors';
import { User } from '@/generated/prisma';

export async function registerUser(data: CreateUserInput): Promise<UserDTO> {
  if (await getUserByEmail(data.email)) {
    throw new HttpError('User with email already exists', HttpStatus.CONFLICT);
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      password: hashedPassword,
    },
  });

  return {
    id: user.id.toString(),
    email: user.email,
    username: user.username,
  };
}

export async function authenticateUser(
  data: LoginUserInput
): Promise<AuthenticatedUserDTO> {
  const user = await getUserByEmail(data.email);
  if (!user) {
    throw new HttpError('User with email not found', HttpStatus.NOT_FOUND);
  }
  const isPasswordValid = await bcrypt.compare(data.password, user.password);
  if (!isPasswordValid) {
    throw new HttpError('Invalid password', HttpStatus.UNAUTHORIZED);
  }

  const expiresIn = process.env.NODE_ENV === 'production' ? '1h' : '1d';

  const token = generateToken({ userId: user.id.toString() }, expiresIn);

  return {
    token,
    expiresIn: expiresIn,
  };
}

export async function getUserFromToken(token: string): Promise<User> {
  const { userId } = verifyToken(token);
  const user = await getUserById(BigInt(userId));
  if (!user) throw new HttpError('User not found', HttpStatus.NOT_FOUND);
  return user;
}
