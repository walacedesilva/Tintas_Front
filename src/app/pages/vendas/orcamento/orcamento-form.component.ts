import { Component, inject, signal, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { OrcamentoService } from '../../../services/orcamento.service';
import { CarrinhoService } from '../../../services/carrinho.service';

@Component({
  selector: 'app-orcamento-form',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe],
  template: `
    <div class="p-4 max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-bold text-gray-900">Novo Orçamento</h2>
          <p class="text-sm text-gray-500">Preencha os dados para criar o orçamento</p>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="salvar()" class="space-y-6">
        <!-- Client + Store -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">ID do Cliente</label>
            <input formControlName="clienteId" type="text"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="UUID do cliente" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">ID da Loja</label>
            <input formControlName="lojaId" type="text"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="UUID da loja" />
          </div>
        </div>

        <!-- Validity date -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Válido até</label>
            <input formControlName="dataValidade" type="date"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Desconto total (R$)</label>
            <input formControlName="descontoTotal" type="number" min="0" step="0.01"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <!-- Items -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-gray-700">Itens do orçamento</label>
            <button type="button" (click)="addItem()"
              class="text-sm text-blue-600 hover:text-blue-800 font-medium">
              + Adicionar item
            </button>
          </div>

          <div formArrayName="itens" class="space-y-2">
            @for (item of itensArray.controls; track $index) {
              <div [formGroupName]="$index" class="grid grid-cols-12 gap-2 items-end bg-gray-50 rounded-lg p-3">
                <div class="col-span-4">
                  <input formControlName="nomeProduto" placeholder="Nome do produto"
                    class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
                </div>
                <div class="col-span-2">
                  <input formControlName="unidadeMedida" placeholder="Un"
                    class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
                </div>
                <div class="col-span-2">
                  <input formControlName="quantidade" type="number" min="0.01" step="0.01" placeholder="Qtd"
                    class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
                </div>
                <div class="col-span-2">
                  <input formControlName="precoUnitario" type="number" min="0" step="0.01" placeholder="Preço"
                    class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
                </div>
                <div class="col-span-1">
                  <input formControlName="descontoItem" type="number" min="0" step="0.01" placeholder="Desc."
                    class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
                </div>
                <div class="col-span-1 flex justify-end">
                  <button type="button" (click)="removeItem($index)"
                    class="text-red-500 hover:text-red-700 text-lg leading-none">&times;</button>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Observations -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Observações</label>
          <textarea formControlName="observacoes" rows="2"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Observações opcionais..."></textarea>
        </div>

        <!-- Totals summary -->
        @if (itensArray.length > 0) {
          <div class="bg-blue-50 rounded-lg p-4 text-sm space-y-1 text-right">
            <div class="text-gray-600">Subtotal: <span class="font-medium">{{ subtotal() | currency:'BRL' }}</span></div>
            <div class="text-gray-600">Desconto: <span class="font-medium text-red-600">-{{ form.value.descontoTotal | currency:'BRL' }}</span></div>
            <div class="text-gray-900 font-bold text-base">Total: {{ total() | currency:'BRL' }}</div>
          </div>
        }

        <!-- Actions -->
        <div class="flex gap-3 justify-end">
          <button type="button" (click)="voltar()"
            class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" [disabled]="form.invalid || salvando()"
            class="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            @if (salvando()) { Salvando... } @else { Salvar Orçamento }
          </button>
        </div>

        @if (erro()) {
          <p class="text-red-600 text-sm text-center">{{ erro() }}</p>
        }
      </form>
    </div>
  `,
})
export class OrcamentoFormComponent {
  private fb = inject(FormBuilder);
  private orcamentoService = inject(OrcamentoService);
  private router = inject(Router);

  salvando = signal(false);
  erro = signal<string | null>(null);

  form = this.fb.group({
    clienteId: ['', Validators.required],
    lojaId: ['', Validators.required],
    dataValidade: ['', Validators.required],
    descontoTotal: [0],
    observacoes: [''],
    itens: this.fb.array<FormGroup>([]),
  });

  get itensArray() {
    return this.form.get('itens') as FormArray;
  }

  subtotal = computed(() => {
    return (this.form.value.itens ?? []).reduce((acc: number, i: any) => {
      const total = (i.quantidade ?? 0) * (i.precoUnitario ?? 0) - (i.descontoItem ?? 0);
      return acc + (total > 0 ? total : 0);
    }, 0);
  });

  total = computed(() => {
    const s = this.subtotal();
    const d = this.form.value.descontoTotal ?? 0;
    return Math.max(0, s - d);
  });

  addItem() {
    this.itensArray.push(this.fb.group({
      produtoId: [crypto.randomUUID()],
      nomeProduto: ['', Validators.required],
      unidadeMedida: ['L', Validators.required],
      quantidade: [1, [Validators.required, Validators.min(0.01)]],
      precoUnitario: [0, [Validators.required, Validators.min(0)]],
      descontoItem: [0],
    }));
  }

  removeItem(index: number) {
    this.itensArray.removeAt(index);
  }

  voltar() {
    this.router.navigate(['/app/vendas/orcamentos']);
  }

  salvar() {
    if (this.form.invalid) return;
    this.salvando.set(true);
    this.erro.set(null);

    const v = this.form.value;
    this.orcamentoService.criarOrcamento({
      clienteId: v.clienteId!,
      lojaId: v.lojaId!,
      dataValidade: v.dataValidade!,
      descontoTotal: v.descontoTotal ?? 0,
      observacoes: v.observacoes ?? undefined,
      itens: (v.itens ?? []).map((i: any) => ({
        produtoId: i.produtoId,
        nomeProduto: i.nomeProduto,
        unidadeMedida: i.unidadeMedida,
        quantidade: i.quantidade,
        precoUnitario: i.precoUnitario,
        descontoItem: i.descontoItem ?? 0,
      })),
    }).subscribe({
      next: (orc) => {
        this.salvando.set(false);
        this.router.navigate(['/app/vendas/orcamentos', orc.id]);
      },
      error: (err) => {
        this.salvando.set(false);
        this.erro.set(err?.error?.message ?? 'Erro ao salvar orçamento.');
      },
    });
  }
}
