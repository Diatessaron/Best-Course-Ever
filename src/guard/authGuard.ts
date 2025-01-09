import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Collection, Db } from 'mongodb';

@Injectable()
export class AuthGuard implements CanActivate {
  private blacklistedTokensCollections: Collection

  constructor(
    private readonly jwtService: JwtService,
    @Inject('DATABASE_CONNECTION') private readonly db: Db
  ) {
    this.blacklistedTokensCollections = db.collection('blacklistedTokens');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid token');
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = this.jwtService.verify(token, { secret: process.env.SECURITY_KEY });
      const isBlacklisted = await this.blacklistedTokensCollections.findOne({ token: token });
      if (isBlacklisted) {
        throw new UnauthorizedException('Unauthorized');
      }

      request.user = payload;
      request.token = token;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
