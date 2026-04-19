import {
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Validates JWT when `Authorization: Bearer` is present; otherwise allows the
 * request through with no `request.user` (for guest checkout + crypto flows).
 */
@Injectable()
export class JwtOptionalAccessGuard extends AuthGuard('jwt-access') {
    canActivate(context: ExecutionContext) {
        const req = context
            .switchToHttp()
            .getRequest<{ headers?: { authorization?: string } }>();
        const auth = req.headers?.authorization;
        if (!auth || !auth.startsWith('Bearer ')) {
            return true;
        }
        return super.canActivate(context) as boolean | Promise<boolean>;
    }

    handleRequest<TUser = unknown>(
        err: unknown,
        user: TUser,
        _info: unknown,
        context: ExecutionContext
    ): TUser {
        if (err) {
            throw err instanceof Error ? err : new UnauthorizedException();
        }
        const req = context
            .switchToHttp()
            .getRequest<{ headers?: { authorization?: string } }>();
        const auth = req.headers?.authorization;
        if (auth?.startsWith('Bearer ') && !user) {
            throw new UnauthorizedException(
                'auth.error.accessTokenUnauthorized'
            );
        }
        return user;
    }
}
