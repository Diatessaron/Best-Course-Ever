import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserContextService } from '../../service/userContextService';

export const Token = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const userContextService = ctx.switchToHttp().getRequest()
      .userContextService as UserContextService;
    return userContextService ? userContextService.getUserToken() : null;
  },
);
