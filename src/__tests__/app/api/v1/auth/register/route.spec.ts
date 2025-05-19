import { testApiHandler } from 'next-test-api-route-handler';
import { POST as handler } from '@/app/api/v1/auth/register/route';
import { registerUser } from '@/db/user/user.service';
import { CreateUserInput } from '@/schemas/user.schema';
import { UserDTO } from '@/types/user';

jest.mock('@/db/user/user.service', () => ({
  registerUser: jest.fn(),
}));

const mockedRegisterUser = registerUser as jest.MockedFunction<
  typeof registerUser
>;

describe('POST /api/v1/auth/register', () => {
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

        expect(res.status).toBe(201);
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
        expect(mockedRegisterUser).not.toHaveBeenCalled();
      },
    });
  });

  it('should return 400 if registration service throws an error', async () => {
    const validInput: CreateUserInput = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    };
    const errorMessage = 'User with email already exists';
    mockedRegisterUser.mockRejectedValue(new Error(errorMessage));

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
        expect(mockedRegisterUser).toHaveBeenCalledWith(validInput);
      },
    });
  });

  it('should return 400 for non-Zod and non-Error exceptions from service', async () => {
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

        expect(res.status).toBe(400);
        expect(json.error).toBe('An unknown error occurred');
        expect(mockedRegisterUser).toHaveBeenCalledWith(validInput);
      },
    });
  });
});
