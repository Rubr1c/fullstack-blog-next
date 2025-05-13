import { NextResponse } from 'next/server';
import { createUserSchema } from '@/schemas/user.schema';
import { registerUser } from '@/db/user/user.service';
import { ZodError } from 'zod';

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const data = createUserSchema.parse(json);
    const user = await registerUser(data);
    return NextResponse.json(user, { status: 201 });
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
