import { Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { telaPermitidaGuard } from './tela-permitida.guard';
import { AuthService } from '../services/auth.service';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe('telaPermitidaGuard', () => {
  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['isAuthenticated', 'canAccessTela']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['parseUrl']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  function runGuard(slug: string): ReturnType<ReturnType<typeof telaPermitidaGuard>> {
    const guardFn = telaPermitidaGuard(slug);
    return TestBed.runInInjectionContext(() =>
      guardFn(
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      ),
    );
  }

  it('should redirect to /login when not authenticated', () => {
    authSpy.isAuthenticated.and.returnValue(false);
    const loginUrl = { toString: () => '/login' } as any;
    routerSpy.parseUrl.and.returnValue(loginUrl);

    const result = runGuard('dashboard');

    expect(routerSpy.parseUrl).toHaveBeenCalledWith('/login');
    expect(result).toBe(loginUrl);
  });

  it('should redirect to /app/acesso-negado when tela not in screen_perms', () => {
    authSpy.isAuthenticated.and.returnValue(true);
    authSpy.canAccessTela.and.returnValue(false);
    const acessoNegadoUrl = { toString: () => '/app/acesso-negado' } as any;
    routerSpy.parseUrl.and.returnValue(acessoNegadoUrl);

    const result = runGuard('configuracoes');

    expect(authSpy.canAccessTela).toHaveBeenCalledWith('configuracoes');
    expect(routerSpy.parseUrl).toHaveBeenCalledWith('/app/acesso-negado');
    expect(result).toBe(acessoNegadoUrl);
  });

  it('should return true when tela is present in screen_perms', () => {
    authSpy.isAuthenticated.and.returnValue(true);
    authSpy.canAccessTela.and.returnValue(true);

    const result = runGuard('configuracoes');

    expect(authSpy.canAccessTela).toHaveBeenCalledWith('configuracoes');
    expect(result).toBeTrue();
  });
});
