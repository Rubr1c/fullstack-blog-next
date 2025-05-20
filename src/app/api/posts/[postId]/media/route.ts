import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwts';
import { CreateMediaSchema } from '@/schemas/media.schema';
import { addMediaToPost, fetchMediaForPost } from '@/db/media/media.service';
import { HttpError, HttpStatus } from '@/lib/errors';
import { logger } from '@/lib/logger';

interface PostMediaRouteParams {
  params: {
    postId: string;
  };
}

// Add media to a post
export async function POST(request: Request, { params }: PostMediaRouteParams) {
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
    const validation = CreateMediaSchema.safeParse({
      ...body,
      postId: params.postId,
    });

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validation.error.format() },
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    const media = await addMediaToPost(validation.data, BigInt(userId));
    return NextResponse.json(media, { status: HttpStatus.CREATED });
  } catch (error) {
    logger.error('POST /api/posts/[postId]/media error:', error);
    if (error instanceof HttpError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { message: 'Error adding media to post' },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

// Get media for a post
export async function GET(request: Request, { params }: PostMediaRouteParams) {
  try {
    const mediaItems = await fetchMediaForPost(params.postId);
    return NextResponse.json(mediaItems);
  } catch (error) {
    logger.error('GET /api/posts/[postId]/media error:', error);
    if (error instanceof HttpError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { message: 'Error fetching media for post' },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
