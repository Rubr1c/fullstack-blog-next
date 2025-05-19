import { testApiHandler } from 'next-test-api-route-handler';
import { POST as handler } from '@/app/api/auth/register/route';
import { registerUser } from '@/db/user/user.service';
import { CreateUserInput } from '@/schemas/user.schema';
import { UserDTO } from '@/types/user';
import { HttpError, HttpStatus } from '@/lib/errors';

jest.mock('@/db/user/user.service', () => ({
  registerUser: jest.fn(),
}));

const mockedRegisterUser = registerUser as jest.MockedFunction<
  typeof registerUser
>;

describe('POST /api/auth/register', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should register a user and return 201 on success', async () => {
    const validInput: CreateUserInput = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    };
    const mockUserResponse: UserDTO = {
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
    };

    mockedRegisterUser.mockResolvedValue(mockUserResponse);

    await testApiHandler({
      appHandler: { POST: handler },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          body: JSON.stringify(validInput),
        });
        const json = await res.json();

        expect(res.status).toBe(HttpStatus.CREATED);
        expect(json.email).toEqual(mockUserResponse.email);
        expect(json.username).toEqual(mockUserResponse.username);
        expect(json.id).toEqual(mockUserResponse.id);
        expect(mockedRegisterUser).toHaveBeenCalledWith(validInput);
      },
    });
  });

  it('should return 422 for invalid input data (ZodError)', async () => {
    const invalidInput = { email: 'not-an-email' };

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
            err.path.includes('username')
          )
        ).toBe(true);
        expect(
          json.errors.some((err: { path: string[] }) =>
            err.path.includes('password')
          )
        ).toBe(true);
        expect(mockedRegisterUser).not.toHaveBeenCalled();
      },
    });
  });

  it('should return correct status if registration service throws HttpError (e.g., user exists)', async () => {
    const validInput: CreateUserInput = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    };
    const errorMessage = 'User with email already exists';
    mockedRegisterUser.mockRejectedValue(
      new HttpError(errorMessage, HttpStatus.CONFLICT)
    );

    await testApiHandler({
      appHandler: { POST: handler },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          body: JSON.stringify(validInput),
        });
        const json = await res.json();

        expect(res.status).toBe(HttpStatus.CONFLICT);
        expect(json.error).toBe(errorMessage);
        expect(mockedRegisterUser).toHaveBeenCalledWith(validInput);
      },
    });
  });

  it('should return 500 for non-HttpError and non-ZodError exceptions from service', async () => {
    const validInput: CreateUserInput = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    };
    mockedRegisterUser.mockRejectedValue('Some string error');

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
        expect(mockedRegisterUser).toHaveBeenCalledWith(validInput);
      },
    });
  });
});
