import { authenticateUser } from '@/db/user/user.service';
import { HttpError, HttpStatus } from '@/lib/errors';
import { loginUserSchema } from '@/schemas/user.schema';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const data = loginUserSchema.parse(json);
    const user = await authenticateUser(data);
    return NextResponse.json(user, { status: HttpStatus.OK });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode }
      );
    }
    if (err instanceof ZodError) {
      return NextResponse.json(
        { errors: err.errors },
        { status: HttpStatus.UNPROCESSABLE_ENTITY }
      );
    }
    console.error('Login API Error:', err);
    return NextResponse.json(
      {
        error: 'An internal server error occurred',
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
