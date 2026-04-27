import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(AuthService);

  if (auth.isAuthenticated()) {
    return true;
  }

  // Token missing or expired — clear and redirect
  localStorage.removeItem('token');
  router.navigate(['/login']);
  return false;
};
