import { NextResponse } from 'next/server';
import { fetchPostBySlug } from '@/db/post/post.service';
import { HttpError, HttpStatus } from '@/lib/errors';
import { logger } from '@/lib/logger';

interface PostSlugRouteParams {
  params: {
    slug: string;
  };
}

// Get Post by Slug
export async function GET(request: Request, { params }: PostSlugRouteParams) {
  try {
    const post = await fetchPostBySlug(params.slug);
    return NextResponse.json(post);
  } catch (error) {
    logger.error('GET /api/posts/slug/[slug] error:', error);
    if (error instanceof HttpError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { message: 'Error fetching post by slug' },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
