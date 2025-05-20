import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwts';
import { CreateCommentSchema } from '@/schemas/comment.schema';
import {
  createCommentForPost,
  fetchCommentsByPost,
} from '@/db/comment/comment.service';
import { HttpError, HttpStatus } from '@/lib/errors';
import { logger } from '@/lib/logger';

interface PostCommentsRouteParams {
  params: {
    postId: string;
  };
}

// Create a new comment for a post
export async function POST(
  request: Request,
  { params }: PostCommentsRouteParams
) {
  try {
    const { postId } = await params;
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: HttpStatus.UNAUTHORIZED }
      );
    }
    const { userId } = verifyToken(token);

    const body = await request.json();
    const validation = CreateCommentSchema.safeParse({
      ...body,
      postId: postId,
    });

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validation.error.format() },
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    const comment = await createCommentForPost(validation.data, BigInt(userId));
    return NextResponse.json(comment, { status: HttpStatus.CREATED });
  } catch (error) {
    logger.error('POST /api/posts/[postId]/comments error:', error);
    if (error instanceof HttpError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { message: 'Error creating comment' },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

// Get comments for a post (paginated)
export async function GET(
  request: Request,
  { params }: PostCommentsRouteParams
) {
  try {
    const { postId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    if (isNaN(page) || page < 1 || isNaN(pageSize) || pageSize < 1) {
      return NextResponse.json(
        { message: 'Invalid pagination parameters' },
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    const comments = await fetchCommentsByPost(postId, page, pageSize);
    return NextResponse.json(comments);
  } catch (error) {
    logger.error('GET /api/posts/[postId]/comments error:', error);
    if (error instanceof HttpError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { message: 'Error fetching comments' },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
