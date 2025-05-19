import { authenticateUser } from '@/db/user/user.service';
import { loginUserSchema } from '@/schemas/user.schema';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const data = loginUserSchema.parse(json);
    const user = await authenticateUser(data);
    return NextResponse.json(user, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.errors }, { status: 422 });
    }
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'An unknown error occurred',
      },
      { status: 400 }
    );
  }
}
