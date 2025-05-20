import { type PostDTO, createPostDto } from '@/types/post.types';
import { UpdatePostInput, type CreatePostInput } from '@/schemas/post.schema';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwts';
import { getPostById, getPostBySlug, getPostsPaged } from './post.repository';
import { HttpError, HttpStatus } from '@/lib/errors';
import { customAlphabet } from 'nanoid';

// Helper function to generate a slug from a title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

// Helper to generate a unique suffix for slugs if needed
const nanoid = customAlphabet('1234567890abcdef', 6);

export async function createPost(
  data: CreatePostInput,
  token: string
): Promise<PostDTO> {
  const { userId } = verifyToken(token);
  const { title, content, published } = data;

  let slug = generateSlug(title);
  const potentialConflict = await getPostBySlug(slug);

  if (potentialConflict) {
    slug = `${slug}-${nanoid()}`;
  }

  const post = await prisma.post.create({
    data: {
      title,
      content,
      slug,
      authorId: BigInt(userId),
      published: published ?? false,
    },
  });
  return createPostDto(post);
}

export async function fetchPostBySlug(slug: string): Promise<PostDTO | null> {
  const post = await getPostBySlug(slug);
  if (!post) {
    throw new HttpError(
      `Post with slug ${slug} not found`,
      HttpStatus.NOT_FOUND
    );
  }
  return createPostDto(post);
}

export async function fetchPostById(id: string): Promise<PostDTO> {
  const post = await getPostById(id);
  if (!post) {
    throw new HttpError(`Post with id ${id} not found`, HttpStatus.NOT_FOUND);
  }
  return createPostDto(post);
}

export async function fetchPosts(
  page: number,
  pageSize: number
): Promise<PostDTO[]> {
  const posts = await getPostsPaged(page, pageSize);
  return posts.map(createPostDto);
}

export async function updatePost(
  id: string,
  update: UpdatePostInput,
  userId: bigint
): Promise<PostDTO> {
  const post = await getPostById(id);
  if (!post) {
    throw new HttpError(`Post with id ${id} not found`, HttpStatus.NOT_FOUND);
  }

  if (post.authorId !== userId) {
    throw new HttpError(
      'User is not authorized to update this post',
      HttpStatus.UNAUTHORIZED
    );
  }

  const updatedPost = await prisma.post.update({
    where: { id },
    data: { ...update },
  });
  return createPostDto(updatedPost);
}

export async function deletePost(id: string, userId: bigint): Promise<PostDTO> {
  const post = await getPostById(id);

  if (!post) {
    throw new HttpError(`Post with id ${id} not found`, HttpStatus.NOT_FOUND);
  }

  if (post.authorId !== userId) {
    throw new HttpError(
      'User is not authorized to delete this post',
      HttpStatus.UNAUTHORIZED
    );
  }

  await prisma.post.delete({ where: { id } });
  return createPostDto(post);
}
