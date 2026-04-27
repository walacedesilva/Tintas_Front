import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard de acesso por screen_perms.
 * Uso: canActivate: [telaPermitidaGuard('dashboard')]
 */
export function telaPermitidaGuard(slug: string): CanActivateFn {
  return () => {
    const auth   = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.parseUrl('/login');
    }

    if (auth.canAccessTela(slug)) {
      return true;
    }

    return router.parseUrl('/app/acesso-negado');
  };
}
