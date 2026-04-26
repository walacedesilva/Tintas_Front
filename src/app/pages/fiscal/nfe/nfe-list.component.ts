import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FiscalService, NFeResponse } from '../../../services/fiscal.service';

const STATUS_LABELS: Record<string, string> = {
  Pendente: 'Pendente',
  Processando: 'Processando',
  Autorizada: 'Autorizada',
  Rejeitada: 'Rejeitada',
  Cancelada: 'Cancelada',
  ErroTecnico: 'Erro Técnico',
};

const STATUS_CLASSES: Record<string, string> = {
  Pendente: 'bg-yellow-100 text-yellow-800',
  Processando: 'bg-blue-100 text-blue-800',
  Autorizada: 'bg-green-100 text-green-800',
  Rejeitada: 'bg-red-100 text-red-800',
  Cancelada: 'bg-gray-100 text-gray-600',
  ErroTecnico: 'bg-orange-100 text-orange-800',
};

@Component({
  selector: 'app-nfe-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6 space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-lg font-bold text-gray-900">NF-e / NFC-e</h1>
        <div class="flex items-center gap-3">
          <select
            (change)="filtrarStatus($event)"
            class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
          >
            <option value="">Todos os status</option>
            @for (s of statusOpcoes; track s) {
              <option [value]="s">{{ statusLabel(s) }}</option>
            }
          </select>
        </div>
      </div>

      @if (carregando()) {
        <p class="text-sm text-gray-500">Carregando…</p>
      } @else if (erro()) {
        <p class="text-sm text-red-600">{{ erro() }}</p>
      } @else if (nfes().length === 0) {
        <div class="text-center py-12 text-gray-400">
          <p class="text-sm">Nenhuma NF-e encontrada.</p>
          <p class="text-xs mt-1">As notas são emitidas automaticamente após a finalização de uma venda.</p>
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left py-2 pr-4 font-medium text-gray-600">Número</th>
                <th class="text-left py-2 pr-4 font-medium text-gray-600">Chave</th>
                <th class="text-left py-2 pr-4 font-medium text-gray-600">Modelo</th>
                <th class="text-left py-2 pr-4 font-medium text-gray-600">Ambiente</th>
                <th class="text-left py-2 pr-4 font-medium text-gray-600">Status</th>
                <th class="text-left py-2 pr-4 font-medium text-gray-600">Autorizada em</th>
                <th class="py-2 font-medium text-gray-600"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (nfe of nfes(); track nfe.id) {
                <tr class="hover:bg-gray-50">
                  <td class="py-2 pr-4 font-mono text-xs">{{ nfe.serie }}/{{ nfe.numero }}</td>
                  <td class="py-2 pr-4 font-mono text-xs text-gray-500">
                    {{ nfe.chNfe ? nfe.chNfe.slice(0, 16) + '…' : '—' }}
                  </td>
                  <td class="py-2 pr-4">{{ nfe.modelo === 55 ? 'NF-e' : 'NFC-e' }}</td>
                  <td class="py-2 pr-4">
                    @if (nfe.ambiente === 'Homologacao') {
                      <span class="text-orange-600 font-medium">Homolog.</span>
                    } @else {
                      <span class="text-gray-700">Produção</span>
                    }
                  </td>
                  <td class="py-2 pr-4">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {{ statusClass(nfe.status) }}">
                      {{ statusLabel(nfe.status) }}
                    </span>
                  </td>
                  <td class="py-2 pr-4 text-xs text-gray-500">
                    {{ nfe.autorizadaEm ? (nfe.autorizadaEm | date:'dd/MM/yyyy HH:mm') : '—' }}
                  </td>
                  <td class="py-2 text-right">
                    <a [routerLink]="['/app/fiscal/nfe', nfe.id]"
                      class="text-xs text-violet-600 hover:text-violet-700 font-medium">
                      Ver →
                    </a>
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
export class NfeListComponent implements OnInit {
  private readonly fiscal = inject(FiscalService);

  readonly nfes = signal<NFeResponse[]>([]);
  readonly carregando = signal(false);
  readonly erro = signal('');
  readonly statusFiltro = signal('');

  readonly statusOpcoes = ['Pendente', 'Processando', 'Autorizada', 'Rejeitada', 'Cancelada', 'ErroTecnico'];

  ngOnInit(): void {
    this.carregar();
  }

  filtrarStatus(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.statusFiltro.set(value);
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set('');
    const status = this.statusFiltro() || undefined;
    this.fiscal.listarNFes(status).subscribe({
      next: result => {
        this.nfes.set(result.items);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Erro ao carregar NF-es.');
        this.carregando.set(false);
      },
    });
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  statusClass(status: string): string {
    return STATUS_CLASSES[status] ?? 'bg-gray-100 text-gray-600';
  }
}
