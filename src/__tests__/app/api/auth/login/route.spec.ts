import { testApiHandler } from 'next-test-api-route-handler';
import { POST as handler } from '@/app/api/auth/login/route';
import { authenticateUser } from '@/db/user/user.service';
import { LoginUserInput } from '@/schemas/user.schema';
import { AuthenticatedUserDTO } from '@/types/user';
import { HttpError, HttpStatus } from '@/lib/errors';

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

        expect(res.status).toBe(HttpStatus.OK);
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

        expect(res.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
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

  it('should return correct status if authentication service throws HttpError (e.g., user not found)', async () => {
    const validInput: LoginUserInput = {
      email: 'test@example.com',
      password: 'password123',
    };
    const errorMessage = 'User with email not found';
    mockedAuthenticateUser.mockRejectedValue(
      new HttpError(errorMessage, HttpStatus.NOT_FOUND)
    );

    await testApiHandler({
      appHandler: { POST: handler },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          body: JSON.stringify(validInput),
        });
        const json = await res.json();

        expect(res.status).toBe(HttpStatus.NOT_FOUND);
        expect(json.error).toBe(errorMessage);
        expect(mockedAuthenticateUser).toHaveBeenCalledWith(validInput);
      },
    });
  });

  it('should return 500 for non-HttpError and non-ZodError exceptions from service', async () => {
    const validInput: LoginUserInput = {
      email: 'test@example.com',
      password: 'password123',
    };
    const unexpectedErrorMessage = 'Some string error';
    mockedAuthenticateUser.mockRejectedValue(unexpectedErrorMessage);

    await testApiHandler({
      appHandler: { POST: handler },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          body: JSON.stringify(validInput),
        });
        const json = await res.json();

        expect(res.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(json.error).toBe('An internal server error occurred');
        expect(mockedAuthenticateUser).toHaveBeenCalledWith(validInput);
      },
    });
  });
});
