import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwts';
import { UpdateCommentSchema } from '@/schemas/comment.schema';
import {
  fetchCommentById,
  updateExistingComment,
  removeComment,
} from '@/db/comment/comment.service';
import { HttpError, HttpStatus } from '@/lib/errors';
import { logger } from '@/lib/logger';

interface CommentRouteParams {
  params: {
    commentId: string;
  };
}

// Get Comment by ID
export async function GET(request: Request, { params }: CommentRouteParams) {
  try {
    const comment = await fetchCommentById(params.commentId);
    return NextResponse.json(comment);
  } catch (error) {
    logger.error('GET /api/comments/[commentId] error:', error);
    if (error instanceof HttpError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { message: 'Error fetching comment' },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

// Update Comment
export async function PUT(request: Request, { params }: CommentRouteParams) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: HttpStatus.UNAUTHORIZED }
      );
    }
    const { userId } = verifyToken(token);

    const body = await request.json();
    const validation = UpdateCommentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validation.error.format() },
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    const updatedComment = await updateExistingComment(
      params.commentId,
      validation.data,
      BigInt(userId)
    );
    return NextResponse.json(updatedComment);
  } catch (error) {
    logger.error('PUT /api/comments/[commentId] error:', error);
    if (error instanceof HttpError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { message: 'Error updating comment' },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

// Delete Comment
export async function DELETE(request: Request, { params }: CommentRouteParams) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: HttpStatus.UNAUTHORIZED }
      );
    }
    const { userId } = verifyToken(token);

    const deletedComment = await removeComment(
      params.commentId,
      BigInt(userId)
    );
    return NextResponse.json(deletedComment, { status: HttpStatus.OK });
  } catch (error) {
    logger.error('DELETE /api/comments/[commentId] error:', error);
    if (error instanceof HttpError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { message: 'Error deleting comment' },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
