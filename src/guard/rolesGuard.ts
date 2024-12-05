import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roles) {
      throw new UnauthorizedException('User not authenticated');
    }

    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    if (!hasRole) {
      //todo: validate if requested resource belongs to the user-owner

      throw new UnauthorizedException('Access denied');
    }

    return true;
  }
}
