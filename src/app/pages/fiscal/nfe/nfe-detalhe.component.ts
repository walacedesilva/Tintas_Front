import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FiscalService, NFeResponse } from '../../../services/fiscal.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-nfe-detalhe',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="p-6 max-w-4xl space-y-5">
      <div class="flex items-center gap-3">
        <a routerLink="/app/fiscal" class="text-sm text-gray-500 hover:text-gray-700">← Voltar</a>
        <h1 class="text-lg font-bold text-gray-900">Detalhe NF-e</h1>
      </div>

      @if (carregando()) {
        <p class="text-sm text-gray-500">Carregando…</p>
      } @else if (!nfe()) {
        <p class="text-sm text-red-600">NF-e não encontrada.</p>
      } @else {
        <!-- Header -->
        <div class="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p class="text-xs text-gray-500">Série / Número</p>
            <p class="font-semibold">{{ nfe()!.serie }} / {{ nfe()!.numero }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Modelo</p>
            <p class="font-semibold">{{ nfe()!.modelo === 55 ? 'NF-e (55)' : 'NFC-e (65)' }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Status</p>
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {{ statusClass(nfe()!.status) }}">
              {{ nfe()!.status }}
            </span>
          </div>
          <div>
            <p class="text-xs text-gray-500">Ambiente</p>
            <p [class]="nfe()!.ambiente === 'Homologacao' ? 'text-orange-600 font-semibold' : 'font-semibold'">
              {{ nfe()!.ambiente === 'Homologacao' ? 'Homologação (SEM VALOR FISCAL)' : 'Produção' }}
            </p>
          </div>
          @if (nfe()!.chNfe) {
            <div class="col-span-2">
              <p class="text-xs text-gray-500">Chave de Acesso</p>
              <p class="font-mono text-xs break-all">{{ nfe()!.chNfe }}</p>
            </div>
          }
          @if (nfe()!.mensagemSefaz) {
            <div class="col-span-2">
              <p class="text-xs text-gray-500">Mensagem SEFAZ</p>
              <p class="text-sm">{{ nfe()!.codigoStatusSefaz }} — {{ nfe()!.mensagemSefaz }}</p>
            </div>
          }
          @if (nfe()!.autorizadaEm) {
            <div>
              <p class="text-xs text-gray-500">Autorizada em</p>
              <p class="font-semibold">{{ nfe()!.autorizadaEm | date:'dd/MM/yyyy HH:mm' }}</p>
            </div>
          }
          @if (nfe()!.canceladaEm) {
            <div>
              <p class="text-xs text-gray-500">Cancelada em</p>
              <p class="font-semibold text-red-600">{{ nfe()!.canceladaEm | date:'dd/MM/yyyy HH:mm' }}</p>
            </div>
          }
        </div>

        <!-- Actions -->
        @if (nfe()!.status === 'Autorizada') {
          <div class="flex gap-3">
            <a [href]="danfeUrl()" target="_blank"
              class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              📄 Baixar DANFE
            </a>
            <button
              (click)="toggleCancelar()"
              class="px-4 py-2 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50">
              ✕ Cancelar NF-e
            </button>
          </div>
          @if (mostrarCancelar()) {
            <div class="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
              <p class="text-sm font-medium text-red-800">Cancelamento de NF-e</p>
              <textarea
                [(ngModel)]="justificativa"
                rows="3"
                placeholder="Informe a justificativa (mínimo 15 caracteres)…"
                class="w-full px-3 py-2 text-sm border border-red-200 rounded-lg focus:ring-2 focus:ring-red-400 focus:outline-none"
              ></textarea>
              <div class="flex gap-2">
                <button
                  (click)="cancelarNFe()"
                  [disabled]="justificativa.length < 15 || cancelando()"
                  class="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50">
                  {{ cancelando() ? 'Cancelando…' : 'Confirmar Cancelamento' }}
                </button>
                <button (click)="toggleCancelar()"
                  class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                  Desistir
                </button>
              </div>
              @if (erroCancelamento()) {
                <p class="text-xs text-red-600">{{ erroCancelamento() }}</p>
              }
            </div>
          }
        }

        <!-- Timeline / Eventos -->
        <div class="bg-white border border-gray-200 rounded-xl p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">Histórico de Eventos</h2>
          <ol class="space-y-3">
            @for (ev of nfe()!.eventos; track ev.id) {
              <li class="flex gap-3 text-sm">
                <div class="flex-none w-2 h-2 mt-1.5 rounded-full bg-violet-400"></div>
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="font-medium">{{ ev.tipo }}</span>
                    @if (ev.codigoSefaz) {
                      <span class="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">{{ ev.codigoSefaz }}</span>
                    }
                    <span class="text-xs text-gray-400 ml-auto">{{ ev.timestamp | date:'dd/MM/yyyy HH:mm:ss' }}</span>
                  </div>
                  <p class="text-xs text-gray-500">{{ ev.mensagem }}</p>
                </div>
              </li>
            }
          </ol>
        </div>
      }
    </div>
  `,
})
export class NfeDetalheComponent implements OnInit {
  private readonly fiscal = inject(FiscalService);
  private readonly route = inject(ActivatedRoute);

  readonly nfe = signal<NFeResponse | null>(null);
  readonly carregando = signal(false);
  readonly mostrarCancelar = signal(false);
  readonly cancelando = signal(false);
  readonly erroCancelamento = signal('');

  justificativa = '';

  readonly STATUS_CLASSES: Record<string, string> = {
    Pendente: 'bg-yellow-100 text-yellow-800',
    Processando: 'bg-blue-100 text-blue-800',
    Autorizada: 'bg-green-100 text-green-800',
    Rejeitada: 'bg-red-100 text-red-800',
    Cancelada: 'bg-gray-100 text-gray-600',
    ErroTecnico: 'bg-orange-100 text-orange-800',
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.carregando.set(true);
    this.fiscal.obterNFe(id).subscribe({
      next: nfe => { this.nfe.set(nfe); this.carregando.set(false); },
      error: () => { this.nfe.set(null); this.carregando.set(false); },
    });
  }

  danfeUrl(): string {
    return this.fiscal.danfeUrl(this.nfe()!.id);
  }

  statusClass(status: string): string {
    return this.STATUS_CLASSES[status] ?? 'bg-gray-100 text-gray-600';
  }

  toggleCancelar(): void {
    this.mostrarCancelar.update(v => !v);
    this.justificativa = '';
    this.erroCancelamento.set('');
  }

  cancelarNFe(): void {
    const nfe = this.nfe();
    if (!nfe) return;
    this.cancelando.set(true);
    this.erroCancelamento.set('');
    this.fiscal.cancelarNFe(nfe.id, this.justificativa).subscribe({
      next: updated => {
        this.nfe.set(updated);
        this.cancelando.set(false);
        this.mostrarCancelar.set(false);
      },
      error: (err) => {
        this.erroCancelamento.set(err?.error?.error ?? 'Erro ao cancelar NF-e.');
        this.cancelando.set(false);
      },
    });
  }
}
