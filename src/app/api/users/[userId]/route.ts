import { NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma'; // prisma not directly used here
import { verifyToken } from '@/lib/jwts';
import { updateUserSchema } from '@/schemas/user.schema';
import { updateUser, deleteUser } from '@/db/user/user.service';
import { HttpError } from '@/lib/errors';
import { getUserById } from '@/db/user/user.repository'; // For GET
import { logger } from '@/lib/logger'; // Corrected: named import

interface UserRouteParams {
  params: {
    userId: string;
  };
}

// Get User by ID
export async function GET(request: Request, { params }: UserRouteParams) {
  try {
    // Optional: Add token verification if only authenticated users can fetch profiles
    const user = await getUserById(BigInt(params.userId));
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      // Exclude password and other sensitive fields
    });
  } catch (error) {
    logger.error('GET /api/users/[userId] error:', error);
    return NextResponse.json(
      { message: 'Error fetching user' },
      { status: 500 }
    );
  }
}

// Update User
export async function PUT(request: Request, { params }: UserRouteParams) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const { userId: tokenUserId } = verifyToken(token);

    if (params.userId !== tokenUserId) {
      return NextResponse.json(
        { message: 'Forbidden: You can only update your own profile' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validation.error.format() },
        { status: 400 }
      );
    }

    const updatedUser = await updateUser(params.userId, validation.data);
    return NextResponse.json(updatedUser);
  } catch (error) {
    logger.error('PUT /api/users/[userId] error:', error);
    if (error instanceof HttpError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { message: 'Error updating user' },
      { status: 500 }
    );
  }
}

// Delete User
export async function DELETE(request: Request, { params }: UserRouteParams) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const { userId: tokenUserId } = verifyToken(token);

    if (params.userId !== tokenUserId) {
      return NextResponse.json(
        { message: 'Forbidden: You can only delete your own account' },
        { status: 403 }
      );
    }

    await deleteUser(params.userId);
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('DELETE /api/users/[userId] error:', error);
    if (error instanceof HttpError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { message: 'Error deleting user' },
      { status: 500 }
    );
  }
}
