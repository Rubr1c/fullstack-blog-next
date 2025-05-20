import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwts';
import { updatePostSchema } from '@/schemas/post.schema';
import { fetchPostById, updatePost, deletePost } from '@/db/post/post.service';
import { HttpError } from '@/lib/errors';
import { logger } from '@/lib/logger';

interface PostRouteParams {
  params: {
    postId: string;
  };
}

// Get Post by ID
export async function GET(request: Request, { params }: PostRouteParams) {
  try {
    const post = await fetchPostById(params.postId);
    return NextResponse.json(post);
  } catch (error) {
    logger.error('GET /api/posts/[postId] error:', error);
    if (error instanceof HttpError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { message: 'Error fetching post' },
      { status: 500 }
    );
  }
}

// Update Post
export async function PUT(request: Request, { params }: PostRouteParams) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const { userId } = verifyToken(token);

    const body = await request.json();
    const validation = updatePostSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validation.error.format() },
        { status: 400 }
      );
    }

    const updatedPost = await updatePost(
      params.postId,
      validation.data,
      BigInt(userId)
    );
    return NextResponse.json(updatedPost);
  } catch (error) {
    logger.error('PUT /api/posts/[postId] error:', error);
    if (error instanceof HttpError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { message: 'Error updating post' },
      { status: 500 }
    );
  }
}

// Delete Post
export async function DELETE(request: Request, { params }: PostRouteParams) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const { userId } = verifyToken(token);

    const deletedPost = await deletePost(params.postId, BigInt(userId));
    return NextResponse.json(deletedPost);
  } catch (error) {
    logger.error('DELETE /api/posts/[postId] error:', error);
    if (error instanceof HttpError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { message: 'Error deleting post' },
      { status: 500 }
    );
  }
}
