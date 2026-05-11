import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

function generateAccessToken(userId: string, role: string) {
  return jwt.sign(
    { sub: userId, role },
    process.env.JWT_ACCESS_SECRET || 'access-secret',
    { expiresIn: '15m' }
  );
}

function generateRefreshToken(userId: string, role: string) {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { sub: userId, role, jti },
    process.env.JWT_REFRESH_SECRET || 'refresh-secret',
    { expiresIn: '7d' }
  );
  return { token, jti };
}

export async function createTokens(userId: string, role: string) {
  const accessToken = generateAccessToken(userId, role);
  const { token: refreshToken, jti } = generateRefreshToken(userId, role);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.token.create({
    data: {
      token: refreshToken, // можно хранить хеш, но для простоты пока так
      jti,
      expiresAt,
      userId,
    },
  });
  return { accessToken, refreshToken };
}