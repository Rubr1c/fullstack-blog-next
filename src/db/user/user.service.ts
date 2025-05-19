import { CreateUserInput, LoginUserInput } from '@/schemas/user.schema';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { getUserByEmail } from './user.repository';
import { AuthenticatedUserDTO, UserDTO } from '@/types/user';
import { generateToken } from '@/lib/jwts';
import { HttpError, HttpStatus } from '@/lib/errors';

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
