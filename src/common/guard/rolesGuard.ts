import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserContextService } from '../../service/userContextService';
import { UserRoles } from '../../model/user';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userContextService: UserContextService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) {
      return true;
    }

    const user = this.userContextService.getUser();

    if (!user?.roles) {
      throw new UnauthorizedException('User not authenticated');
    }

    const hasRole = requiredRoles.some((role) =>
      user.roles.includes(UserRoles[role as keyof typeof UserRoles]),
    );
    if (!hasRole) {
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}
