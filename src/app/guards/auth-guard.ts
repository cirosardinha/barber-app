import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);


  if (auth.isLoggedIn()) return true;
  return router.createUrlTree(['/auth']);
};

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await new Promise((resolve) => setTimeout(resolve, 500));

  if (auth.isLoggedIn() && auth.isAdmin()) return true;
  return router.createUrlTree(['/auth']);
};
