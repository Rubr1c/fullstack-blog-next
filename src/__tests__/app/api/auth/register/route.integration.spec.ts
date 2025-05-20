import { testApiHandler } from 'next-test-api-route-handler';
import { POST as handler } from '@/app/api/auth/register/route';
import { CreateUserInput } from '@/schemas/user.schema';
import { UserDTO } from '@/types/user.types';
import { prisma } from '@/lib/prisma'; // Import the actual prisma client
import bcrypt from 'bcrypt';
import { HttpStatus } from '@/lib/errors'; // Corrected HttpStatus import

// Helper function to clean the database
async function cleanDatabase() {
  // Add deletion logic for other tables if necessary, respecting foreign key constraints
  await prisma.user.deleteMany();
}

// Define testUserCredentials for this test suite
const testUserCredentials = {
  email: 'register.integration@example.com',
  username: 'reg_integ_user',
  password: 'password123',
};

describe('POST /api/auth/register (Integration)', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  // Seed a user for the specific test that needs an existing user
  async function seedUser(credentials: CreateUserInput) {
    const hashedPassword = await bcrypt.hash(credentials.password, 10);
    return prisma.user.create({
      data: {
        email: credentials.email,
        username: credentials.username,
        password: hashedPassword,
      },
    });
  }

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect(); // Disconnect prisma client after all tests
  });

  it('should register a user, store hashed password, and return 201 on success', async () => {
    const validInput: CreateUserInput = { ...testUserCredentials };

    await testApiHandler({
      appHandler: { POST: handler },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          body: JSON.stringify(validInput),
        });
        const json: UserDTO = await res.json();

        // 1. Check API response
        expect(res.status).toBe(HttpStatus.CREATED);
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

  it('should return 409 if email already exists', async () => {
    // Seed the user first
    await seedUser(testUserCredentials);

    const input: CreateUserInput = {
      email: testUserCredentials.email, // Using the same email as the seeded user
      username: 'another_user',
      password: 'anotherpassword123',
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
        expect(res.status).toBe(HttpStatus.CONFLICT); // Expect 409 Conflict
        expect(json.error).toBe('User with email already exists');

        // 4. Verify no new user was created (count should remain 1 from beforeAll)
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
