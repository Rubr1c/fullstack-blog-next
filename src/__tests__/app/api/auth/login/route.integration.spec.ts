import { testApiHandler } from 'next-test-api-route-handler';
import { POST as handler } from '@/app/api/auth/login/route';
import { LoginUserInput } from '@/schemas/user.schema';
import { AuthenticatedUserDTO } from '@/types/user.types';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { verifyToken } from '@/lib/jwts'; // Import verifyToken to inspect JWT
import { HttpStatus } from '@/lib/errors';

// Helper to clean the database
async function cleanDatabase() {
  await prisma.user.deleteMany();
}

const testUserCredentials = {
  email: 'login.integration@example.com',
  username: 'login_integration_user',
  password: 'password123',
};

describe('POST /api/auth/login (Integration)', () => {
  beforeAll(async () => {
    // Seed a user before all tests in this suite
    await cleanDatabase(); // Clean before seeding
    const hashedPassword = await bcrypt.hash(testUserCredentials.password, 10);
    await prisma.user.create({
      data: {
        email: testUserCredentials.email,
        username: testUserCredentials.username,
        password: hashedPassword,
      },
    });
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  it('should login a user and return 200 with a valid token on success', async () => {
    const validInput: LoginUserInput = {
      email: testUserCredentials.email,
      password: testUserCredentials.password,
    };

    await testApiHandler({
      appHandler: { POST: handler },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          body: JSON.stringify(validInput),
        });
        const json: AuthenticatedUserDTO = await res.json();

        expect(res.status).toBe(200);
        expect(json.token).toBeDefined();
        expect(json.expiresIn).toBeDefined();

        // Verify the token (optional but good for integration)
        const decodedToken = verifyToken(json.token);
        const dbUser = await prisma.user.findUnique({
          where: { email: testUserCredentials.email },
        });
        expect(decodedToken.userId).toEqual(dbUser?.id.toString());
      },
    });
  });

  it('should return 400 for invalid password', async () => {
    const invalidInput: LoginUserInput = {
      email: testUserCredentials.email,
      password: 'wrongpassword',
    };

    await testApiHandler({
      appHandler: { POST: handler },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          body: JSON.stringify(invalidInput),
        });
        const json = await res.json();

        expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
        expect(json.error).toBe('Invalid credentials: Incorrect password.');
      },
    });
  });

  it('should return 400 if user email does not exist', async () => {
    const nonExistentUserInput: LoginUserInput = {
      email: 'nonexistent@example.com',
      password: 'password123',
    };

    await testApiHandler({
      appHandler: { POST: handler },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          body: JSON.stringify(nonExistentUserInput),
        });
        const json = await res.json();

        expect(res.status).toBe(HttpStatus.NOT_FOUND);
        expect(json.error).toBe(
          'Invalid credentials: User with this email does not exist.'
        );
      },
    });
  });

  it('should return 422 for invalid input data (ZodError)', async () => {
    const invalidInput = { email: 'not-an-email' }; // Missing password

    await testApiHandler({
      appHandler: { POST: handler },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          body: JSON.stringify(invalidInput),
        });
        const json = await res.json();

        expect(res.status).toBe(422);
        expect(json.errors).toBeDefined();
        expect(json.errors).toBeInstanceOf(Array);
        expect(
          json.errors.some((err: { path: string[] }) =>
            err.path.includes('password')
          )
        ).toBe(true);
      },
    });
  });
});
