import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { OrcamentoService } from '../../../services/orcamento.service';
import { ClienteService, ClienteResponse } from '../../../services/cliente.service';
import { LojaService, LojaResponse } from '../../../services/loja.service';
import { ProdutoService, ProdutoResponse } from '../../../services/produto.service';

interface ItemState {
  query: string;
  sugestoes: ProdutoResponse[];
  selecionado: ProdutoResponse | null;
  mostrar: boolean;
  search$: Subject<string>;
  sub: Subscription;
}

@Component({
  selector: 'app-orcamento-form',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe],
  template: `
    <div class="p-4 max-w-4xl mx-auto">
      <div class="mb-6">
        <h2 class="text-xl font-bold text-gray-900">Novo Orçamento</h2>
        <p class="text-sm text-gray-500">Preencha os dados para criar o orçamento</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="salvar()" class="space-y-6">

        <!-- Cliente + Loja -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="relative">
            <label class="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            @if (clienteSelecionado()) {
              <div class="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                <span class="flex-1 truncate font-medium">{{ clienteSelecionado()!.nome }}</span>
                <button type="button" (click)="limparCliente()" class="text-gray-400 hover:text-red-500">&times;</button>
              </div>
            } @else {
              <input type="text" [value]="clienteQuery()"
                (input)="onClienteInput($event)" (focus)="mostrarClienteSugestoes.set(true)" (blur)="onClienteBlur()"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite o nome do cliente..." />
              @if (mostrarClienteSugestoes() && clienteSugestoes().length > 0) {
                <ul class="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  @for (c of clienteSugestoes(); track c.id) {
                    <li (mousedown)="selecionarCliente(c)" class="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer flex items-center gap-2">
                      <span class="font-medium">{{ c.nome }}</span>
                      <span class="text-gray-400 text-xs">{{ c.cpfCnpj }}</span>
                    </li>
                  }
                </ul>
              }
              @if (mostrarClienteSugestoes() && clienteQuery().length >= 2 && clienteSugestoes().length === 0) {
                <div class="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-400">
                  Nenhum cliente encontrado.
                </div>
              }
            }
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Loja</label>
            <select (change)="onLojaChange($event)"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">Selecione a loja...</option>
              @for (l of lojas(); track l.id) {
                <option [value]="l.id">{{ l.nome }}</option>
              }
            </select>
          </div>
        </div>

        <!-- Validade + Desconto -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Válido até</label>
            <input formControlName="dataValidade" type="date"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Desconto geral (R$)</label>
            <input formControlName="descontoTotal" type="number" min="0" step="0.01"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <!-- Itens -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-semibold text-gray-800">Itens do orçamento</span>
            <button type="button" (click)="addItem()"
              class="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
              + Adicionar item
            </button>
          </div>

          @if (itensArray.length === 0) {
            <div class="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
              Nenhum item adicionado. Clique em <strong>+ Adicionar item</strong> para começar.
            </div>
          } @else {
            <div class="hidden sm:grid grid-cols-12 gap-2 px-3 mb-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <div class="col-span-5">Produto</div>
              <div class="col-span-2 text-center">Qtd</div>
              <div class="col-span-2 text-right">Preço unit.</div>
              <div class="col-span-2 text-right">Total</div>
              <div class="col-span-1"></div>
            </div>

            <div formArrayName="itens" class="space-y-2">
              @for (item of itensArray.controls; track $index; let i = $index) {
                <div [formGroupName]="i" class="grid grid-cols-12 gap-2 items-center bg-white border border-gray-200 rounded-xl p-3">

                  <div class="col-span-12 sm:col-span-5 relative">
                    @if (itemStates[i]?.selecionado) {
                      <div class="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50">
                        <div class="flex-1 min-w-0">
                          <p class="font-medium text-gray-900 truncate">{{ itemStates[i].selecionado!.nome }}</p>
                          <p class="text-xs text-gray-400">{{ itemStates[i].selecionado!.codigo }} - {{ itemStates[i].selecionado!.unidadeMedida }}</p>
                        </div>
                        <button type="button" (click)="limparProduto(i)" class="text-gray-400 hover:text-red-500 shrink-0">&times;</button>
                      </div>
                    } @else {
                      <input type="text" [value]="itemStates[i]?.query ?? ''"
                        (input)="onProdutoInput(i, $event)"
                        (focus)="setProdutoMostrar(i, true)"
                        (blur)="onProdutoBlur(i)"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Buscar produto..." />
                      @if (itemStates[i]?.mostrar && (itemStates[i]?.sugestoes?.length ?? 0) > 0) {
                        <ul class="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          @for (p of itemStates[i].sugestoes; track p.id) {
                            <li (mousedown)="selecionarProduto(i, p)" class="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer">
                              <p class="font-medium text-gray-900">{{ p.nome }}</p>
                              <p class="text-xs text-gray-400">{{ p.codigo }} - {{ p.unidadeMedida }} - {{ p.precoVenda | currency:'BRL' }}</p>
                            </li>
                          }
                        </ul>
                      }
                    }
                  </div>

                  <div class="col-span-4 sm:col-span-2">
                    <label class="block text-xs text-gray-400 mb-1 sm:hidden">Quantidade</label>
                    <div class="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                      <button type="button" (click)="decrementarQtd(i)"
                        class="px-2 py-2 text-gray-500 hover:bg-gray-100 text-sm font-bold shrink-0">-</button>
                      <input formControlName="quantidade" type="number" min="0.01" step="0.01"
                        class="flex-1 w-full text-center text-sm py-2 focus:outline-none min-w-0" />
                      <button type="button" (click)="incrementarQtd(i)"
                        class="px-2 py-2 text-gray-500 hover:bg-gray-100 text-sm font-bold shrink-0">+</button>
                    </div>
                  </div>

                  <div class="col-span-4 sm:col-span-2">
                    <label class="block text-xs text-gray-400 mb-1 sm:hidden">Preço unit.</label>
                    <div class="relative">
                      <span class="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">R$</span>
                      <input formControlName="precoUnitario" type="number" min="0" step="0.01"
                        class="w-full border border-gray-300 rounded-lg pl-7 pr-2 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  <div class="col-span-3 sm:col-span-2 text-right">
                    <label class="block text-xs text-gray-400 mb-1 sm:hidden">Total</label>
                    <span class="text-sm font-semibold text-gray-900">{{ itemTotal(i) | currency:'BRL' }}</span>
                  </div>

                  <div class="col-span-1 flex justify-end">
                    <button type="button" (click)="removeItem(i)"
                      class="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>

                </div>
              }
            </div>
          }
        </div>

        <!-- Observacoes -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Observações</label>
          <textarea formControlName="observacoes" rows="2"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Observações opcionais..."></textarea>
        </div>

        @if (itensArray.length > 0) {
          <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm space-y-1.5">
            <div class="flex justify-between text-gray-600">
              <span>Subtotal ({{ itensArray.length }} item{{ itensArray.length > 1 ? 's' : '' }})</span>
              <span class="font-medium">{{ subtotal() | currency:'BRL' }}</span>
            </div>
            @if ((form.value.descontoTotal ?? 0) > 0) {
              <div class="flex justify-between text-red-600">
                <span>Desconto geral</span>
                <span class="font-medium">-{{ form.value.descontoTotal | currency:'BRL' }}</span>
              </div>
            }
            <div class="flex justify-between text-gray-900 font-bold text-base border-t border-gray-200 pt-1.5 mt-1.5">
              <span>Total</span>
              <span>{{ total() | currency:'BRL' }}</span>
            </div>
          </div>
        }

        <div class="flex gap-3 justify-end pt-2">
          <button type="button" (click)="voltar()"
            class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" [disabled]="form.invalid || salvando()"
            class="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            @if (salvando()) { Salvando... } @else { Salvar Orçamento }
          </button>
        </div>

        @if (erro()) {
          <p class="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-lg p-3">{{ erro() }}</p>
        }

      </form>
    </div>
  `,
})
export class OrcamentoFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private orcamentoService = inject(OrcamentoService);
  private clienteService = inject(ClienteService);
  private lojaService = inject(LojaService);
  private produtoService = inject(ProdutoService);
  private router = inject(Router);

  salvando = signal(false);
  erro = signal<string | null>(null);

  clienteQuery = signal('');
  clienteSugestoes = signal<ClienteResponse[]>([]);
  clienteSelecionado = signal<ClienteResponse | null>(null);
  mostrarClienteSugestoes = signal(false);
  private clienteSearch$ = new Subject<string>();

  lojas = signal<LojaResponse[]>([]);
  itemStates: ItemState[] = [];

  form = this.fb.group({
    clienteId: ['', Validators.required],
    lojaId: ['', Validators.required],
    dataValidade: ['', Validators.required],
    descontoTotal: [0],
    observacoes: [''],
    itens: this.fb.array<FormGroup>([]),
  });

  ngOnInit() {
    this.lojaService.listar().subscribe({
      next: lojas => this.lojas.set(lojas.filter(l => l.ativa)),
    });

    this.clienteSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.length < 2) { this.clienteSugestoes.set([]); return of([]); }
        return this.clienteService.buscar(q);
      }),
    ).subscribe({
      next: r => this.clienteSugestoes.set(r),
      error: () => this.clienteSugestoes.set([]),
    });
  }

  ngOnDestroy() {
    this.clienteSearch$.complete();
    this.itemStates.forEach(s => { s.search$.complete(); s.sub.unsubscribe(); });
  }

  onClienteInput(event: Event) {
    const q = (event.target as HTMLInputElement).value;
    this.clienteQuery.set(q);
    this.clienteSearch$.next(q);
    this.mostrarClienteSugestoes.set(true);
  }

  onClienteBlur() {
    setTimeout(() => this.mostrarClienteSugestoes.set(false), 150);
  }

  selecionarCliente(c: ClienteResponse) {
    this.clienteSelecionado.set(c);
    this.form.patchValue({ clienteId: c.id });
    this.mostrarClienteSugestoes.set(false);
    this.clienteSugestoes.set([]);
  }

  limparCliente() {
    this.clienteSelecionado.set(null);
    this.clienteQuery.set('');
    this.form.patchValue({ clienteId: '' });
  }

  onLojaChange(event: Event) {
    this.form.patchValue({ lojaId: (event.target as HTMLSelectElement).value });
  }

  get itensArray() { return this.form.get('itens') as FormArray; }

  addItem() {
    this.itensArray.push(this.fb.group({
      produtoId: [crypto.randomUUID()],
      nomeProduto: ['', Validators.required],
      unidadeMedida: ['un', Validators.required],
      quantidade: [1, [Validators.required, Validators.min(0.01)]],
      precoUnitario: [0, [Validators.required, Validators.min(0)]],
      descontoItem: [0],
    }));

    const idx = this.itemStates.length;
    const search$ = new Subject<string>();
    const sub = search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => q.length < 2 ? of([]) : this.produtoService.buscar(q)),
    ).subscribe({
      next: r => { const s = this.itemStates[idx]; if (s) s.sugestoes = r; },
      error: () => {},
    });

    this.itemStates.push({ query: '', sugestoes: [], selecionado: null, mostrar: false, search$, sub });
  }

  removeItem(i: number) {
    this.itensArray.removeAt(i);
    const [st] = this.itemStates.splice(i, 1);
    if (st) { st.search$.complete(); st.sub.unsubscribe(); }
  }

  onProdutoInput(i: number, event: Event) {
    const q = (event.target as HTMLInputElement).value;
    const st = this.itemStates[i];
    if (!st) return;
    st.query = q;
    st.mostrar = true;
    st.search$.next(q);
  }

  onProdutoBlur(i: number) {
    setTimeout(() => { const st = this.itemStates[i]; if (st) st.mostrar = false; }, 150);
  }

  setProdutoMostrar(i: number, v: boolean) {
    const st = this.itemStates[i]; if (st) st.mostrar = v;
  }

  selecionarProduto(i: number, p: ProdutoResponse) {
    const st = this.itemStates[i];
    if (!st) return;
    st.selecionado = p;
    st.mostrar = false;
    st.sugestoes = [];
    this.itensArray.at(i).patchValue({
      produtoId: p.id,
      nomeProduto: p.nome,
      unidadeMedida: p.unidadeMedida,
      precoUnitario: p.precoVenda,
    });
  }

  limparProduto(i: number) {
    const st = this.itemStates[i];
    if (!st) return;
    st.selecionado = null;
    st.query = '';
    st.sugestoes = [];
    this.itensArray.at(i).patchValue({ produtoId: crypto.randomUUID(), nomeProduto: '', unidadeMedida: 'un', precoUnitario: 0 });
  }

  incrementarQtd(i: number) {
    const ctrl = this.itensArray.at(i).get('quantidade');
    if (ctrl) ctrl.setValue(+(ctrl.value ?? 0) + 1);
  }

  decrementarQtd(i: number) {
    const ctrl = this.itensArray.at(i).get('quantidade');
    if (!ctrl) return;
    const next = +(ctrl.value ?? 1) - 1;
    if (next >= 0.01) ctrl.setValue(next);
  }

  itemTotal(i: number): number {
    const v = this.itensArray.at(i).value;
    const t = (v.quantidade ?? 0) * (v.precoUnitario ?? 0) - (v.descontoItem ?? 0);
    return t > 0 ? t : 0;
  }

  subtotal = computed(() =>
    (this.form.value.itens ?? []).reduce((acc: number, it: any) => {
      const t = (it.quantidade ?? 0) * (it.precoUnitario ?? 0) - (it.descontoItem ?? 0);
      return acc + (t > 0 ? t : 0);
    }, 0)
  );

  total = computed(() => Math.max(0, this.subtotal() - (this.form.value.descontoTotal ?? 0)));

  voltar() { this.router.navigate(['/app/vendas/orcamentos']); }

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
      next: orc => { this.salvando.set(false); this.router.navigate(['/app/vendas/orcamentos', orc.id]); },
      error: err => { this.salvando.set(false); this.erro.set(err?.error?.message ?? 'Erro ao salvar orçamento.'); },
    });
  }
}