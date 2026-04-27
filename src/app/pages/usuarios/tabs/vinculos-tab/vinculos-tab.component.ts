import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LojaService, LojaResponse } from '../../../../services/loja.service';
import { VinculoLojaService, VinculoLojaResponse, PAPEIS_LOJA } from '../../../../services/vinculo-loja.service';
import { UsuarioService, UsuarioResponse } from '../../../../services/usuario.service';

@Component({
  selector: 'app-vinculos-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vinculos-tab.component.html',
})
export class VinculosTabComponent implements OnInit {
  private vinculoService = inject(VinculoLojaService);
  private lojaService = inject(LojaService);
  private usuarioService = inject(UsuarioService);
  private fb = inject(FormBuilder);

  lojas = signal<LojaResponse[]>([]);
  vinculos = signal<VinculoLojaResponse[]>([]);
  usuariosDisponiveis = signal<UsuarioResponse[]>([]);
  lojaId = signal<string>('');
  loadingLojas = signal(false);
  loadingVinculos = signal(false);
  erro = signal('');
  showAddForm = signal(false);
  saving = signal(false);
  confirmandoRemover = signal<string | null>(null);

  botaoAddDesabilitado = computed(() => !this.lojaId());

  readonly papeis = PAPEIS_LOJA;

  addForm = this.fb.group({
    usuarioId: ['', Validators.required],
    papel: ['', Validators.required],
  });

  ngOnInit() {
    this.carregarLojas();
  }

  carregarLojas() {
    this.loadingLojas.set(true);
    this.lojaService.listar().subscribe({
      next: (data) => {
        this.lojas.set(data.filter(l => l.ativa));
        this.loadingLojas.set(false);
      },
      error: () => {
        this.erro.set('Erro ao carregar lojas.');
        this.loadingLojas.set(false);
      },
    });
  }

  onLojaChange(id: string) {
    this.lojaId.set(id);
    if (id) {
      this.carregarVinculos(id);
    } else {
      this.vinculos.set([]);
      this.usuariosDisponiveis.set([]);
    }
  }

  carregarVinculos(lojaId: string) {
    this.loadingVinculos.set(true);
    this.vinculoService.listarPorLoja(lojaId).subscribe({
      next: (data) => {
        this.vinculos.set(data);
        this.loadingVinculos.set(false);
        this.carregarUsuariosDisponiveis(lojaId);
      },
      error: () => {
        this.erro.set('Erro ao carregar vínculos.');
        this.loadingVinculos.set(false);
      },
    });
  }

  carregarUsuariosDisponiveis(lojaId: string) {
    this.usuarioService.listar().subscribe({
      next: (todos) => {
        const vinculadosIds = new Set(this.vinculos().map(v => v.usuarioId));
        this.usuariosDisponiveis.set(todos.filter(u => u.ativo && !vinculadosIds.has(u.id)));
      },
    });
  }

  abrirAddVinculo() {
    this.addForm.reset({ usuarioId: '', papel: '' });
    this.showAddForm.set(true);
  }

  fecharAddForm() {
    this.showAddForm.set(false);
  }

  salvarVinculo() {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const v = this.addForm.value;
    this.vinculoService.criar(this.lojaId(), { usuarioId: v.usuarioId!, papel: v.papel as any }).subscribe({
      next: () => {
        this.saving.set(false);
        this.showAddForm.set(false);
        this.carregarVinculos(this.lojaId()); // carregarUsuariosDisponiveis chamado dentro
      },
      error: (err) => {
        this.erro.set(err?.error?.error ?? 'Erro ao criar vínculo.');
        this.saving.set(false);
      },
    });
  }

  confirmarRemover(usuarioId: string) {
    this.confirmandoRemover.set(usuarioId);
  }

  cancelarRemover() {
    this.confirmandoRemover.set(null);
  }

  remover(usuarioId: string) {
    this.vinculoService.remover(this.lojaId(), usuarioId).subscribe({
      next: () => {
        this.confirmandoRemover.set(null);
        this.carregarVinculos(this.lojaId());
        this.carregarUsuariosDisponiveis(this.lojaId());
      },
      error: () => {
        this.confirmandoRemover.set(null);
        this.erro.set('Erro ao remover vínculo.');
      },
    });
  }

  labelPapel(papel: string): string {
    return this.papeis.find(p => p.value === papel)?.label ?? papel;
  }
}

