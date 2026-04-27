import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  EntradaService,
  EntradaPreviewDto,
  ItemPreviewDto,
  ConfirmarItemRequest,
} from '../../../services/entrada.service';
import { ProdutoService, ProdutoResponse } from '../../../services/produto.service';

interface PreviewItemVm extends ItemPreviewDto {
  /** Resolved product name for display after linking */
  produtoNomeVinculado: string | null;
}

@Component({
  selector: 'app-importacao',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold text-gray-900">Importar NF-e XML</h2>
      </div>

      <!-- Step 1: File upload -->
      @if (step() === 'upload') {
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="text-sm font-medium text-gray-700 mb-4">Selecione o arquivo XML da NF-e</h3>

          @if (uploadError()) {
            <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {{ uploadError() }}
            </div>
          }

          <label
            class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
            [class.border-emerald-400]="selectedFile()"
            [class.bg-emerald-50]="selectedFile()">
            <span class="text-sm text-gray-500">
              @if (selectedFile()) {
                <span class="text-emerald-700 font-medium">{{ selectedFile()!.name }}</span>
              } @else {
                Clique para selecionar ou arraste um arquivo .xml
              }
            </span>
            <input type="file" accept=".xml,application/xml,text/xml"
              class="hidden" (change)="onFileSelected($event)" />
          </label>

          <div class="mt-4 flex gap-3">
            <button type="button"
              class="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
              [disabled]="!selectedFile() || parsing()"
              (click)="parsear()">
              @if (parsing()) { Analisando... } @else { Analisar NF-e }
            </button>
          </div>
        </div>
      }

      <!-- Step 2: Preview with item linking -->
      @if (step() === 'preview' && preview()) {
        <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <!-- Header info -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p class="text-gray-500 text-xs">Chave NF-e</p>
              <p class="font-mono text-xs text-gray-800 break-all">{{ preview()!.chNFe }}</p>
            </div>
            <div>
              <p class="text-gray-500 text-xs">Número / Série</p>
              <p class="font-medium">{{ preview()!.numeroNf }}-{{ preview()!.serieNf }}</p>
            </div>
            <div>
              <p class="text-gray-500 text-xs">Emissão</p>
              <p class="font-medium">{{ preview()!.dataEmissao | date:'dd/MM/yyyy' }}</p>
            </div>
            <div>
              <p class="text-gray-500 text-xs">Valor Total</p>
              <p class="font-medium">{{ preview()!.valorTotal | currency:'BRL':'symbol':'1.2-2' }}</p>
            </div>
          </div>

          <!-- Unlinked warning -->
          @if (hasUnlinked()) {
            <div class="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg text-sm">
              Alguns itens não foram vinculados a produtos do catálogo. Vincule-os antes de confirmar.
            </div>
          }

          <!-- Items table -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th class="pb-2 pr-3">Código NF</th>
                  <th class="pb-2 pr-3">Descrição</th>
                  <th class="pb-2 pr-3 text-right">Qtd</th>
                  <th class="pb-2 pr-3 text-right">Val. Unit.</th>
                  <th class="pb-2">Produto vinculado</th>
                </tr>
              </thead>
              <tbody>
                @for (item of previewItems(); track item.codigoProdutoNf) {
                  <tr class="border-b border-gray-50"
                    [class.bg-amber-50]="item.naoVinculado">
                    <td class="py-2 pr-3 font-mono text-xs text-gray-600">{{ item.codigoProdutoNf }}</td>
                    <td class="py-2 pr-3 text-gray-800">{{ item.descricaoProdutoNf }}</td>
                    <td class="py-2 pr-3 text-right tabular-nums">{{ item.quantidade }}</td>
                    <td class="py-2 pr-3 text-right tabular-nums">
                      {{ item.valorUnitario | currency:'BRL':'symbol':'1.2-2' }}
                    </td>
                    <td class="py-2">
                      @if (item.produtoIdVinculado) {
                        <span class="text-emerald-700 text-xs font-medium">
                          {{ item.produtoNomeVinculado ?? item.produtoIdVinculado }}
                        </span>
                      } @else {
                        <button type="button"
                          class="text-xs text-amber-600 underline hover:text-amber-800"
                          (click)="abrirVincular(item)">
                          Vincular produto
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Loja / Fornecedor fields -->
          <form [formGroup]="confirmarForm" class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">ID da Loja *</label>
              <input type="text" formControlName="lojaId"
                placeholder="UUID da loja"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                [class.border-red-400]="confirmarForm.controls['lojaId'].invalid && confirmarForm.controls['lojaId'].touched" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">ID do Fornecedor *</label>
              <input type="text" formControlName="fornecedorId"
                placeholder="UUID do fornecedor"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                [class.border-red-400]="confirmarForm.controls['fornecedorId'].invalid && confirmarForm.controls['fornecedorId'].touched" />
            </div>
          </form>

          @if (confirmarError()) {
            <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {{ confirmarError() }}
            </div>
          }

          <div class="flex gap-3 pt-2">
            <button type="button"
              class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
              (click)="resetar()">
              Voltar
            </button>
            <button type="button"
              class="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
              [disabled]="hasUnlinked() || confirmarForm.invalid || confirmando()"
              (click)="confirmar()">
              @if (confirmando()) { Confirmando... } @else { Confirmar Entrada }
            </button>
          </div>
        </div>
      }

      <!-- Step 3: Success -->
      @if (step() === 'success') {
        <div class="bg-white rounded-xl border border-gray-200 p-6 text-center space-y-4">
          <div class="text-5xl">✅</div>
          <h3 class="text-base font-semibold text-gray-900">Entrada confirmada!</h3>
          <p class="text-sm text-gray-500">O estoque foi atualizado com base na NF-e importada.</p>
          <button type="button"
            class="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
            (click)="resetar()">
            Importar outra NF-e
          </button>
        </div>
      }
    </div>

    <!-- Vincular Produto Modal (T107) -->
    @if (vincularItem()) {
      <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 class="text-sm font-semibold text-gray-900">Vincular produto ao item NF-e</h3>
            <button type="button" class="text-gray-400 hover:text-gray-600" (click)="fecharVincular()">✕</button>
          </div>
          <div class="p-6 space-y-4">
            <div class="text-xs text-gray-500">
              Código NF-e: <span class="font-mono font-medium text-gray-700">{{ vincularItem()!.codigoProdutoNf }}</span>
            </div>
            <div class="text-xs text-gray-500 mb-2">
              Descrição: <span class="font-medium text-gray-700">{{ vincularItem()!.descricaoProdutoNf }}</span>
            </div>

            <!-- Product search -->
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Buscar produto do catálogo</label>
              <input type="text" [value]="buscaProduto()"
                (input)="buscaProduto.set($any($event.target).value)"
                placeholder="Digite nome ou código..."
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            @if (produtosFiltrados().length > 0) {
              <ul class="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                @for (p of produtosFiltrados(); track p.id) {
                  <li>
                    <button type="button"
                      class="w-full text-left px-4 py-2 text-sm hover:bg-emerald-50 transition-colors"
                      (click)="selecionarProduto(p)">
                      <span class="font-medium text-gray-800">{{ p.nome }}</span>
                      <span class="text-xs text-gray-500 ml-2">({{ p.codigo }})</span>
                    </button>
                  </li>
                }
              </ul>
            } @else if (buscaProduto().length >= 2) {
              <p class="text-xs text-gray-400 text-center py-2">Nenhum produto encontrado.</p>
            }

            @if (vincularError()) {
              <div class="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                {{ vincularError() }}
              </div>
            }
          </div>
          <div class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button type="button"
              class="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
              (click)="fecharVincular()">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ImportacaoComponent {
  private entradaSvc = inject(EntradaService);
  private produtoSvc = inject(ProdutoService);
  private fb = inject(FormBuilder);

  // ── state ──────────────────────────────────────────────────────────────────
  step = signal<'upload' | 'preview' | 'success'>('upload');
  selectedFile = signal<File | null>(null);
  parsing = signal(false);
  uploadError = signal<string | null>(null);

  preview = signal<EntradaPreviewDto | null>(null);
  previewItems = signal<PreviewItemVm[]>([]);
  hasUnlinked = computed(() => this.previewItems().some(i => i.naoVinculado));

  confirmando = signal(false);
  confirmarError = signal<string | null>(null);

  // vincular-produto modal
  vincularItem = signal<PreviewItemVm | null>(null);
  buscaProduto = signal('');
  todosOsProdutos = signal<ProdutoResponse[]>([]);
  vincularError = signal<string | null>(null);

  produtosFiltrados = computed(() => {
    const q = this.buscaProduto().toLowerCase().trim();
    if (q.length < 2) return [];
    return this.todosOsProdutos().filter(
      p => p.nome.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)
    ).slice(0, 20);
  });

  confirmarForm = this.fb.group({
    lojaId: ['', [Validators.required]],
    fornecedorId: ['', [Validators.required]],
  });

  // ── file select ────────────────────────────────────────────────────────────
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile.set(file);
    this.uploadError.set(null);
  }

  // ── step 1: parse ──────────────────────────────────────────────────────────
  parsear(): void {
    const file = this.selectedFile();
    if (!file) return;
    this.parsing.set(true);
    this.uploadError.set(null);

    this.entradaSvc.parsear(file).subscribe({
      next: (dto) => {
        this.preview.set(dto);
        this.previewItems.set(
          dto.itens.map(i => ({ ...i, produtoNomeVinculado: null }))
        );
        this.parsing.set(false);
        this.step.set('preview');
        // Load products for linking
        this.produtoSvc.listar().subscribe({
          next: ps => this.todosOsProdutos.set(ps),
          error: () => {},
        });
      },
      error: (err) => {
        const msg = err?.error?.error ?? 'Erro ao analisar XML. Verifique o arquivo.';
        this.uploadError.set(msg);
        this.parsing.set(false);
      },
    });
  }

  // ── step 2: confirm ────────────────────────────────────────────────────────
  confirmar(): void {
    const p = this.preview();
    if (!p || this.confirmarForm.invalid || this.hasUnlinked()) return;
    const { lojaId, fornecedorId } = this.confirmarForm.value;

    const itens: ConfirmarItemRequest[] = this.previewItems().map(i => ({
      codigoProdutoNf: i.codigoProdutoNf,
      descricaoProdutoNf: i.descricaoProdutoNf,
      ncm: i.ncm,
      unidadeMedida: i.unidadeMedida,
      quantidade: i.quantidade,
      valorUnitario: i.valorUnitario,
      valorTotal: i.valorTotal,
      produtoId: i.produtoIdVinculado!,
    }));

    this.confirmando.set(true);
    this.confirmarError.set(null);

    this.entradaSvc.confirmar({
      lojaId: lojaId!,
      fornecedorId: fornecedorId!,
      chNFe: p.chNFe,
      numeroNf: p.numeroNf,
      serieNf: p.serieNf,
      dataEmissao: p.dataEmissao,
      valorTotal: p.valorTotal,
      itens,
    }).subscribe({
      next: () => {
        this.confirmando.set(false);
        this.step.set('success');
      },
      error: (err) => {
        const msg = err?.error?.error ?? 'Erro ao confirmar entrada.';
        this.confirmarError.set(msg);
        this.confirmando.set(false);
      },
    });
  }

  // ── vincular modal ─────────────────────────────────────────────────────────
  abrirVincular(item: PreviewItemVm): void {
    this.vincularItem.set(item);
    this.buscaProduto.set('');
    this.vincularError.set(null);
  }

  fecharVincular(): void {
    this.vincularItem.set(null);
  }

  selecionarProduto(produto: ProdutoResponse): void {
    const item = this.vincularItem();
    if (!item) return;

    // Update preview items
    this.previewItems.update(items =>
      items.map(i => i.codigoProdutoNf === item.codigoProdutoNf
        ? { ...i, produtoIdVinculado: produto.id, naoVinculado: false, produtoNomeVinculado: produto.nome }
        : i
      )
    );

    // Update preview DTO itens reference
    this.preview.update(p => p
      ? {
          ...p,
          itens: p.itens.map(i => i.codigoProdutoNf === item.codigoProdutoNf
            ? { ...i, produtoIdVinculado: produto.id, naoVinculado: false }
            : i
          ),
          possuiItensNaoVinculados: this.previewItems().some(i =>
            i.codigoProdutoNf !== item.codigoProdutoNf && i.naoVinculado
          ),
        }
      : null
    );

    this.vincularItem.set(null);
  }

  resetar(): void {
    this.step.set('upload');
    this.selectedFile.set(null);
    this.preview.set(null);
    this.previewItems.set([]);
    this.uploadError.set(null);
    this.confirmarError.set(null);
    this.confirmarForm.reset();
  }
}
