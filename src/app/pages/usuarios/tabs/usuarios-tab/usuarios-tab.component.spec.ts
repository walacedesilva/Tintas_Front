
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { UsuariosTabComponent } from './usuarios-tab.component';
import { UsuarioService } from '../../../../services/usuario.service';
import { AuthService } from '../../../../services/auth.service';

const mockUsuarios = [
  { id: '1', login: 'joao', nome: 'João Silva', email: 'joao@test.com', role: 'vendedor', ativo: true, empresaId: 'emp-1' },
  { id: '2', login: 'maria', nome: 'Maria Costa', email: 'maria@test.com', role: 'admin', ativo: false, empresaId: 'emp-1' },
];

describe('UsuariosTabComponent', () => {
  let fixture: ComponentFixture<UsuariosTabComponent>;
  let component: UsuariosTabComponent;
  let usuarioServiceSpy: jasmine.SpyObj<UsuarioService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    usuarioServiceSpy = jasmine.createSpyObj('UsuarioService', ['listar', 'criar', 'atualizar']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken']);

    usuarioServiceSpy.listar.and.returnValue(of(mockUsuarios));
    authServiceSpy.getToken.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [UsuariosTabComponent, ReactiveFormsModule],
      providers: [
        { provide: UsuarioService, useValue: usuarioServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsuariosTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call loadUsuarios on ngOnInit', () => {
    expect(usuarioServiceSpy.listar).toHaveBeenCalled();
  });

  it('should display users after loadUsuarios completes', fakeAsync(() => {
    usuarioServiceSpy.listar.and.returnValue(of(mockUsuarios));
    component.loadUsuarios();
    tick();
    fixture.detectChanges();
    expect(component.usuarios()).toEqual(mockUsuarios);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('João Silva');
    expect(compiled.textContent).toContain('Maria Costa');
  }));

  it('should set error message when loadUsuarios fails', fakeAsync(() => {
    usuarioServiceSpy.listar.and.returnValue(throwError(() => new Error('Network error')));
    component.loadUsuarios();
    tick();
    expect(component.error()).toBe('Erro ao carregar usuários.');
  }));

  it('should call atualizar with inverted ativo when toggleAtivo is called', fakeAsync(() => {
    usuarioServiceSpy.atualizar.and.returnValue(of({ ...mockUsuarios[0], ativo: false }));
    usuarioServiceSpy.listar.and.returnValue(of(mockUsuarios));
    component.toggleAtivo(mockUsuarios[0]);
    tick();
    expect(usuarioServiceSpy.atualizar).toHaveBeenCalledWith('1', { ativo: false });
  }));

  it('should open form when openForm is called', () => {
    component.openForm();
    expect(component.showForm()).toBeTrue();
  });

  it('should close form when closeForm is called', () => {
    component.openForm();
    component.closeForm();
    expect(component.showForm()).toBeFalse();
  });

  it('should render form fields login, nome, email, password when form is open', () => {
    component.openForm();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[formControlName="login"]')).toBeTruthy();
    expect(compiled.querySelector('[formControlName="nome"]')).toBeTruthy();
    expect(compiled.querySelector('[formControlName="email"]')).toBeTruthy();
    expect(compiled.querySelector('[formControlName="password"]')).toBeTruthy();
  });

  it('should mark form as invalid when fields are empty', () => {
    component.form.reset();
    expect(component.form.invalid).toBeTrue();
  });

  it('should call UsuarioService.criar and reload on successful submit', fakeAsync(() => {
    const newUser = { id: '3', login: 'pedro', nome: 'Pedro', email: 'pedro@test.com', role: 'vendedor', ativo: true, empresaId: 'emp-1' };
    usuarioServiceSpy.criar.and.returnValue(of(newUser));
    usuarioServiceSpy.listar.and.returnValue(of([...mockUsuarios, newUser]));
    component.openForm();
    component.form.setValue({ login: 'pedro', nome: 'Pedro', email: 'pedro@test.com', password: 'secret1', role: 'vendedor' });
    component.submit();
    tick();
    expect(usuarioServiceSpy.criar).toHaveBeenCalled();
    expect(component.showForm()).toBeFalse();
    expect(component.saving()).toBeFalse();
  }));

  it('should set formError and stop saving on submit error', fakeAsync(() => {
    
    usuarioServiceSpy.criar.and.returnValue(throwError(() => ({ error: { error: 'Login já existe' } })));
    component.openForm();
    component.form.setValue({ login: 'pedro', nome: 'Pedro', email: 'pedro@test.com', password: 'secret1', role: 'vendedor' });
    component.submit();
    tick();
    expect(component.formError()).toBe('Login já existe');
    expect(component.saving()).toBeFalse();
  }));

  it('should not call criar when form is invalid on submit', () => {
    component.openForm();
    component.form.reset();
    component.submit();
    expect(usuarioServiceSpy.criar).not.toHaveBeenCalled();
  });

  it('should return empty string from getEmpresaId when token is null', () => {
    authServiceSpy.getToken.and.returnValue(null);
    expect(component.getEmpresaId()).toBe('');
  });

  it('should decode empresa_id from a valid JWT token', () => {
    const payload = btoa(JSON.stringify({ empresa_id: 'emp-test-123' }));
    const fakeToken = `header.${payload}.signature`;
    authServiceSpy.getToken.and.returnValue(fakeToken);
    expect(component.getEmpresaId()).toBe('emp-test-123');
  });
});
