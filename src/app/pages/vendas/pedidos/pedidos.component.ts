import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VendaService, PedidoResponse, PagedResult } from '../../../services/venda.service';
import { FiscalService } from '../../../services/fiscal.service';
import { AuthService } from '../../../services/auth.service';

const STATUS_COLORS: Record<string, string> = {
  Rascunho:   'bg-gray-100 text-gray-700',
  Confirmado: 'bg-blue-100 text-blue-700',
  Finalizado: 'bg-green-100 text-green-700',
  Cancelado:  'bg-red-100 text-red-700',
};

@Component({
  selector: 'app-pedidos-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="space-y-4">

      <!-- Filters -->
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select
              [(ngModel)]="filtroStatus"
              (ngModelChange)="buscar(1)"
              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
            >
              <option value="">Todos</option>
              <option value="Rascunho">Rascunho</option>
              <option value="Confirmado">Confirmado</option>
              <option value="Finalizado">Finalizado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">De</label>
            <input
              type="date"
              [(ngModel)]="filtroDe"
              (ngModelChange)="buscar(1)"
              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Até</label>
            <input
              type="date"
              [(ngModel)]="filtroAte"
              (ngModelChange)="buscar(1)"
              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
            />
          </div>
          <div class="flex items-end">
            <button
              (click)="limparFiltros()"
              class="w-full px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        @if (carregando()) {
          <div class="p-12 text-center text-sm text-gray-400">Carregando…</div>
        } @else if (resultado()?.items?.length === 0) {
          <div class="p-12 text-center text-sm text-gray-400">Nenhum pedido encontrado.</div>
        } @else {
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Data</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Itens</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (p of resultado()?.items; track p.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3 font-mono text-xs text-gray-500">{{ p.id | slice:0:8 }}…</td>
                  <td class="px-4 py-3 text-gray-700">{{ p.dataPedido | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td class="px-4 py-3 font-mono text-xs text-gray-500">{{ p.clienteId | slice:0:8 }}…</td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-0.5 rounded-full text-xs font-medium {{ statusClass(p.status) }}">
                      {{ p.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right font-semibold text-gray-800">
                    {{ p.total | currency:'BRL':'symbol':'1.2-2' }}
                  </td>
                  <td class="px-4 py-3 text-right text-gray-600">{{ p.itens.length }}</td>
                  <td class="px-4 py-3 text-right">
                    @if (p.status === 'Finalizado' && canEmitirNFe()) {
                      <button
                        (click)="emitirNFe(p)"
                        [disabled]="emitindo() === p.id"
                        class="px-3 py-1 text-xs bg-violet-600 text-white rounded hover:bg-violet-700 disabled:opacity-50 transition-colors">
                        @if (emitindo() === p.id) { Emitindo… } @else { Emitir NF-e }
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Pagination -->
      @if ((resultado()?.total ?? 0) > pageSize) {
        <div class="flex items-center justify-between text-sm text-gray-500">
          <span>
            Mostrando {{ (currentPage() - 1) * pageSize + 1 }}–{{ min(currentPage() * pageSize, resultado()?.total ?? 0) }}
            de {{ resultado()?.total }} pedidos
          </span>
          <div class="flex gap-2">
            <button
              (click)="buscar(currentPage() - 1)"
              [disabled]="currentPage() === 1"
              class="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            <button
              (click)="buscar(currentPage() + 1)"
              [disabled]="currentPage() * pageSize >= (resultado()?.total ?? 0)"
              class="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Próximo →
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class PedidosListComponent implements OnInit {
  private vendaService = inject(VendaService);
  private fiscalService = inject(FiscalService);
  private authService = inject(AuthService);

  filtroStatus = '';
  filtroDe = '';
  filtroAte = '';
  readonly pageSize = 20;

  readonly resultado = signal<PagedResult<PedidoResponse> | null>(null);
  readonly carregando = signal(false);
  readonly currentPage = signal(1);
  readonly emitindo = signal<string | null>(null);

  readonly canEmitirNFe = signal(false);

  ngOnInit(): void {
    const role = this.authService.getRole();
    this.canEmitirNFe.set(role === 'admin' || role === 'operador_fiscal');
    this.buscar(1);
  }

  buscar(page: number): void {
    this.carregando.set(true);
    this.currentPage.set(page);

    const params: Record<string, string | number> = { page, pageSize: this.pageSize };
    if (this.filtroStatus) params['status'] = this.filtroStatus;
    if (this.filtroDe) params['de'] = this.filtroDe;
    if (this.filtroAte) params['ate'] = this.filtroAte;

    this.vendaService.listarPedidos(params as any).subscribe({
      next: r => { this.resultado.set(r); this.carregando.set(false); },
      error: () => this.carregando.set(false),
    });
  }

  limparFiltros(): void {
    this.filtroStatus = '';
    this.filtroDe = '';
    this.filtroAte = '';
    this.buscar(1);
  }

  statusClass(status: string): string {
    return STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700';
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  emitirNFe(pedido: PedidoResponse): void {
    this.emitindo.set(pedido.id);
    this.fiscalService.emitirNFe({
      empresaId: pedido.empresaId,
      lojaId: pedido.lojaId ?? '',
      pedidoId: pedido.id,
      modelo: 65, // NFC-e default; adjust as needed
      serie: 1,
      ambiente: 'Homologacao',
    }).subscribe({
      next: () => {
        this.emitindo.set(null);
        alert('NF-e emitida com sucesso! Acompanhe em Fiscal > NF-e.');
      },
      error: (err) => {
        this.emitindo.set(null);
        const msg = err?.error?.message ?? 'Erro ao emitir NF-e.';
        alert(msg);
      },
    });
  }
}
