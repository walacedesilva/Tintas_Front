import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstoqueService, EstoqueLojaResponse } from '../../../services/estoque.service';
import { ProdutoService, ProdutoResponse } from '../../../services/produto.service';
import { forkJoin } from 'rxjs';

interface EstoqueComProduto extends EstoqueLojaResponse {
  produtoNome: string;
  produtoCodigo: string;
  estoqueMinimo: number;
  abaixoMinimo: boolean;
}

@Component({
  selector: 'app-niveis',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <div class="flex items-center justify-between mb-4">
        <p class="text-sm text-gray-500">Saldo atual por produto e loja</p>
        <button (click)="load()"
          class="text-sm text-emerald-600 hover:text-emerald-800 font-medium transition-colors flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Atualizar
        </button>
      </div>

      @if (error()) {
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{{ error() }}</div>
      }

      @if (lowStockCount() > 0) {
        <div class="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-4 text-sm flex items-center gap-2">
          <svg class="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
          <strong>{{ lowStockCount() }}</strong>&nbsp;produto(s) com estoque abaixo do mínimo.
        </div>
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
        } @else if (estoques().length === 0) {
          <div class="text-center py-16 text-gray-400 text-sm">Nenhum registro de estoque encontrado.</div>
        } @else {
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="text-left px-4 py-3 font-medium text-gray-600">Produto</th>
                <th class="text-left px-4 py-3 font-medium text-gray-600">Loja</th>
                <th class="text-right px-4 py-3 font-medium text-gray-600">Quantidade</th>
                <th class="text-right px-4 py-3 font-medium text-gray-600">Est. Mínimo</th>
                <th class="text-center px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (e of estoques(); track (e.produtoId + e.lojaId)) {
                <tr [class]="e.abaixoMinimo ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-gray-50'" class="transition-colors">
                  <td class="px-4 py-3">
                    <span class="font-medium text-gray-900">{{ e.produtoNome }}</span>
                    <span class="text-xs text-gray-400 ml-1">({{ e.produtoCodigo }})</span>
                  </td>
                  <td class="px-4 py-3 font-mono text-xs text-gray-600">{{ e.lojaId }}</td>
                  <td class="px-4 py-3 text-right font-medium" [class]="e.abaixoMinimo ? 'text-amber-700' : 'text-gray-900'">
                    {{ e.quantidade }}
                  </td>
                  <td class="px-4 py-3 text-right text-gray-500">{{ e.estoqueMinimo }}</td>
                  <td class="px-4 py-3 text-center">
                    @if (e.abaixoMinimo) {
                      <span class="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Abaixo mínimo</span>
                    } @else {
                      <span class="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">OK</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `,
})
export class NiveisEstoqueComponent implements OnInit {
  private estoquesSvc = inject(EstoqueService);
  private produtoSvc = inject(ProdutoService);

  estoques = signal<EstoqueComProduto[]>([]);
  loading = signal(false);
  error = signal('');
  lowStockCount = computed(() => this.estoques().filter(e => e.abaixoMinimo).length);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      estoques: this.estoquesSvc.listarEstoque(),
      produtos: this.produtoSvc.listar(),
    }).subscribe({
      next: ({ estoques, produtos }) => {
        const mapa = new Map<string, ProdutoResponse>(produtos.map(p => [p.id, p]));
        const combined = estoques.map(e => {
          const prod = mapa.get(e.produtoId);
          const estoqueMinimo = prod?.estoqueMinimo ?? 0;
          return {
            ...e,
            produtoNome: prod?.nome ?? e.produtoId,
            produtoCodigo: prod?.codigo ?? '',
            estoqueMinimo,
            abaixoMinimo: e.quantidade < estoqueMinimo,
          };
        });
        this.estoques.set(combined);
        this.loading.set(false);
      },
      error: () => { this.error.set('Erro ao carregar níveis de estoque.'); this.loading.set(false); },
    });
  }
}
