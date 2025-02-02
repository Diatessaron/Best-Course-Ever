import { CanActivate, ExecutionContext, Inject, Injectable, Scope, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Collection, Db } from 'mongodb';
import { UserContextService } from '../../service/UserContextService';

@Injectable({ scope: Scope.REQUEST })
export class AuthGuard implements CanActivate {
  private readonly blacklistedTokensCollections: Collection

  constructor(
    private readonly jwtService: JwtService,
    @Inject(UserContextService) private readonly userContextService: UserContextService,
    @Inject('DATABASE_CONNECTION') private readonly db: Db
  ) {
    this.blacklistedTokensCollections = db.collection('blacklistedTokens');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid token');
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = await this.jwtService.verifyAsync(token, { secret: process.env.SECURITY_KEY });
      const isBlacklisted = await this.blacklistedTokensCollections.findOne({ token: token });
      if (isBlacklisted) {
        throw new UnauthorizedException('Unauthorized');
      }

      this.userContextService.setUser(payload);
      this.userContextService.setUserToken(token);
      request.userContextService = this.userContextService;

      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
