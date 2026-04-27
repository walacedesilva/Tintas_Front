import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LojaService, LojaResponse, CriarLojaRequest, AtualizarLojaRequest } from '../../../../services/loja.service';
import { cnpjValidator, normalizarCnpj, formatarCnpj } from '../../../../utils/cnpj-validator';

@Component({
  selector: 'app-lojas-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './lojas-tab.component.html',
})
export class LojasTabComponent implements OnInit {
  private lojaService = inject(LojaService);
  private fb = inject(FormBuilder);

  lojas = signal<LojaResponse[]>([]);
  loading = signal(false);
  erro = signal('');
  showForm = signal(false);
  editando = signal<LojaResponse | null>(null);
  saving = signal(false);
  formError = signal('');
  confirmando = signal<string | null>(null);

  formatarCnpj = formatarCnpj;

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    cnpj: ['', [Validators.required, cnpjValidator]],
    endereco: ['', Validators.maxLength(250)],
  });

  ngOnInit() {
    this.carregarLojas();
  }

  carregarLojas() {
    this.loading.set(true);
    this.erro.set('');
    this.lojaService.listar().subscribe({
      next: (data) => {
        this.lojas.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.erro.set('Erro ao carregar lojas.');
        this.loading.set(false);
      },
    });
  }

  abrirNova() {
    this.form.reset({ nome: '', cnpj: '', endereco: '' });
    this.formError.set('');
    this.editando.set(null);
    this.showForm.set(true);
  }

  abrirEdicao(loja: LojaResponse) {
    this.form.patchValue({
      nome: loja.nome,
      cnpj: loja.cnpjLoja ?? '',
      endereco: loja.endereco ?? '',
    });
    this.formError.set('');
    this.editando.set(loja);
    this.showForm.set(true);
  }

  fecharForm() {
    this.showForm.set(false);
    this.editando.set(null);
  }

  salvar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.formError.set('');
    const v = this.form.value;
    const cnpjNormalizado = normalizarCnpj(v.cnpj ?? '');
    const loja = this.editando();

    if (loja) {
      const request: AtualizarLojaRequest = {
        nome: v.nome!,
        cnpj: cnpjNormalizado,
        endereco: v.endereco ?? undefined,
      };
      this.lojaService.atualizar(loja.id, request).subscribe({
        next: () => {
          this.saving.set(false);
          this.showForm.set(false);
          this.editando.set(null);
          this.carregarLojas();
        },
        error: (err) => {
          this.formError.set(err?.error?.error ?? 'Erro ao atualizar loja.');
          this.saving.set(false);
        },
      });
    } else {
      const request: CriarLojaRequest = {
        nome: v.nome!,
        cnpj: cnpjNormalizado,
        endereco: v.endereco ?? undefined,
      };
      this.lojaService.criar(request).subscribe({
        next: () => {
          this.saving.set(false);
          this.showForm.set(false);
          this.carregarLojas();
        },
        error: (err) => {
          this.formError.set(err?.error?.error ?? 'Erro ao criar loja.');
          this.saving.set(false);
        },
      });
    }
  }

  confirmarDesativar(id: string) {
    this.confirmando.set(id);
  }

  cancelarDesativar() {
    this.confirmando.set(null);
  }

  desativar(id: string) {
    this.lojaService.desativar(id).subscribe({
      next: () => {
        this.confirmando.set(null);
        this.carregarLojas();
      },
      error: () => {
        this.confirmando.set(null);
        this.erro.set('Erro ao desativar loja.');
      },
    });
  }

  ativar(loja: LojaResponse) {
    const cnpj = normalizarCnpj(loja.cnpjLoja ?? '');
    if (!cnpj) {
      this.erro.set('CNPJ da loja não encontrado. Edite a loja antes de ativá-la.');
      return;
    }
    const request: AtualizarLojaRequest = {
      nome: loja.nome,
      cnpj,
      endereco: loja.endereco ?? undefined,
      ativa: true,
    };
    this.lojaService.atualizar(loja.id, request).subscribe({
      next: () => this.carregarLojas(),
      error: () => this.erro.set('Erro ao ativar loja.'),
    });
  }
}

