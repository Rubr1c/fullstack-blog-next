import { CreateUserInput } from '@/schemas/user.schema';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { getUserByEmail } from './user.repository';
import { AuthenticatedUserDTO, UserDTO } from '@/types/user';
import { generateToken } from '@/lib/jwts';

export async function registerUser(data: CreateUserInput): Promise<UserDTO> {
  if (await getUserByEmail(data.email)) {
    throw new Error('User with email already exists');
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
  data: CreateUserInput
): Promise<AuthenticatedUserDTO> {
  const user = await getUserByEmail(data.email);
  if (!user) {
    throw new Error('User with email not found');
  }
  const isPasswordValid = await bcrypt.compare(data.password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid password');
  }

  const expiresIn = process.env.NODE_ENV === 'production' ? '1h' : '1d';

  const token = generateToken({ userId: user.id }, expiresIn);

  return {
    token,
    expiresIn: expiresIn,
  };
}
