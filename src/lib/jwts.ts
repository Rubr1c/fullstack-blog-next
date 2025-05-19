import jwt from 'jsonwebtoken';

const JWT_SECRET =
  process.env.JWT_SECRET || 'AODJUIAYDBUAYBDYABDYWTADVYAWVDAYVD92193';

interface JwtPayload {
  userId: string;
}

export function generateToken(
  payload: object,
  expiresIn: string | number = '1h'
) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
