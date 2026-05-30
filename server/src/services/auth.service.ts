import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { randomUUID } from 'crypto';

function generateAccessToken(userId: string, role: string) {
  return jwt.sign(
    { sub: userId, role },
    process.env.JWT_SECRET || 'dev-secret-change-me',   // ← теперь используем JWT_SECRET
    { expiresIn: '15m' }
  );
}

function generateRefreshToken(userId: string, role: string) {
  const jti = randomUUID();
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
      token: refreshToken,
      jti,
      expiresAt,
      userId,
    },
  });
  return { accessToken, refreshToken };
}