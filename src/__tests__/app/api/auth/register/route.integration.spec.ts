import { testApiHandler } from 'next-test-api-route-handler';
import { POST as handler } from '@/app/api/auth/register/route';
import { CreateUserInput } from '@/schemas/user.schema';
import { UserDTO } from '@/types/user';
import { prisma } from '@/lib/prisma'; // Import the actual prisma client
import bcrypt from 'bcrypt';

// Helper function to clean the database
async function cleanDatabase() {
  // Add deletion logic for other tables if necessary, respecting foreign key constraints
  await prisma.user.deleteMany();
}

describe('POST /api/auth/register (Integration)', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect(); // Disconnect prisma client after all tests
  });

  it('should register a user, store hashed password, and return 201 on success', async () => {
    const validInput: CreateUserInput = {
      email: 'integration@example.com',
      username: 'integration_user',
      password: 'password123',
    };

    await testApiHandler({
      appHandler: { POST: handler },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          body: JSON.stringify(validInput),
        });
        const json: UserDTO = await res.json();

        // 1. Check API response
        expect(res.status).toBe(201);
        expect(json.email).toEqual(validInput.email);
        expect(json.username).toEqual(validInput.username);
        expect(json.id).toBeDefined(); // ID should be a string (based on previous changes)

        // 2. Check database state
        const dbUser = await prisma.user.findUnique({
          where: { email: validInput.email },
        });

        expect(dbUser).not.toBeNull();
        expect(dbUser?.id).toBeDefined();
        expect(dbUser?.email).toBe(validInput.email);
        expect(dbUser?.username).toBe(validInput.username);

        // 3. Verify password was hashed
        expect(dbUser?.password).not.toBe(validInput.password);
        const isPasswordCorrect = await bcrypt.compare(
          validInput.password,
          dbUser?.password ?? '' // Use empty string if password is null/undefined
        );
        expect(isPasswordCorrect).toBe(true);
      },
    });
  });

  it('should return 400 if email already exists', async () => {
    // 1. Seed the database with an existing user
    const existingEmail = 'existing@example.com';
    const hashedPassword = await bcrypt.hash('seedpassword', 10);
    await prisma.user.create({
      data: {
        email: existingEmail,
        username: 'existing_user',
        password: hashedPassword,
      },
    });

    // 2. Attempt to register with the same email
    const input: CreateUserInput = {
      email: existingEmail,
      username: 'new_username',
      password: 'newpassword123',
    };

    await testApiHandler({
      appHandler: { POST: handler },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          body: JSON.stringify(input),
        });
        const json = await res.json();

        // 3. Check API response
        expect(res.status).toBe(400);
        expect(json.error).toBe('User with email already exists');

        // 4. Verify no new user was created (optional, count check)
        const userCount = await prisma.user.count();
        expect(userCount).toBe(1);
      },
    });
  });

  it('should return 422 for invalid input data (ZodError)', async () => {
    const invalidInput = { email: 'not-an-email' }; // Missing username, password

    await testApiHandler({
      appHandler: { POST: handler },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          body: JSON.stringify(invalidInput),
        });
        const json = await res.json();

        // 1. Check API response
        expect(res.status).toBe(422);
        expect(json.errors).toBeDefined();
        expect(json.errors).toBeInstanceOf(Array);
        expect(
          json.errors.some((err: { path: string[] }) =>
            err.path.includes('username')
          )
        ).toBe(true);
        expect(
          json.errors.some((err: { path: string[] }) =>
            err.path.includes('password')
          )
        ).toBe(true);

        // 2. Check database state (no user created)
        const userCount = await prisma.user.count();
        expect(userCount).toBe(0);
      },
    });
  });
});
