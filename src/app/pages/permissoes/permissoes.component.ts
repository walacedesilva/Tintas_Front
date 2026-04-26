import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PermissaoService, PermissaoUsuarioDto } from '../../services/permissao.service';
import { LojaService, LojaResponse } from '../../services/loja.service';

const PAPEIS = [
  { value: 'admin', label: 'Administrador' },
  { value: 'gerente_vendas', label: 'Gerente de Vendas' },
  { value: 'vendedor', label: 'Vendedor' },
  { value: 'operador_estoque', label: 'Operador de Estoque' },
  { value: 'operador_fiscal', label: 'Operador Fiscal' },
];

@Component({
  selector: 'app-permissoes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './permissoes.component.html',
})
export class PermissoesComponent implements OnInit {
  private permissaoService = inject(PermissaoService);
  private lojaService = inject(LojaService);

  usuarios = signal<PermissaoUsuarioDto[]>([]);
  lojas = signal<LojaResponse[]>([]);
  carregando = signal(false);
  erro = signal<string | null>(null);
  salvandoId = signal<string | null>(null);

  // Filters (US3)
  searchText = signal('');
  filtroLojaId = signal('');
  page = signal(1);
  pageSize = signal(20);
  total = signal(0);

  // Add-binding state
  lojaParaAdicionar: Record<string, string> = {};

  readonly papeis = PAPEIS;

  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  ngOnInit(): void {
    this.carregarLojas();
    this.carregarPermissoes();
  }

  carregarLojas(): void {
    this.lojaService.listar().subscribe({
      next: data => this.lojas.set(data),
      error: () => {},
    });
  }

  carregarPermissoes(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.permissaoService.listarPermissoes({
      lojaId: this.filtroLojaId() || undefined,
      search: this.searchText() || undefined,
      page: this.page(),
      pageSize: this.pageSize(),
    }).subscribe({
      next: res => {
        this.usuarios.set(res.items);
        this.total.set(res.total);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Erro ao carregar permissões.');
        this.carregando.set(false);
      },
    });
  }

  aplicarFiltros(): void {
    this.page.set(1);
    this.carregarPermissoes();
  }

  adicionarVinculo(usuario: PermissaoUsuarioDto): void {
    const lojaId = this.lojaParaAdicionar[usuario.id];
    if (!lojaId) return;

    this.salvandoId.set(usuario.id);
    this.permissaoService.adicionarVinculo(usuario.id, lojaId).subscribe({
      next: vinculo => {
        this.salvandoId.set(null);
        this.lojaParaAdicionar[usuario.id] = '';
        this.carregarPermissoes();
      },
      error: (err) => {
        this.salvandoId.set(null);
        this.erro.set(err?.error?.error ?? 'Erro ao adicionar vínculo.');
      },
    });
  }

  removerVinculo(vinculoId: string, usuarioId: string): void {
    this.salvandoId.set(usuarioId);
    this.permissaoService.removerVinculo(vinculoId).subscribe({
      next: () => {
        this.salvandoId.set(null);
        this.carregarPermissoes();
      },
      error: (err) => {
        this.salvandoId.set(null);
        this.erro.set(err?.error?.error ?? 'Erro ao remover vínculo.');
      },
    });
  }

  atualizarPapel(usuario: PermissaoUsuarioDto, novoPapel: string): void {
    if (!novoPapel || novoPapel === usuario.role) return;

    this.salvandoId.set(usuario.id);
    this.permissaoService.atualizarPapel(usuario.id, novoPapel).subscribe({
      next: () => {
        this.salvandoId.set(null);
        this.carregarPermissoes();
      },
      error: (err) => {
        this.salvandoId.set(null);
        this.erro.set(err?.error?.error ?? 'Erro ao atualizar papel.');
      },
    });
  }

  nomeLoja(lojaId: string): string {
    return this.lojas().find(l => l.id === lojaId)?.nome ?? lojaId;
  }

  hasNoActiveVinculo(usuario: PermissaoUsuarioDto): boolean {
    return usuario.vinculos.length === 0 || !usuario.vinculos.some(v => v.ativo);
  }

  proxPagina(): void {
    if (this.page() < this.totalPages()) {
      this.page.update(p => p + 1);
      this.carregarPermissoes();
    }
  }

  antPagina(): void {
    if (this.page() > 1) {
      this.page.update(p => p - 1);
      this.carregarPermissoes();
    }
  }
}
