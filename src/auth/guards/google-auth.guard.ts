import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
    getAuthenticateOptions(context: ExecutionContext) {
        const req = context.switchToHttp().getRequest();
        const role = req.query.role || 'SISWA'; // Default SISWA jika tidak diisi
        return {
            state: JSON.stringify({ role }),
        };
    }
}