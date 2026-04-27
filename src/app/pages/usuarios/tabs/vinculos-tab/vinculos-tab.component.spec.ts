import { throwError } from 'rxjs';

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { VinculosTabComponent } from './vinculos-tab.component';
import { VinculoLojaService } from '../../../../services/vinculo-loja.service';
import { LojaService } from '../../../../services/loja.service';
import { UsuarioService } from '../../../../services/usuario.service';

const mockLojas = [
  { id: 'loja-1', nome: 'Loja Centro', cnpjLoja: '11222333000181', endereco: null, ativa: true },
  { id: 'loja-2', nome: 'Loja Sul', cnpjLoja: '12345678000195', endereco: null, ativa: false },
];

const mockVinculos = [
  { id: 'v-1', usuarioId: 'u-1', nomeUsuario: 'João Silva', emailUsuario: 'joao@test.com', papel: 'vendedor' as const, ativo: true },
];

const mockUsuarios = [
  { id: 'u-1', login: 'joao', nome: 'João Silva', email: 'joao@test.com', role: 'vendedor', ativo: true, empresaId: 'emp-1' },
  { id: 'u-2', login: 'maria', nome: 'Maria Costa', email: 'maria@test.com', role: 'admin', ativo: true, empresaId: 'emp-1' },
];

describe('VinculosTabComponent', () => {
  let fixture: ComponentFixture<VinculosTabComponent>;
  let component: any;
  let vinculoServiceSpy: jasmine.SpyObj<VinculoLojaService>;
  let lojaServiceSpy: jasmine.SpyObj<LojaService>;
  let usuarioServiceSpy: jasmine.SpyObj<UsuarioService>;

  beforeEach(async () => {
    vinculoServiceSpy = jasmine.createSpyObj('VinculoLojaService', ['listarPorLoja', 'criar', 'remover']);
    lojaServiceSpy = jasmine.createSpyObj('LojaService', ['listar']);
    usuarioServiceSpy = jasmine.createSpyObj('UsuarioService', ['listar']);

    lojaServiceSpy.listar.and.returnValue(of(mockLojas));
    vinculoServiceSpy.listarPorLoja.and.returnValue(of(mockVinculos));
    vinculoServiceSpy.criar.and.returnValue(of(mockVinculos[0]));
    vinculoServiceSpy.remover.and.returnValue(of(undefined));
    usuarioServiceSpy.listar.and.returnValue(of(mockUsuarios));

    await TestBed.configureTestingModule({
      imports: [VinculosTabComponent, ReactiveFormsModule],
      providers: [
        { provide: VinculoLojaService, useValue: vinculoServiceSpy },
        { provide: LojaService, useValue: lojaServiceSpy },
        { provide: UsuarioService, useValue: usuarioServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VinculosTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load only active lojas on init', fakeAsync(() => {
    tick();
    fixture.detectChanges();
    expect(component.lojas().length).toBe(1);
    expect(component.lojas()[0].id).toBe('loja-1');
  }));

  it('should have botaoAddDesabilitado=true when no loja is selected', () => {
    expect(component.botaoAddDesabilitado()).toBeTrue();
  });

  it('should have botaoAddDesabilitado=false when lojaId is set', () => {
    component.lojaId.set('loja-1');
    expect(component.botaoAddDesabilitado()).toBeFalse();
  });

  it('should call carregarVinculos when onLojaChange is called with an id', fakeAsync(() => {
    component.onLojaChange('loja-1');
    tick();
    expect(vinculoServiceSpy.listarPorLoja).toHaveBeenCalledWith('loja-1');
  }));

  it('should render vinculos list with user name and papel badge', fakeAsync(() => {
    component.lojaId.set('loja-1');
    component.vinculos.set(mockVinculos);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('João Silva');
  }));

  it('should set confirmandoRemover when confirmarRemover is called', () => {
    component.confirmarRemover('u-1');
    expect(component.confirmandoRemover()).toBe('u-1');
  });

  it('should NOT call VinculoLojaService.remover before confirmation', () => {
    component.lojaId.set('loja-1');
    component.confirmarRemover('u-1');
    fixture.detectChanges();
    expect(vinculoServiceSpy.remover).not.toHaveBeenCalled();
  });

  it('should call VinculoLojaService.remover after remover() is explicitly called', fakeAsync(() => {
    component.lojaId.set('loja-1');
    vinculoServiceSpy.listarPorLoja.and.returnValue(of([]));
    component.remover('u-1');
    tick();
    expect(vinculoServiceSpy.remover).toHaveBeenCalledWith('loja-1', 'u-1');
  }));

  it('should show empty lojas message when lojas() is empty', fakeAsync(() => {
    lojaServiceSpy.listar.and.returnValue(of([]));
    component.carregarLojas();
    tick();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Nenhuma loja ativa');
  }));

  it('should show token warning text in confirmation dialog', () => {
    component.lojaId.set('loja-1');
    component.confirmarRemover('u-1');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('tokens ativos');
  });

  it('should open add form when abrirAddVinculo is called', () => {
    component.lojaId.set('loja-1');
    component.abrirAddVinculo();
    expect(component.showAddForm()).toBeTrue();
  });

  it('should close add form when fecharAddForm is called', () => {
    component.abrirAddVinculo();
    component.fecharAddForm();
    expect(component.showAddForm()).toBeFalse();
  });

  it('should call VinculoLojaService.criar on salvarVinculo with valid form', fakeAsync(() => {
    component.lojaId.set('loja-1');
    vinculoServiceSpy.listarPorLoja.and.returnValue(of(mockVinculos));
    usuarioServiceSpy.listar.and.returnValue(of(mockUsuarios));
    component.abrirAddVinculo();
    component.addForm.setValue({ usuarioId: 'u-2', papel: 'vendedor' });
    component.salvarVinculo();
    tick();
    expect(vinculoServiceSpy.criar).toHaveBeenCalledWith('loja-1', { usuarioId: 'u-2', papel: 'vendedor' });
    expect(component.showAddForm()).toBeFalse();
  }));

  it('should not call criar when addForm is invalid', () => {
    component.lojaId.set('loja-1');
    component.abrirAddVinculo();
    component.addForm.reset();
    component.salvarVinculo();
    expect(vinculoServiceSpy.criar).not.toHaveBeenCalled();
  });

  it('should clear confirmandoRemover when cancelarRemover is called', () => {
    component.confirmarRemover('u-1');
    component.cancelarRemover();
    expect(component.confirmandoRemover()).toBeNull();
  });

  it('should return correct label from labelPapel', () => {
    expect(component.labelPapel('vendedor')).toBe('Vendedor');
    expect(component.labelPapel('admin')).toBe('Administrador');
    expect(component.labelPapel('gerente_vendas')).toBe('Gerente de Vendas');
  });

  it('should return papel value as fallback from labelPapel for unknown value', () => {
    expect(component.labelPapel('desconhecido')).toBe('desconhecido');
  });

  it('should clear vinculos and usuariosDisponiveis when onLojaChange called with empty string', () => {
    component.vinculos.set(mockVinculos);
    component.onLojaChange('');
    expect(component.vinculos()).toEqual([]);
    expect(component.usuariosDisponiveis()).toEqual([]);
  });

  it('should set erro when carregarLojas fails', fakeAsync(() => {

    lojaServiceSpy.listar.and.returnValue(throwError(() => new Error('error')));
    component.carregarLojas();
    tick();
    expect(component.erro()).toBe('Erro ao carregar lojas.');
  }));
});
