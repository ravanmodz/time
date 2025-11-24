import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function authenticate(
  req: NextApiRequest,
  res: NextApiResponse,
  allowedRoles?: string[]
): Promise<JWTPayload | null> {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.token;

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid token' });
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(payload.role)) {
    res.status(403).json({ error: 'Insufficient permissions' });
    return null;
  }

  const user = await User.findById(payload.userId);
  if (!user || user.status !== 'active') {
    res.status(401).json({ error: 'User not found or inactive' });
    return null;
  }

  return payload;
}

