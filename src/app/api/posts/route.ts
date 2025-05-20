import { NextResponse } from 'next/server';
import { createPostSchema } from '@/schemas/post.schema';
import { createPost, fetchPosts } from '@/db/post/post.service';
import { HttpError, HttpStatus } from '@/lib/errors';
import { logger } from '@/lib/logger';

// Create a new post
export async function POST(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: HttpStatus.UNAUTHORIZED }
      );
    }
    // const { userId } = verifyToken(token); // userId available from token

    const body = await request.json();
    const validation = createPostSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validation.error.format() },
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    const post = await createPost(validation.data, token); // Direct call
    return NextResponse.json(post, { status: HttpStatus.CREATED });
  } catch (error) {
    logger.error('POST /api/posts error:', error);
    if (error instanceof HttpError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode } // HttpError already uses HttpStatus for statusCode
      );
    }
    return NextResponse.json(
      { message: 'Error creating post' },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

// Get all posts (paginated)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    if (isNaN(page) || page < 1 || isNaN(pageSize) || pageSize < 1) {
      return NextResponse.json(
        { message: 'Invalid pagination parameters' },
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    const posts = await fetchPosts(page, pageSize); // Direct call
    // TODO: Add total count for pagination headers if needed
    return NextResponse.json(posts);
  } catch (error) {
    logger.error('GET /api/posts error:', error);
    return NextResponse.json(
      { message: 'Error fetching posts' },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
