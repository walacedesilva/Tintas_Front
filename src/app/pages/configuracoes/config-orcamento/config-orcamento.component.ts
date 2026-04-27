import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ConfigOrcamentoService,
  ConfiguracaoOrcamentoResponse,
  SalvarConfiguracaoOrcamentoRequest
} from '../config-orcamento.service';

const PAPEIS = ['admin', 'gerente_vendas', 'vendedor', 'operador_estoque', 'gerente_estoque'];
const PAPEL_LABELS: Record<string, string> = {
  admin: 'Administrador',
  gerente_vendas: 'Gerente de Vendas',
  vendedor: 'Vendedor',
  operador_estoque: 'Operador de Estoque',
  gerente_estoque: 'Gerente de Estoque',
};

@Component({
  selector: 'app-config-orcamento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-2xl">
      <div class="mb-6">
        <h1 class="text-xl font-semibold text-gray-800">Configuração de Orçamentos</h1>
        <p class="text-sm text-gray-500 mt-1">
          Defina prazo de validade padrão, condições e desconto máximo por papel.
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

      @if (!loading()) {
        <form (ngSubmit)="salvar()" class="space-y-6">

          <!-- Prazo de validade -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Prazo de Validade Padrão (dias)
            </label>
            <input type="number" [(ngModel)]="form.prazoValidadeDias" name="prazoValidadeDias"
                   min="1" max="365"
                   class="w-32 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <p class="text-xs text-gray-400 mt-1">Entre 1 e 365 dias</p>
          </div>

          <!-- Texto de condições -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Condições de Pagamento</label>
            <textarea [(ngModel)]="form.textoCondicoes" name="textoCondicoes"
                      rows="3" placeholder="Ex: Pagamento à vista com desconto de 5%. Parcelamento em até 3x sem juros."
                      class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          </div>

          <!-- Observações padrão -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Observações Padrão</label>
            <textarea [(ngModel)]="form.observacoesPadrao" name="observacoesPadrao"
                      rows="3" placeholder="Ex: Preços sujeitos a alteração sem aviso prévio."
                      class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          </div>

          <!-- Descontos máximos por papel -->
          <div>
            <p class="text-sm font-medium text-gray-700 mb-3">Desconto Máximo por Papel (%)</p>
            <div class="space-y-2">
              @for (papel of papeis; track papel) {
                <div class="flex items-center gap-3">
                  <label class="w-44 text-sm text-gray-600">{{ papelLabel(papel) }}</label>
                  <input type="number" [ngModel]="getDesconto(papel)"
                         (ngModelChange)="setDesconto(papel, $event)"
                         [name]="'desconto_' + papel"
                         min="0" max="100"
                         class="w-20 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <span class="text-xs text-gray-400">%</span>
                </div>
              }
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
    </div>
  `
})
export class ConfigOrcamentoComponent implements OnInit {
  private service = inject(ConfigOrcamentoService);

  readonly papeis = PAPEIS;

  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  savedAt = signal<string | null>(null);

  form: SalvarConfiguracaoOrcamentoRequest = {
    prazoValidadeDias: 30,
    textoCondicoes: null,
    observacoesPadrao: null,
    descontosMaximos: {},
  };

  ngOnInit(): void {
    this.service.obter().subscribe({
      next: (data) => this.applyResponse(data),
      error: (e) => {
        if (e.status !== 404) {
          this.error.set('Erro ao carregar configuração de orçamentos.');
        }
        this.loading.set(false);
      }
    });
  }

  papelLabel(papel: string): string {
    return PAPEL_LABELS[papel] ?? papel;
  }

  getDesconto(papel: string): number {
    return this.form.descontosMaximos?.[papel] ?? 0;
  }

  setDesconto(papel: string, valor: number): void {
    this.form.descontosMaximos = {
      ...(this.form.descontosMaximos ?? {}),
      [papel]: valor
    };
  }

  salvar(): void {
    this.saving.set(true);
    this.error.set(null);
    this.service.salvar(this.form).subscribe({
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

  private applyResponse(data: ConfiguracaoOrcamentoResponse): void {
    this.form = {
      prazoValidadeDias: data.prazoValidadeDias,
      textoCondicoes: data.textoCondicoes,
      observacoesPadrao: data.observacoesPadrao,
      descontosMaximos: data.descontosMaximos ?? {},
    };
    this.loading.set(false);
  }
}
