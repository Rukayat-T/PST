import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ROLES_KEY, Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/entities/role.enum';
import { JwtGuard } from './jwt.guard';
import { UserEntity } from 'src/entities/UserEntity.entity';
import { User } from 'src/entities/user.class';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return requiredRoles.some((role) => user.role?.includes(role));
  }
}
