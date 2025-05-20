import { type PostDTO, createPostDto } from '@/types/post.types';
import { type CreatePostInput } from '@/schemas/post.schema';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwts';
import { getPostBySlug, getPostsPaged } from './post.repository';
import { HttpError, HttpStatus } from '@/lib/errors';

export async function createPost(
  data: CreatePostInput,
  token: string
): Promise<PostDTO> {
  const { userId } = verifyToken(token);
  const post = await prisma.post.create({
    data: { ...data, authorId: BigInt(userId) },
  });
  return createPostDto(post);
}

export async function getPost(slug: string): Promise<PostDTO> {
  const post = await getPostBySlug(slug);
  if (!post) {
    throw new HttpError(
      `Post with slug ${slug} not fount`,
      HttpStatus.NOT_FOUND
    );
  }
  return createPostDto(post);
}

export async function getPosts(
  page: number,
  pageSize: number
): Promise<PostDTO[]> {
  const posts = await getPostsPaged(page, pageSize);
  return posts.map(createPostDto);
}
