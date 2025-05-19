import { testApiHandler } from 'next-test-api-route-handler';
import { POST as handler } from '@/app/api/auth/login/route';
import { authenticateUser } from '@/db/user/user.service';
import { LoginUserInput } from '@/schemas/user.schema';
import { AuthenticatedUserDTO } from '@/types/user';

jest.mock('@/db/user/user.service', () => ({
  authenticateUser: jest.fn(),
}));

const mockedAuthenticateUser = authenticateUser as jest.MockedFunction<
  typeof authenticateUser
>;

describe('POST /api/auth/login', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should authenticate a user and return 200 with token on success', async () => {
    const validInput: LoginUserInput = {
      email: 'test@example.com',
      password: 'password123',
    };
    const mockAuthResponse: AuthenticatedUserDTO = {
      token: 'mock-jwt-token',
      expiresIn: '1h',
    };

    mockedAuthenticateUser.mockResolvedValue(mockAuthResponse);

    await testApiHandler({
      appHandler: { POST: handler },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          body: JSON.stringify(validInput),
        });
        const json = await res.json();

        expect(res.status).toBe(200); // Changed from 201 to 200 for login
        expect(json.token).toEqual(mockAuthResponse.token);
        expect(json.expiresIn).toEqual(mockAuthResponse.expiresIn);
        expect(mockedAuthenticateUser).toHaveBeenCalledWith(validInput);
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
        expect(mockedAuthenticateUser).not.toHaveBeenCalled();
      },
    });
  });

  it('should return 400 if authentication service throws an error (e.g., user not found)', async () => {
    const validInput: LoginUserInput = {
      email: 'test@example.com',
      password: 'password123',
    };
    const errorMessage = 'User with email not found';
    mockedAuthenticateUser.mockRejectedValue(new Error(errorMessage));

    await testApiHandler({
      appHandler: { POST: handler },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          body: JSON.stringify(validInput),
        });
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(json.error).toBe(errorMessage);
        expect(mockedAuthenticateUser).toHaveBeenCalledWith(validInput);
      },
    });
  });

  it('should return 400 for non-Zod and non-Error exceptions from service', async () => {
    const validInput: LoginUserInput = {
      email: 'test@example.com',
      password: 'password123',
    };
    mockedAuthenticateUser.mockRejectedValue('Some string error'); // Simulate unexpected error

    await testApiHandler({
      appHandler: { POST: handler },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          body: JSON.stringify(validInput),
        });
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(json.error).toBe('An unknown error occurred');
        expect(mockedAuthenticateUser).toHaveBeenCalledWith(validInput);
      },
    });
  });
});
