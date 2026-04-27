import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrcamentoResponse, OrcamentoService } from '../../../services/orcamento.service';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-orcamento-detalhe',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  template: `
    <div class="p-4 max-w-4xl mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <button (click)="voltar()" class="text-gray-500 hover:text-gray-700">
          ← Voltar
        </button>
        <h2 class="text-xl font-bold text-gray-900">Orçamento</h2>
        @if (orcamento()) {
          <span [class]="statusClass()">{{ orcamento()!.status }}</span>
        }
      </div>

      @if (carregando()) {
        <div class="text-center py-16 text-gray-400">Carregando...</div>
      }

      @if (erro()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{{ erro() }}</div>
      }

      @if (orcamento(); as orc) {
        <div class="space-y-6">
          <!-- Header info -->
          <div class="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4 text-sm">
            <div>
              <p class="text-gray-500">Data de criação</p>
              <p class="font-medium">{{ orc.dataCriacao | date:'dd/MM/yyyy HH:mm' }}</p>
            </div>
            <div>
              <p class="text-gray-500">Válido até</p>
              <p class="font-medium" [class.text-red-600]="isExpirado(orc)">
                {{ orc.dataValidade | date:'dd/MM/yyyy' }}
              </p>
            </div>
            <div>
              <p class="text-gray-500">Cliente</p>
              <p class="font-medium font-mono text-xs">{{ orc.clienteId }}</p>
            </div>
          </div>

          <!-- Items -->
          <div>
            <h3 class="text-sm font-semibold text-gray-700 mb-2">Itens</h3>
            <table class="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead class="bg-gray-50">
                <tr>
                  <th class="text-left px-4 py-2 font-medium text-gray-600">Produto</th>
                  <th class="text-right px-4 py-2 font-medium text-gray-600">Qtd</th>
                  <th class="text-right px-4 py-2 font-medium text-gray-600">Un</th>
                  <th class="text-right px-4 py-2 font-medium text-gray-600">Preço</th>
                  <th class="text-right px-4 py-2 font-medium text-gray-600">Desc.</th>
                  <th class="text-right px-4 py-2 font-medium text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                @for (item of orc.itens; track item.id) {
                  <tr class="border-t border-gray-100">
                    <td class="px-4 py-2">{{ item.nomeProduto }}</td>
                    <td class="px-4 py-2 text-right">{{ item.quantidade }}</td>
                    <td class="px-4 py-2 text-right">{{ item.unidadeMedida }}</td>
                    <td class="px-4 py-2 text-right">{{ item.precoUnitario | currency:'BRL' }}</td>
                    <td class="px-4 py-2 text-right text-red-600">
                      @if (item.descontoItem > 0) { -{{ item.descontoItem | currency:'BRL' }} }
                    </td>
                    <td class="px-4 py-2 text-right font-medium">{{ item.totalItem | currency:'BRL' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Totals -->
          <div class="text-right text-sm space-y-1">
            <p class="text-gray-500">Subtotal: {{ orc.subtotal | currency:'BRL' }}</p>
            @if (orc.descontoTotal > 0) {
              <p class="text-red-600">Desconto: -{{ orc.descontoTotal | currency:'BRL' }}</p>
            }
            <p class="text-lg font-bold text-gray-900">Total: {{ orc.total | currency:'BRL' }}</p>
          </div>

          @if (orc.observacoes) {
            <p class="text-sm text-gray-500 italic">Obs.: {{ orc.observacoes }}</p>
          }

          <!-- Actions -->
          @if (orc.status === 'Aberto') {
            <div class="flex gap-3 pt-2">
              <a [href]="pdfUrl(orc.id)" target="_blank"
                class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1">
                📄 Exportar PDF
              </a>
              <button (click)="converter(orc.id)" [disabled]="convertendo()"
                class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                @if (convertendo()) { Convertendo... } @else { Converter em Pedido }
              </button>
            </div>
          }

          @if (orc.convertidoEmPedidoId) {
            <p class="text-sm text-green-700 bg-green-50 rounded-lg px-4 py-2">
              Convertido no pedido: <span class="font-mono font-medium">{{ orc.convertidoEmPedidoId }}</span>
            </p>
          }

          @if (msgConversao()) {
            <p [class]="msgConversao()!.startsWith('Erro') ? 'text-red-600 text-sm' : 'text-green-700 text-sm'">
              {{ msgConversao() }}
            </p>
          }
        </div>
      }
    </div>
  `,
})
export class OrcamentoDetalheComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(OrcamentoService);

  orcamento = signal<OrcamentoResponse | null>(null);
  carregando = signal(true);
  erro = signal<string | null>(null);
  convertendo = signal(false);
  msgConversao = signal<string | null>(null);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.service.obterOrcamento(id).subscribe({
      next: (orc) => {
        this.orcamento.set(orc);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Orçamento não encontrado.');
        this.carregando.set(false);
      },
    });
  }

  statusClass() {
    const s = this.orcamento()?.status;
    const base = 'px-2 py-0.5 rounded text-xs font-semibold ';
    const map: Record<string, string> = {
      'Aberto': 'bg-blue-100 text-blue-800',
      'Convertido': 'bg-green-100 text-green-800',
      'Expirado': 'bg-orange-100 text-orange-800',
      'Cancelado': 'bg-red-100 text-red-800',
    };
    return base + (map[s ?? ''] ?? 'bg-gray-100 text-gray-700');
  }

  isExpirado(orc: OrcamentoResponse): boolean {
    return new Date(orc.dataValidade) < new Date();
  }

  pdfUrl(id: string): string {
    return this.service.pdfUrl(id);
  }

  converter(id: string) {
    this.convertendo.set(true);
    this.msgConversao.set(null);
    this.service.converterEmPedido(id).subscribe({
      next: (updated) => {
        this.orcamento.set(updated);
        this.convertendo.set(false);
        this.msgConversao.set('Orçamento convertido com sucesso em pedido!');
      },
      error: (err) => {
        this.convertendo.set(false);
        this.msgConversao.set(`Erro: ${err?.error?.error ?? 'Falha ao converter.'}`);
      },
    });
  }

  voltar() {
    this.router.navigate(['/app/vendas/orcamentos']);
  }
}
