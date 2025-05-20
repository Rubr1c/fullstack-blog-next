import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwts';
import { UpdateMediaSchema } from '@/schemas/media.schema';
import {
  fetchMediaItemById,
  updateExistingMediaItem,
  removeMediaItem,
} from '@/db/media/media.service';
import { HttpError, HttpStatus } from '@/lib/errors';
import { logger } from '@/lib/logger';

interface MediaRouteParams {
  params: {
    mediaId: string;
  };
}

// Get Media Item by ID
export async function GET(request: Request, { params }: MediaRouteParams) {
  try {
    const { mediaId } = await params;
    const media = await fetchMediaItemById(mediaId);
    return NextResponse.json(media);
  } catch (error) {
    logger.error('GET /api/media/[mediaId] error:', error);
    if (error instanceof HttpError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { message: 'Error fetching media item' },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

// Update Media Item
export async function PUT(request: Request, { params }: MediaRouteParams) {
  try {
    const { mediaId } = await params;
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: HttpStatus.UNAUTHORIZED }
      );
    }
    const { userId } = verifyToken(token);

    const body = await request.json();
    const validation = UpdateMediaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validation.error.format() },
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    const updatedMedia = await updateExistingMediaItem(
      mediaId,
      validation.data,
      BigInt(userId)
    );
    return NextResponse.json(updatedMedia);
  } catch (error) {
    logger.error('PUT /api/media/[mediaId] error:', error);
    if (error instanceof HttpError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { message: 'Error updating media item' },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

// Delete Media Item
export async function DELETE(request: Request, { params }: MediaRouteParams) {
  try {
    const { mediaId } = await params;
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: HttpStatus.UNAUTHORIZED }
      );
    }
    const { userId } = verifyToken(token);

    const deletedMedia = await removeMediaItem(mediaId, BigInt(userId));
    return NextResponse.json(deletedMedia, { status: HttpStatus.OK });
  } catch (error) {
    logger.error('DELETE /api/media/[mediaId] error:', error);
    if (error instanceof HttpError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { message: 'Error deleting media item' },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
