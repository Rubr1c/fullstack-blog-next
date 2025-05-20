import { authenticateUser } from '@/db/auth/auth.service';
import { HttpError, HttpStatus } from '@/lib/errors';
import { loginUserSchema } from '@/schemas/user.schema';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import logger from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const data = loginUserSchema.parse(json);
    const user = await authenticateUser(data);
    let loggedUserId = 'unknown';
    if (user.token && user.token.split('.').length === 3) {
      try {
        loggedUserId = JSON.parse(atob(user.token.split('.')[1])).userId;
      } catch {
        logger.warn('Could not parse userId from token for logging', {
          token: user.token,
        });
      }
    }
    logger.info('User successfully authenticated', {
      email: data.email,
      userId: loggedUserId,
    });
    return NextResponse.json(user, { status: HttpStatus.OK });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      logger.warn(`HttpError in login: ${err.message}`, {
        statusCode: err.statusCode,
        originalError: err.cause,
      });
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode }
      );
    }
    if (err instanceof ZodError) {
      logger.warn('Validation error in login', { errors: err.errors });
      return NextResponse.json(
        { errors: err.errors },
        { status: HttpStatus.UNPROCESSABLE_ENTITY }
      );
    }
    logger.error('Unexpected error in login API', { error: err });
    return NextResponse.json(
      {
        error: 'An internal server error occurred',
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
