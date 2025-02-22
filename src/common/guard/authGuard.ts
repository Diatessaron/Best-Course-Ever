import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Scope,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserContextService } from '../../service/userContextService';
import { InjectRepository } from '@nestjs/typeorm';
import { BlacklistedToken } from '../../model/blacklistedToken';
import { Repository } from 'typeorm';

@Injectable({ scope: Scope.REQUEST })
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userContextService: UserContextService,
    @InjectRepository(BlacklistedToken)
    private readonly blacklistedTokensRepository: Repository<BlacklistedToken>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid token');
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.SECURITY_KEY,
      });

      const isBlacklisted = await this.blacklistedTokensRepository.findOne({
        where: { token },
      });

      if (isBlacklisted) {
        throw new UnauthorizedException('Unauthorized');
      }

      this.userContextService.setUser(payload);
      this.userContextService.setUserToken(token);
      request.userContextService = this.userContextService;

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
