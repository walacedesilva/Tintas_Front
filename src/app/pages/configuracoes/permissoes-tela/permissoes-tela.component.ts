import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  PermissoesTelaService,
  MatrizPermissoesPapel,
  PermissaoTelaDto
} from '../../../services/permissoes-tela.service';

const PAPEL_LABELS: Record<string, string> = {
  admin: 'Administrador',
  gerente_vendas: 'Gerente de Vendas',
  vendedor: 'Vendedor',
  operador_estoque: 'Operador de Estoque',
  gerente_estoque: 'Gerente de Estoque',
};

const TELA_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  pdv: 'Ponto de Venda',
  estoque: 'Estoque',
  fiscal: 'Fiscal',
  clientes: 'Clientes',
  usuarios: 'Usuários',
  relatorios: 'Relatórios',
  configuracoes: 'Configurações',
  orcamentos: 'Orçamentos',
  empresas: 'Empresas',
};

@Component({
  selector: 'app-permissoes-tela',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-5xl">
      <div class="mb-6">
        <h1 class="text-xl font-semibold text-gray-800">Permissões de Tela</h1>
        <p class="text-sm text-gray-500 mt-1">
          Configure quais telas cada papel pode acessar. As permissões entram em vigor no próximo login.
        </p>
      </div>

      @if (loading()) {
        <div class="text-center py-12 text-gray-400">Carregando...</div>
      } @else if (error()) {
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {{ error() }}
        </div>
      } @else {
        <div class="space-y-6">
          @for (papel of papeis(); track papel.papel) {
            <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div class="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
                <h2 class="font-medium text-gray-700">{{ labelPapel(papel.papel) }}</h2>
                <button
                  (click)="salvar(papel)"
                  [disabled]="salvando() === papel.papel"
                  class="text-sm px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {{ salvando() === papel.papel ? 'Salvando...' : 'Salvar' }}
                </button>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-0 divide-x divide-y divide-gray-100">
                @for (tela of papel.telas; track tela.codigoTela) {
                  <label class="flex items-center gap-2.5 px-4 py-3 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      [(ngModel)]="tela.permitido"
                      [disabled]="papel.papel === 'admin' && tela.codigoTela === 'configuracoes'"
                      class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span class="text-sm text-gray-700">{{ labelTela(tela.codigoTela) }}</span>
                  </label>
                }
              </div>
            </div>
          }
        </div>
      }

      @if (successMsg()) {
        <div class="fixed bottom-4 right-4 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm">
          {{ successMsg() }}
        </div>
      }
    </div>
  `
})
export class PermissoesTelaComponent implements OnInit {
  private svc = inject(PermissoesTelaService);

  papeis    = signal<MatrizPermissoesPapel[]>([]);
  loading   = signal(true);
  error     = signal<string | null>(null);
  salvando  = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  ngOnInit(): void {
    this.svc.listar().subscribe({
      next: res => {
        this.papeis.set(res.papeis);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Erro ao carregar permissões.');
        this.loading.set(false);
      }
    });
  }

  labelPapel(papel: string): string {
    return PAPEL_LABELS[papel] ?? papel;
  }

  labelTela(tela: string): string {
    return TELA_LABELS[tela] ?? tela;
  }

  salvar(papel: MatrizPermissoesPapel): void {
    this.salvando.set(papel.papel);
    this.svc.atualizar(papel.papel, papel.telas).subscribe({
      next: () => {
        this.salvando.set(null);
        this.successMsg.set(`Permissões de "${this.labelPapel(papel.papel)}" salvas com sucesso.`);
        setTimeout(() => this.successMsg.set(null), 3000);
      },
      error: (err) => {
        this.salvando.set(null);
        const msg = err?.error?.error ?? 'Erro ao salvar permissões.';
        this.error.set(msg);
        setTimeout(() => this.error.set(null), 5000);
      }
    });
  }
}
