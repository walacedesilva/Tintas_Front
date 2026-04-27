import { throwError } from 'rxjs';

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { LojasTabComponent } from './lojas-tab.component';
import { LojaService } from '../../../../services/loja.service';

const mockLojas = [
  { id: 'loja-1', nome: 'Loja Centro', cnpjLoja: '11222333000181', endereco: 'Rua A, 1', ativa: true },
  { id: 'loja-2', nome: 'Loja Sul', cnpjLoja: '12345678000195', endereco: null, ativa: false },
];

describe('LojasTabComponent', () => {
  let fixture: ComponentFixture<LojasTabComponent>;
  let component: any;
  let lojaServiceSpy: jasmine.SpyObj<LojaService>;

  beforeEach(async () => {
    lojaServiceSpy = jasmine.createSpyObj('LojaService', ['listar', 'criar', 'atualizar', 'desativar']);
    lojaServiceSpy.listar.and.returnValue(of(mockLojas));
    lojaServiceSpy.criar.and.returnValue(of(mockLojas[0]));
    lojaServiceSpy.atualizar.and.returnValue(of({ ...mockLojas[1], ativa: true }));
    lojaServiceSpy.desativar.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [LojasTabComponent, ReactiveFormsModule],
      providers: [
        { provide: LojaService, useValue: lojaServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LojasTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render lojas list on init', fakeAsync(() => {
    tick();
    fixture.detectChanges();
    expect(component.lojas()).toEqual(mockLojas);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Loja Centro');
  }));

  it('should display Inativa badge for ativa=false loja', fakeAsync(() => {
    tick();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Inativa');
  }));

  it('should show CNPJ invalid error and form invalid for all-equal CNPJ', () => {
    component.abrirNova();
    fixture.detectChanges();
    const cnpjControl = component.form.get('cnpj');
    cnpjControl.setValue('11111111111111');
    cnpjControl.markAsTouched();
    fixture.detectChanges();
    expect(cnpjControl.hasError('cnpjInvalido')).toBeTrue();
    expect(component.form.invalid).toBeTrue();
  });

  it('should have valid form for valid CNPJ with all required fields', () => {
    component.abrirNova();
    fixture.detectChanges();
    component.form.setValue({ nome: 'Loja Teste', cnpj: '11222333000181', endereco: '' });
    fixture.detectChanges();
    expect(component.form.valid).toBeTrue();
  });

  it('should call LojaService.criar with normalized CNPJ (no mask)', fakeAsync(() => {
    component.abrirNova();
    component.form.setValue({ nome: 'Loja Teste', cnpj: '11.222.333/0001-81', endereco: '' });
    component.salvar();
    tick();
    expect(lojaServiceSpy.criar).toHaveBeenCalledWith(
      jasmine.objectContaining({ cnpj: '11222333000181' })
    );
  }));

  it('should set confirmando signal when confirmarDesativar is called', () => {
    component.confirmarDesativar('loja-1');
    expect(component.confirmando()).toBe('loja-1');
  });

  it('should clear confirmando when cancelarDesativar is called', () => {
    component.confirmarDesativar('loja-1');
    component.cancelarDesativar();
    expect(component.confirmando()).toBeNull();
  });

  it('should call LojaService.desativar only after desativar() is explicitly called', fakeAsync(() => {
    component.confirmarDesativar('loja-1');
    fixture.detectChanges();
    expect(lojaServiceSpy.desativar).not.toHaveBeenCalled();
    component.desativar('loja-1');
    tick();
    expect(lojaServiceSpy.desativar).toHaveBeenCalledWith('loja-1');
  }));

  it('should call LojaService.atualizar with ativa=true when ativar is called', fakeAsync(() => {
    component.ativar(mockLojas[1]);
    tick();
    expect(lojaServiceSpy.atualizar).toHaveBeenCalledWith(
      'loja-2',
      jasmine.objectContaining({ ativa: true })
    );
  }));

  it('should populate form and set editando when abrirEdicao is called', () => {
    component.abrirEdicao(mockLojas[0]);
    expect(component.showForm()).toBeTrue();
    expect(component.editando()).toEqual(mockLojas[0]);
    expect(component.form.get('nome')?.value).toBe('Loja Centro');
  });

  it('should close form and clear editando when fecharForm is called', () => {
    component.abrirEdicao(mockLojas[0]);
    component.fecharForm();
    expect(component.showForm()).toBeFalse();
    expect(component.editando()).toBeNull();
  });

  it('should call LojaService.atualizar (not criar) when salvar is called with editando set', fakeAsync(() => {
    component.abrirEdicao(mockLojas[0]);
    component.form.setValue({ nome: 'Loja Centro Editada', cnpj: '11222333000181', endereco: '' });
    component.salvar();
    tick();
    expect(lojaServiceSpy.atualizar).toHaveBeenCalledWith(
      'loja-1',
      jasmine.objectContaining({ nome: 'Loja Centro Editada', cnpj: '11222333000181' })
    );
    expect(lojaServiceSpy.criar).not.toHaveBeenCalled();
  }));

  it('should set erro on carregarLojas failure', fakeAsync(() => {
    
    lojaServiceSpy.listar.and.returnValue(throwError(() => new Error('Server error')));
    component.carregarLojas();
    tick();
    expect(component.erro()).toBe('Erro ao carregar lojas.');
  }));

  it('should not call salvar when form is invalid', () => {
    component.abrirNova();
    component.form.reset();
    component.salvar();
    expect(lojaServiceSpy.criar).not.toHaveBeenCalled();
  });
});
