export type UserDTO = {
  id: string;
  email: string;
  username: string;
};

export type AuthenticatedUserDTO = {
  token: string;
  expiresIn: string;
};

