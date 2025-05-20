import { NextResponse } from 'next/server';
import { createUserSchema } from '@/schemas/user.schema';
import { registerUser } from '@/db/auth/auth.service';
import { ZodError } from 'zod';
import { logger } from '@/lib/logger';
import { HttpError, HttpStatus } from '@/lib/errors';

interface LogDetails {
  statusCode: HttpStatus;
  originalError?: unknown;
  email?: string;
}

export async function POST(req: Request) {
  let parsedDataEmail: string | undefined;
  try {
    const json = await req.json();
    const data = createUserSchema.parse(json);
    parsedDataEmail = data.email;
    const user = await registerUser(data);
    logger.info('User successfully registered', {
      email: user.email,
      userId: user.id,
    });
    return NextResponse.json(user, { status: HttpStatus.CREATED });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      const logDetails: LogDetails = {
        statusCode: err.statusCode,
        originalError: err.cause,
      };
      if (err.statusCode === HttpStatus.CONFLICT && parsedDataEmail) {
        logDetails.email = parsedDataEmail;
      }
      logger.warn(`HttpError during registration: ${err.message}`, logDetails);
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode }
      );
    }
    if (err instanceof ZodError) {
      logger.warn('Validation error during registration', {
        errors: err.errors,
        input: req.bodyUsed ? 'parsed' : 'not parsed',
      });
      return NextResponse.json(
        { errors: err.errors },
        { status: HttpStatus.UNPROCESSABLE_ENTITY }
      );
    }
    logger.error('Unexpected error in registration API', { error: err });
    return NextResponse.json(
      {
        error: 'An internal server error occurred',
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
