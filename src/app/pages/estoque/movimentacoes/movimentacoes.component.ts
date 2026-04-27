import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { EstoqueService, MovimentacaoResponse } from '../../../services/estoque.service';
import { ProdutoService, ProdutoResponse } from '../../../services/produto.service';

@Component({
  selector: 'app-movimentacoes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div>
      <!-- Filters -->
      <div class="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <form [formGroup]="filterForm" (ngSubmit)="load()" class="flex flex-wrap gap-3 items-end">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Produto</label>
            <select formControlName="produtoId"
              class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-40">
              <option value="">Todos</option>
              @for (p of produtos(); track p.id) {
                <option [value]="p.id">{{ p.codigo }} — {{ p.nome }}</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Loja (ID)</label>
            <input type="text" formControlName="lojaId" placeholder="UUID..."
              class="border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono w-48 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <button type="submit"
            class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Filtrar
          </button>
        </form>
      </div>

      @if (error()) {
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{{ error() }}</div>
      }

      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        @if (loading()) {
          <div class="flex items-center justify-center py-16 text-gray-400">
            <svg class="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Carregando...
          </div>
        } @else if (movimentacoes().length === 0) {
          <div class="text-center py-16 text-gray-400 text-sm">Nenhuma movimentação encontrada.</div>
        } @else {
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                <th class="text-left px-4 py-3 font-medium text-gray-600">Produto</th>
                <th class="text-left px-4 py-3 font-medium text-gray-600">Loja</th>
                <th class="text-right px-4 py-3 font-medium text-gray-600">Delta</th>
                <th class="text-right px-4 py-3 font-medium text-gray-600">Antes</th>
                <th class="text-right px-4 py-3 font-medium text-gray-600">Depois</th>
                <th class="text-left px-4 py-3 font-medium text-gray-600">Data</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (m of movimentacoes(); track m.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3">
                    <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                      [class]="tipoClass(m.tipo)">
                      {{ m.tipo }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-gray-700">{{ produtoNome(m.produtoId) }}</td>
                  <td class="px-4 py-3 font-mono text-xs text-gray-500">{{ m.lojaId }}</td>
                  <td class="px-4 py-3 text-right font-medium" [class]="m.delta > 0 ? 'text-green-600' : 'text-red-600'">
                    {{ m.delta > 0 ? '+' : '' }}{{ m.delta }}
                  </td>
                  <td class="px-4 py-3 text-right text-gray-500">{{ m.quantidadeAntes }}</td>
                  <td class="px-4 py-3 text-right text-gray-700 font-medium">{{ m.quantidadeDepois }}</td>
                  <td class="px-4 py-3 text-gray-500 text-xs">{{ m.criadoEm | date:'dd/MM/yyyy HH:mm' }}</td>
                </tr>
              }
            </tbody>
          </table>

          <!-- Pagination -->
          <div class="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>Página {{ page() }}</span>
            <div class="flex gap-2">
              <button (click)="prevPage()" [disabled]="page() === 1"
                class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">
                Anterior
              </button>
              <button (click)="nextPage()" [disabled]="movimentacoes().length < pageSize"
                class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">
                Próxima
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class MovimentacoesComponent implements OnInit {
  private svc = inject(EstoqueService);
  private produtoSvc = inject(ProdutoService);
  private fb = inject(FormBuilder);

  movimentacoes = signal<MovimentacaoResponse[]>([]);
  produtos = signal<ProdutoResponse[]>([]);
  loading = signal(false);
  error = signal('');
  page = signal(1);
  readonly pageSize = 20;

  filterForm = this.fb.group({ produtoId: [''], lojaId: [''] });

  ngOnInit() {
    this.produtoSvc.listar().subscribe({ next: d => this.produtos.set(d) });
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set('');
    const v = this.filterForm.value;
    this.svc.listarMovimentacoes(
      v.produtoId || undefined,
      v.lojaId || undefined,
      this.page(),
      this.pageSize
    ).subscribe({
      next: d => { this.movimentacoes.set(d); this.loading.set(false); },
      error: () => { this.error.set('Erro ao carregar movimentações.'); this.loading.set(false); },
    });
  }

  prevPage() { if (this.page() > 1) { this.page.update(p => p - 1); this.load(); } }
  nextPage() { this.page.update(p => p + 1); this.load(); }

  produtoNome(id: string) {
    const p = this.produtos().find(x => x.id === id);
    return p ? `${p.codigo} — ${p.nome}` : id;
  }

  tipoClass(tipo: string) {
    const map: Record<string, string> = {
      'Entrada': 'bg-green-50 text-green-700',
      'Saida': 'bg-red-50 text-red-600',
      'AjusteManual': 'bg-blue-50 text-blue-700',
      'Perda': 'bg-orange-50 text-orange-700',
      'Transferencia': 'bg-purple-50 text-purple-700',
    };
    return map[tipo] ?? 'bg-gray-100 text-gray-600';
  }
}
