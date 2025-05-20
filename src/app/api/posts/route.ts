import { NextResponse } from 'next/server';
// import { verifyToken } from '@/lib/jwts'; // verifyToken is not used here as createPost expects the token
import { createPostSchema } from '@/schemas/post.schema'; // Corrected import name
import { createPost, fetchPosts } from '@/db/post/post.service'; // Named imports
import { HttpError } from '@/lib/errors';
import { logger } from '@/lib/logger'; // Import logger

// Create a new post
export async function POST(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    // const { userId } = verifyToken(token); // userId available from token

    const body = await request.json();
    const validation = createPostSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validation.error.format() },
        { status: 400 }
      );
    }

    const post = await createPost(validation.data, token); // Direct call
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    logger.error('POST /api/posts error:', error);
    if (error instanceof HttpError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode } // Corrected: statusCode
      );
    }
    return NextResponse.json(
      { message: 'Error creating post' },
      { status: 500 }
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
        { status: 400 }
      );
    }

    const posts = await fetchPosts(page, pageSize); // Direct call
    // TODO: Add total count for pagination headers if needed
    return NextResponse.json(posts);
  } catch (error) {
    logger.error('GET /api/posts error:', error);
    return NextResponse.json(
      { message: 'Error fetching posts' },
      { status: 500 }
    );
  }
}
