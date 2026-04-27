import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import {
  ConfigFiscalService,
  ConfiguracaoFiscalResponse,
  SalvarConfiguracaoFiscalRequest
} from '../config-fiscal.service';

const REGIME_OPTIONS = [
  { value: 'SimplesNacional', label: 'Simples Nacional' },
  { value: 'LucroPresumido', label: 'Lucro Presumido' },
  { value: 'LucroReal', label: 'Lucro Real' },
];

const AMBIENTE_OPTIONS = [
  { value: 'Homologacao', label: 'Homologação (Teste)' },
  { value: 'Producao', label: 'Produção' },
];

@Component({
  selector: 'app-config-fiscal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-2xl">
      <div class="mb-6">
        <h1 class="text-xl font-semibold text-gray-800">Configuração de Nota Fiscal</h1>
        <p class="text-sm text-gray-500 mt-1">
          Configure séries, regime tributário e ambiente SEFAZ por loja.
        </p>
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center py-12 text-gray-400">
          <span class="text-sm">Carregando...</span>
        </div>
      }

      @if (error()) {
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
          {{ error() }}
        </div>
      }

      @if (!loading() && lojaId()) {
        <form (ngSubmit)="salvar()" class="space-y-6">
          <!-- Ambiente SEFAZ -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ambiente SEFAZ</label>
            <select [(ngModel)]="form.ambienteSefaz" name="ambienteSefaz"
                    class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              @for (opt of ambienteOptions; track opt.value) {
                <option [value]="opt.value">{{ opt.label }}</option>
              }
            </select>
            @if (form.ambienteSefaz === 'Producao') {
              <p class="text-xs text-amber-600 mt-1">
                ⚠️ Ambiente de Produção: notas fiscais emitidas têm validade fiscal.
              </p>
            }
          </div>

          <!-- Regime Tributário -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Regime Tributário</label>
            <select [(ngModel)]="form.regimeTributario" name="regimeTributario"
                    class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              @for (opt of regimeOptions; track opt.value) {
                <option [value]="opt.value">{{ opt.label }}</option>
              }
            </select>
          </div>

          <!-- Séries -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Série NF-e</label>
              <input type="number" [(ngModel)]="form.serieNFe" name="serieNFe"
                     min="1" max="999"
                     class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Série NFC-e</label>
              <input type="number" [(ngModel)]="form.serieNFCe" name="serieNFCe"
                     min="1" max="999"
                     class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <!-- Números Iniciais -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Número Inicial NF-e</label>
              <input type="number" [(ngModel)]="form.numeroInicialNFe" name="numeroInicialNFe"
                     min="1"
                     class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Número Inicial NFC-e</label>
              <input type="number" [(ngModel)]="form.numeroInicialNFCe" name="numeroInicialNFCe"
                     min="1"
                     class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <!-- CST / CSOSN -->
          <div class="space-y-3">
            <p class="text-sm font-medium text-gray-700">CST / CSOSN (opcional, 3 dígitos)</p>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-gray-500 mb-1">CST Venda</label>
                <input type="text" [(ngModel)]="form.cstVenda" name="cstVenda"
                       maxlength="3" placeholder="ex: 040"
                       class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">CST Devolução</label>
                <input type="text" [(ngModel)]="form.cstDevolucao" name="cstDevolucao"
                       maxlength="3" placeholder="ex: 040"
                       class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">CST Transferência</label>
                <input type="text" [(ngModel)]="form.cstTransferencia" name="cstTransferencia"
                       maxlength="3" placeholder="ex: 040"
                       class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">CSOSN Venda</label>
                <input type="text" [(ngModel)]="form.csosnVenda" name="csosnVenda"
                       maxlength="3" placeholder="ex: 400"
                       class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3 pt-2">
            <button type="submit" [disabled]="saving()"
                    class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {{ saving() ? 'Salvando...' : 'Salvar Configuração' }}
            </button>
            @if (savedAt()) {
              <span class="text-xs text-green-600">✓ Salvo em {{ savedAt() }}</span>
            }
          </div>
        </form>
      }

      @if (!loading() && !lojaId()) {
        <div class="text-sm text-gray-500 py-6">
          Selecione uma loja para configurar as informações fiscais.
        </div>
      }
    </div>
  `
})
export class ConfigFiscalComponent implements OnInit {
  private service = inject(ConfigFiscalService);
  private auth = inject(AuthService);

  readonly regimeOptions = REGIME_OPTIONS;
  readonly ambienteOptions = AMBIENTE_OPTIONS;

  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  savedAt = signal<string | null>(null);
  lojaId = signal<string | null>(null);

  form: SalvarConfiguracaoFiscalRequest = {
    serieNFe: 1,
    serieNFCe: 1,
    numeroInicialNFe: 1,
    numeroInicialNFCe: 1,
    regimeTributario: 'SimplesNacional',
    ambienteSefaz: 'Homologacao',
    cstVenda: null,
    cstDevolucao: null,
    cstTransferencia: null,
    csosnVenda: null,
  };

  ngOnInit(): void {
    const id = this.auth.getLojaId();
    this.lojaId.set(id);
    if (id) {
      this.service.obter(id).subscribe({
        next: (data) => this.applyResponse(data),
        error: (e) => {
          if (e.status !== 404) {
            this.error.set('Erro ao carregar configuração fiscal.');
          }
          this.loading.set(false);
        }
      });
    } else {
      this.loading.set(false);
    }
  }

  salvar(): void {
    const id = this.lojaId();
    if (!id) return;
    this.saving.set(true);
    this.error.set(null);
    this.service.salvar(id, this.form).subscribe({
      next: (data) => {
        this.applyResponse(data);
        this.savedAt.set(new Date().toLocaleTimeString('pt-BR'));
        this.saving.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.detail ?? 'Erro ao salvar configuração.');
        this.saving.set(false);
      }
    });
  }

  private applyResponse(data: ConfiguracaoFiscalResponse): void {
    this.form = {
      serieNFe: data.serieNFe,
      serieNFCe: data.serieNFCe,
      numeroInicialNFe: data.numeroInicialNFe,
      numeroInicialNFCe: data.numeroInicialNFCe,
      regimeTributario: data.regimeTributario,
      ambienteSefaz: data.ambienteSefaz,
      cstVenda: data.cstVenda,
      cstDevolucao: data.cstDevolucao,
      cstTransferencia: data.cstTransferencia,
      csosnVenda: data.csosnVenda,
    };
    this.loading.set(false);
  }
}
