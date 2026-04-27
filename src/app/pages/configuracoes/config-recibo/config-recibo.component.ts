import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import {
  ConfigReciboService,
  ConfiguracaoReciboResponse,
  SalvarConfiguracaoReciboRequest
} from '../config-recibo.service';

@Component({
  selector: 'app-config-recibo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-2xl">
      <div class="mb-6">
        <h1 class="text-xl font-semibold text-gray-800">Configuração do Recibo de Venda</h1>
        <p class="text-sm text-gray-500 mt-1">
          Personalize o logotipo, cabeçalho e rodapé dos recibos impressos.
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

          <!-- Logotipo -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Logotipo</label>
            @if (previewUrl()) {
              <img [src]="previewUrl()" alt="Logotipo" class="h-16 mb-2 rounded border border-gray-200 object-contain" />
            }
            <div class="flex items-center gap-3">
              <label class="cursor-pointer px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                Escolher imagem
                <input type="file" class="hidden" accept="image/png,image/jpeg"
                       (change)="onFileChange($event)" />
              </label>
              @if (uploadProgress()) {
                <span class="text-xs text-blue-600">Enviando...</span>
              }
              @if (form.urlLogotipo) {
                <span class="text-xs text-gray-500 truncate max-w-xs">{{ form.urlLogotipo }}</span>
              }
            </div>
          </div>

          <!-- Cabeçalho -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Texto do Cabeçalho</label>
            <textarea [(ngModel)]="form.textoCabecalho" name="textoCabecalho"
                      rows="2" placeholder="Ex: Loja Central - Tintas e Acabamentos"
                      class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          </div>

          <!-- Rodapé -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Texto do Rodapé</label>
            <textarea [(ngModel)]="form.textoRodape" name="textoRodape"
                      rows="2" placeholder="Ex: Troca em até 30 dias com nota fiscal"
                      class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          </div>

          <!-- Mensagem de agradecimento -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mensagem de Agradecimento</label>
            <input type="text" [(ngModel)]="form.mensagemAgradecimento" name="mensagemAgradecimento"
                   placeholder="Ex: Obrigado pela preferência!"
                   class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <!-- Toggles -->
          <div class="space-y-3">
            <p class="text-sm font-medium text-gray-700">Campos opcionais no recibo</p>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" [(ngModel)]="form.exibirCnpjCliente" name="exibirCnpjCliente"
                     class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span class="text-sm text-gray-700">Exibir CNPJ/CPF do cliente</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" [(ngModel)]="form.exibirEnderecoCliente" name="exibirEnderecoCliente"
                     class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span class="text-sm text-gray-700">Exibir endereço do cliente</span>
            </label>
          </div>

          <!-- Preview -->
          <div class="border border-gray-200 rounded-md p-4 bg-gray-50">
            <p class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Prévia do Recibo</p>
            <div class="bg-white border border-gray-200 rounded p-4 text-xs font-mono space-y-1 text-gray-700">
              @if (previewUrl()) {
                <div class="flex justify-center mb-2">
                  <img [src]="previewUrl()" alt="Logo" class="h-10 object-contain" />
                </div>
              }
              <p class="text-center font-semibold">{{ form.textoCabecalho || '[Cabeçalho da loja]' }}</p>
              <hr class="my-2 border-gray-200" />
              <p>Item: Tinta Branca 18L ............. R$ 120,00</p>
              <p>Item: Rolo Lã 23cm ................... R$ 18,50</p>
              <hr class="my-2 border-gray-200" />
              <p class="font-semibold">TOTAL: R$ 138,50</p>
              @if (form.exibirCnpjCliente) {
                <p>CPF: 123.456.789-00</p>
              }
              @if (form.exibirEnderecoCliente) {
                <p>End: Rua das Flores, 100</p>
              }
              <hr class="my-2 border-gray-200" />
              <p class="text-center">{{ form.textoRodape || '[Rodapé]' }}</p>
              <p class="text-center italic">{{ form.mensagemAgradecimento || '[Mensagem de agradecimento]' }}</p>
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
export class ConfigReciboComponent implements OnInit {
  private service = inject(ConfigReciboService);
  private auth = inject(AuthService);

  loading = signal(true);
  saving = signal(false);
  uploadProgress = signal(false);
  error = signal<string | null>(null);
  savedAt = signal<string | null>(null);
  lojaId = signal<string | null>(null);
  previewUrl = signal<string | null>(null);

  form: SalvarConfiguracaoReciboRequest = {
    urlLogotipo: null,
    textoCabecalho: null,
    textoRodape: null,
    mensagemAgradecimento: null,
    exibirCnpjCliente: false,
    exibirEnderecoCliente: false,
  };

  ngOnInit(): void {
    const id = this.auth.getLojaId();
    this.lojaId.set(id);
    if (id) {
      this.service.obter(id).subscribe({
        next: (data) => this.applyResponse(data),
        error: (e) => {
          if (e.status !== 404) {
            this.error.set('Erro ao carregar configuração de recibo.');
          }
          this.loading.set(false);
        }
      });
    } else {
      this.loading.set(false);
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.lojaId()) return;

    const localUrl = URL.createObjectURL(file);
    this.previewUrl.set(localUrl);
    this.uploadProgress.set(true);

    this.service.uploadLogotipo(this.lojaId()!, file).subscribe({
      next: (res) => {
        this.form.urlLogotipo = res.url;
        this.uploadProgress.set(false);
      },
      error: () => {
        this.error.set('Erro ao enviar logotipo.');
        this.uploadProgress.set(false);
      }
    });
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

  private applyResponse(data: ConfiguracaoReciboResponse): void {
    this.form = {
      urlLogotipo: data.urlLogotipo,
      textoCabecalho: data.textoCabecalho,
      textoRodape: data.textoRodape,
      mensagemAgradecimento: data.mensagemAgradecimento,
      exibirCnpjCliente: data.exibirCnpjCliente,
      exibirEnderecoCliente: data.exibirEnderecoCliente,
    };
    if (data.urlLogotipo) {
      this.previewUrl.set(data.urlLogotipo);
    }
    this.loading.set(false);
  }
}
