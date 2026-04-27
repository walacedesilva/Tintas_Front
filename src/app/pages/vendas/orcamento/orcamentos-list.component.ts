import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrcamentoResponse, OrcamentoService } from '../../../services/orcamento.service';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-orcamentos-list',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  template: `
    <div class="p-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Orçamentos</h2>
        <button (click)="novo()"
          class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Novo Orçamento
        </button>
      </div>

      @if (carregando()) {
        <div class="text-center py-16 text-gray-400">Carregando...</div>
      }

      @if (!carregando() && orcamentos().length === 0) {
        <div class="text-center py-16 text-gray-400">
          Nenhum orçamento encontrado.
        </div>
      }

      @if (!carregando() && orcamentos().length > 0) {
        <div class="overflow-x-auto rounded-lg border border-gray-200">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                <th class="text-left px-4 py-3 font-medium text-gray-600">Data</th>
                <th class="text-left px-4 py-3 font-medium text-gray-600">Válido até</th>
                <th class="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                <th class="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              @for (orc of orcamentos(); track orc.id) {
                <tr class="border-t border-gray-100 hover:bg-gray-50">
                  <td class="px-4 py-3 font-mono text-xs text-gray-500">{{ orc.id.slice(0, 8) }}...</td>
                  <td class="px-4 py-3">{{ orc.dataCriacao | date:'dd/MM/yyyy' }}</td>
                  <td class="px-4 py-3" [class.text-red-600]="isExpirado(orc)">
                    {{ orc.dataValidade | date:'dd/MM/yyyy' }}
                  </td>
                  <td class="px-4 py-3 text-right font-medium">{{ orc.total | currency:'BRL' }}</td>
                  <td class="px-4 py-3 text-center">
                    <span [class]="statusClass(orc.status)">{{ orc.status }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <button (click)="ver(orc.id)"
                      class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Ver →
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class OrcamentosListComponent implements OnInit {
  private service = inject(OrcamentoService);
  private router = inject(Router);

  orcamentos = signal<OrcamentoResponse[]>([]);
  carregando = signal(true);

  ngOnInit() {
    this.service.listarOrcamentos({ pageSize: 50 }).subscribe({
      next: (r) => {
        this.orcamentos.set(r.items);
        this.carregando.set(false);
      },
      error: () => this.carregando.set(false),
    });
  }

  statusClass(status: string): string {
    const base = 'px-2 py-0.5 rounded text-xs font-semibold ';
    const map: Record<string, string> = {
      'Aberto': 'bg-blue-100 text-blue-800',
      'Convertido': 'bg-green-100 text-green-800',
      'Expirado': 'bg-orange-100 text-orange-800',
      'Cancelado': 'bg-red-100 text-red-800',
    };
    return base + (map[status] ?? 'bg-gray-100 text-gray-700');
  }

  isExpirado(orc: OrcamentoResponse): boolean {
    return orc.status === 'Aberto' && new Date(orc.dataValidade) < new Date();
  }

  novo() {
    this.router.navigate(['/app/vendas/orcamentos/novo']);
  }

  ver(id: string) {
    this.router.navigate(['/app/vendas/orcamentos', id]);
  }
}
