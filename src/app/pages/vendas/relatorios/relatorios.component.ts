import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface RelatorioItem {
  pedidoId: string;
  data: string;
  clienteId: string;
  vendedorId: string;
  lojaId: string;
  status: string;
  subtotal: number;
  desconto: number;
  total: number;
}

interface RelatorioVendasResult {
  items: RelatorioItem[];
  totalBruto: number;
  totalDesconto: number;
  totalLiquido: number;
  totalPedidos: number;
}

const BASE = 'http://localhost:8000/sales/v1';

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4">
      <h2 class="text-xl font-semibold mb-4">Relatório de Vendas</h2>

      <!-- Filtros -->
      <div class="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-500">De</label>
          <input type="date" [(ngModel)]="de" class="border rounded px-3 py-1.5 text-sm" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-500">Até</label>
          <input type="date" [(ngModel)]="ate" class="border rounded px-3 py-1.5 text-sm" />
        </div>
        <button
          (click)="buscar()"
          [disabled]="carregando()"
          class="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
          @if (carregando()) { Carregando... } @else { Buscar }
        </button>

        @if (resultado()) {
          <a [href]="csvUrl()" class="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700 inline-block">
            ↓ CSV
          </a>
          <a [href]="pdfUrl()" class="bg-red-600 text-white px-4 py-1.5 rounded text-sm hover:bg-red-700 inline-block" target="_blank">
            ↓ PDF
          </a>
        }
      </div>

      @if (erro()) {
        <div class="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{{ erro() }}</div>
      }

      @if (resultado(); as r) {
        <!-- Resumo -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div class="bg-white rounded-lg shadow p-3">
            <div class="text-xs text-gray-400">Pedidos</div>
            <div class="text-2xl font-bold">{{ r.totalPedidos }}</div>
          </div>
          <div class="bg-white rounded-lg shadow p-3">
            <div class="text-xs text-gray-400">Total Bruto</div>
            <div class="text-2xl font-bold text-blue-600">{{ r.totalBruto | currency:'BRL':'symbol':'1.2-2' }}</div>
          </div>
          <div class="bg-white rounded-lg shadow p-3">
            <div class="text-xs text-gray-400">Total Desconto</div>
            <div class="text-2xl font-bold text-amber-600">{{ r.totalDesconto | currency:'BRL':'symbol':'1.2-2' }}</div>
          </div>
          <div class="bg-white rounded-lg shadow p-3">
            <div class="text-xs text-gray-400">Total Líquido</div>
            <div class="text-2xl font-bold text-green-600">{{ r.totalLiquido | currency:'BRL':'symbol':'1.2-2' }}</div>
          </div>
        </div>

        <!-- Tabela -->
        <div class="bg-white rounded-lg shadow overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="text-left px-4 py-2">Data</th>
                <th class="text-left px-4 py-2">Pedido</th>
                <th class="text-left px-4 py-2">Status</th>
                <th class="text-right px-4 py-2">Subtotal</th>
                <th class="text-right px-4 py-2">Desconto</th>
                <th class="text-right px-4 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              @for (item of r.items; track item.pedidoId) {
                <tr class="border-b hover:bg-gray-50">
                  <td class="px-4 py-2">{{ item.data }}</td>
                  <td class="px-4 py-2 font-mono text-xs">{{ item.pedidoId.slice(0, 8) }}</td>
                  <td class="px-4 py-2">
                    <span [class]="badgeClass(item.status)">{{ item.status }}</span>
                  </td>
                  <td class="px-4 py-2 text-right">{{ item.subtotal | currency:'BRL':'symbol':'1.2-2' }}</td>
                  <td class="px-4 py-2 text-right text-amber-600">{{ item.desconto | currency:'BRL':'symbol':'1.2-2' }}</td>
                  <td class="px-4 py-2 text-right font-medium">{{ item.total | currency:'BRL':'symbol':'1.2-2' }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="text-center py-8 text-gray-400">Nenhum pedido encontrado.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class RelatoriosComponent {
  private http = inject(HttpClient);

  de = signal(this.defaultDe());
  ate = signal(new Date().toISOString().slice(0, 10));
  carregando = signal(false);
  erro = signal<string | null>(null);
  resultado = signal<RelatorioVendasResult | null>(null);

  private defaultDe(): string {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }

  csvUrl(): string {
    return `${BASE}/relatorios/vendas/csv?de=${this.de()}&ate=${this.ate()}`;
  }

  pdfUrl(): string {
    return `${BASE}/relatorios/vendas/pdf?de=${this.de()}&ate=${this.ate()}`;
  }

  buscar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.http.get<RelatorioVendasResult>(
      `${BASE}/relatorios/vendas?de=${this.de()}&ate=${this.ate()}`
    ).subscribe({
      next: (r) => {
        this.resultado.set(r);
        this.carregando.set(false);
      },
      error: (e) => {
        this.erro.set(e?.error?.error ?? 'Erro ao carregar relatório.');
        this.carregando.set(false);
      },
    });
  }

  badgeClass(status: string): string {
    const map: Record<string, string> = {
      Finalizado: 'bg-green-100 text-green-800',
      Cancelado: 'bg-red-100 text-red-800',
      EmAberto: 'bg-blue-100 text-blue-800',
    };
    return `text-xs px-2 py-0.5 rounded-full ${map[status] ?? 'bg-gray-100 text-gray-800'}`;
  }
}
