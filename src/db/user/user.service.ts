import { prisma } from '@/lib/prisma';
import { UpdateUserInput } from '@/schemas/user.schema';
import { UserDTO } from '@/types/user.types';
import { HttpError, HttpStatus } from '@/lib/errors';
import { getUserById } from './user.repository';

export async function updateUser(
  userId: string,
  update: UpdateUserInput
): Promise<UserDTO> {
  const existingUser = await getUserById(BigInt(userId));

  if (!existingUser) {
    throw new HttpError(
      `User with id ${userId} not found`,
      HttpStatus.NOT_FOUND
    );
  }

  const user = await prisma.user.update({
    where: { id: BigInt(userId) },
    data: { ...update },
  });

  return {
    id: user.id.toString(),
    username: user.username,
    email: user.email,
  };
}

export async function deleteUser(userId: string): Promise<void> {
  const existingUser = await getUserById(BigInt(userId));

  if (!existingUser) {
    throw new HttpError(
      `User with id ${userId} not found`,
      HttpStatus.NOT_FOUND
    );
  }
  //TODO: delete colerated data
  await prisma.user.delete({ where: { id: BigInt(userId) } });
}
