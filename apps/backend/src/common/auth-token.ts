import { UnauthorizedException } from '@nestjs/common';

export function userIdFromAuthorization(authorization?: string) {
  const token = authorization?.replace(/^Bearer\s+/i, '');
  if (!token) throw new UnauthorizedException('Token ausente.');

  try {
    return Buffer.from(token, 'base64url').toString('utf8');
  } catch {
    throw new UnauthorizedException('Token invalido.');
  }
}
