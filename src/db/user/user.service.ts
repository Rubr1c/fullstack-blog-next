import { CreateUserInput } from '@/schemas/user.schema';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { getUserByEmail } from './user.repository';
import { UserDTO } from '@/types/user';

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
    id: user.id,
    email: user.email,
    username: user.username,
  };
}
