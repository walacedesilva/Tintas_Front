import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, AsyncPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, Observable, of, debounceTime, distinctUntilChanged, filter, switchMap, catchError, tap } from 'rxjs';
import { VendaService, PagamentoRequest } from '../../../services/venda.service';
import { CarrinhoService } from '../../../services/carrinho.service';
import { ProdutoService, ProdutoResponse } from '../../../services/produto.service';
import { ClienteService, ClienteResponse } from '../../../services/cliente.service';
import { AuthService } from '../../../services/auth.service';
import { LojaService } from '../../../services/loja.service';

@Component({
  selector: 'app-pdv',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CurrencyPipe, AsyncPipe],
  template: `
    <div class="flex gap-4 h-full min-h-0">

      <!-- Left panel: product search + payment -->
      <div class="flex-1 flex flex-col gap-4 min-w-0">

        <!-- Product search -->
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">Buscar produto</h2>
          <div class="flex gap-2">
            <input
              type="text"
              [(ngModel)]="buscaProduto"
              (ngModelChange)="buscarProdutos($event)"
              placeholder="Código, nome ou NCM…"
              class="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
            />
          </div>

          @if (resultadosBusca().length > 0) {
            <ul class="mt-2 border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
              @for (p of resultadosBusca(); track p.id) {
                <li
                  class="px-3 py-2 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                  (click)="selecionarProduto(p)"
                >
                  <div>
                    <span class="text-sm font-medium text-gray-900">{{ p.nome }}</span>
                    <span class="text-xs text-gray-500 ml-2">{{ p.codigo }}</span>
                  </div>
                  <span class="text-sm font-semibold text-gray-700">
                    {{ p.precoVenda | currency:'BRL':'symbol':'1.2-2' }}
                  </span>
                </li>
              }
            </ul>
          }
        </div>

        <!-- Loja alert (US2: shown when user has no loja in JWT) -->
        @if (!lojaId) {
          <div class="bg-yellow-50 border border-yellow-300 rounded-xl p-4 flex items-center gap-3">
            <span class="text-yellow-600 text-lg">⚠️</span>
            <p class="text-sm text-yellow-800 font-medium">Este usuário não está associado a nenhuma loja. Contate o administrador.</p>
          </div>
        }

        <!-- Cliente typeahead + Pedido fields -->
        <div class="bg-white rounded-xl border border-gray-200 p-4" [class.pointer-events-none]="!lojaId" [class.opacity-50]="!lojaId">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">Pedido</h2>
          <div class="grid grid-cols-1 gap-3">
            <!-- Cliente typeahead (US1) -->
            <div class="relative">
              <label class="block text-xs font-medium text-gray-600 mb-1">Cliente</label>
              @if (clienteSelecionado()) {
                <!-- Selected client chip -->
                <div class="flex items-center gap-2 px-3 py-2 bg-violet-50 border border-violet-200 rounded-lg">
                  <div class="flex-1 min-w-0">
                    <span class="text-sm font-medium text-violet-900">{{ clienteSelecionado()!.nome }}</span>
                    <span class="text-xs text-violet-600 ml-2">{{ clienteSelecionado()!.cpfCnpj }}</span>
                    @if (!clienteSelecionado()!.ativo) {
                      <span class="ml-2 px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded">Inativo</span>
                    }
                  </div>
                  <button
                    type="button"
                    (click)="limparClienteSelecionado()"
                    class="text-violet-400 hover:text-violet-700 text-sm font-bold flex-shrink-0"
                    aria-label="Remover cliente"
                  >✕</button>
                </div>
              } @else {
                <!-- Search input -->
                <input
                  type="text"
                  #clienteBusca
                  (input)="onBuscaClienteChange($any($event).target.value)"
                  placeholder="Digite nome ou CPF/CNPJ (mínimo 2 caracteres)…"
                  class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  autocomplete="off"
                />
                @if (carregandoClientes()) {
                  <p class="mt-1 text-xs text-gray-400">Buscando…</p>
                }
                @if (mostrarDropdownCliente()) {
                  <ul class="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto divide-y divide-gray-100">
                    @for (c of clientes$ | async; track c.id) {
                      <li
                        class="px-3 py-2 flex items-center gap-3 hover:bg-violet-50 cursor-pointer"
                        (click)="selecionarCliente(c)"
                      >
                        <div class="flex-1 min-w-0">
                          <span class="text-sm font-medium text-gray-900 truncate block">{{ c.nome }}</span>
                          <span class="text-xs text-gray-500">{{ c.cpfCnpj }}</span>
                        </div>
                        @if (!c.ativo) {
                          <span class="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded flex-shrink-0">Inativo</span>
                        }
                      </li>
                    } @empty {
                      @if (!carregandoClientes() && !erroClientes()) {
                        <li class="px-3 py-3 text-sm text-gray-400 text-center">Nenhum cliente encontrado</li>
                      }
                    }
                    @if (erroClientes()) {
                      <li class="px-3 py-3 text-sm text-red-500 text-center">Erro ao buscar clientes. Tente novamente.</li>
                    }
                  </ul>
                }
              }
            </div>
            <!-- Observações -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Observações</label>
              <input
                type="text"
                [(ngModel)]="observacoesInput"
                (ngModelChange)="carrinho.setObservacoes($event)"
                placeholder="Observações opcionais"
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <!-- Payment form -->
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">Pagamento</h2>
          <div class="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Método</label>
              <select
                [(ngModel)]="pagMetodo"
                (ngModelChange)="onMetodoChange()"
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
              >
                <option value="Dinheiro">Dinheiro</option>
                <option value="CartaoDebito">Cartão Débito</option>
                <option value="CartaoCredito">Cartão Crédito</option>
                <option value="PIX">PIX</option>
                <option value="ContaCliente">Conta Cliente</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Valor (R$)</label>
              <input
                type="number"
                [(ngModel)]="pagValor"
                min="0"
                step="0.01"
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
              />
            </div>
            <div>
              @if (aceitaParcelas) {
                <label class="block text-xs font-medium text-gray-600 mb-1">Parcelas</label>
                <input
                  type="number"
                  [(ngModel)]="pagParcelas"
                  min="1"
                  max="12"
                  class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              } @else {
                <label class="block text-xs font-medium text-gray-600 mb-1">Condição</label>
                <div class="w-full px-3 py-2 text-sm border border-gray-100 rounded-lg bg-gray-50 text-gray-500 select-none">
                  À vista
                </div>
              }
            </div>
          </div>
          <button
            (click)="adicionarPagamento()"
            class="px-4 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
          >
            + Adicionar pagamento
          </button>

          @if (pagamentos().length > 0) {
            <ul class="mt-3 divide-y divide-gray-100">
              @for (p of pagamentos(); track $index) {
                <li class="py-2 flex items-center justify-between text-sm">
                  <span class="text-gray-700">{{ labelMetodo(p.metodo) }}
                    @if (p.metodo === 'CartaoCredito') {
                      <span class="text-xs text-gray-400 ml-1">{{ (p.parcelas ?? 1) }}x</span>
                    } @else {
                      <span class="text-xs text-gray-400 ml-1">à vista</span>
                    }
                  </span>
                  <div class="flex items-center gap-3">
                    <span class="font-medium">{{ p.valor | currency:'BRL':'symbol':'1.2-2' }}</span>
                    <button (click)="removerPagamento($index)" class="text-red-400 hover:text-red-600 text-xs">✕</button>
                  </div>
                </li>
              }
            </ul>
            <div class="mt-2 text-right text-sm">
              <span class="text-gray-500">Total pago: </span>
              <span class="font-semibold"
                [class.text-green-600]="totalPago() >= carrinho.total()"
                [class.text-red-600]="totalPago() < carrinho.total()">
                {{ totalPago() | currency:'BRL':'symbol':'1.2-2' }}
              </span>
            </div>
            <div class="mt-1 text-right text-xs font-medium">
              @if (saldoRestante() < 0) {
                <span class="text-red-600">Faltam {{ saldoRestante() * -1 | currency:'BRL':'symbol':'1.2-2' }}</span>
              } @else if (saldoRestante() > 0) {
                <span class="text-green-600">Troco: {{ saldoRestante() | currency:'BRL':'symbol':'1.2-2' }}</span>
              } @else if (totalPago() > 0) {
                <span class="text-green-600">✓ Valor exato</span>
              }
            </div>
          }
        </div>

      </div>

      <!-- Right panel: cart -->
      <div class="w-80 flex flex-col gap-4">
        <div class="bg-white rounded-xl border border-gray-200 flex flex-col flex-1 overflow-hidden">
          <div class="p-4 border-b border-gray-100">
            <h2 class="text-sm font-semibold text-gray-700">Carrinho
              @if (carrinho.itemCount() > 0) {
                <span class="ml-2 px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full">
                  {{ carrinho.itemCount() }}
                </span>
              }
            </h2>
          </div>

          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            @if (carrinho.itens().length === 0) {
              <p class="text-sm text-gray-400 text-center py-8">Carrinho vazio</p>
            }
            @for (item of carrinho.itens(); track item._key) {
              <div class="flex items-start gap-3">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ item.nomeProduto }}</p>
                  <p class="text-xs text-gray-500">{{ item.precoUnitario | currency:'BRL':'symbol':'1.2-2' }} / {{ item.unidadeMedida }}</p>
                </div>
                <div class="flex items-center gap-1">
                  <button
                    (click)="carrinho.atualizarQuantidade(item._key, item.quantidade - 1)"
                    class="w-6 h-6 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs flex items-center justify-center"
                  >−</button>
                  <span class="text-sm font-medium w-8 text-center">{{ item.quantidade }}</span>
                  <button
                    (click)="carrinho.atualizarQuantidade(item._key, item.quantidade + 1)"
                    class="w-6 h-6 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs flex items-center justify-center"
                  >+</button>
                </div>
                <div class="text-right">
                  <p class="text-sm font-semibold text-gray-800">
                    {{ item.quantidade * (item.precoUnitario - (item.descontoItem ?? 0)) | currency:'BRL':'symbol':'1.2-2' }}
                  </p>
                  <button
                    (click)="carrinho.removerItem(item._key)"
                    class="text-xs text-red-400 hover:text-red-600"
                  >remover</button>
                </div>
              </div>
            }
          </div>

          <!-- Totals -->
          <div class="border-t border-gray-100 p-4 space-y-2">
            <div class="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{{ carrinho.subtotal() | currency:'BRL':'symbol':'1.2-2' }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500 flex-1">Desconto</span>
              <input
                type="number"
                [(ngModel)]="descontoInput"
                (ngModelChange)="carrinho.setDesconto(+$event)"
                min="0"
                step="0.01"
                class="w-24 px-2 py-1 text-sm text-right border border-gray-200 rounded focus:ring-1 focus:ring-violet-500 focus:outline-none"
              />
            </div>
            <div class="flex justify-between text-base font-bold text-gray-900 pt-1 border-t border-gray-100">
              <span>Total</span>
              <span>{{ carrinho.total() | currency:'BRL':'symbol':'1.2-2' }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="p-4 pt-0 space-y-2">
            @if (erro()) {
              <p class="text-xs text-red-600 bg-red-50 rounded p-2">{{ erro() }}</p>
            }
            @if (sucesso()) {
              <p class="text-xs text-green-700 bg-green-50 rounded p-2">{{ sucesso() }}</p>
            }
            @if (ultimoPedidoId()) {
              <a [href]="reciboUrl(ultimoPedidoId()!)" target="_blank"
                class="block w-full py-2 text-center text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
                🧾 Emitir Recibo
              </a>
            }
            <button
              (click)="finalizarVenda()"
              [disabled]="carregando() || !podeFinalizarr()"
              [class.opacity-50]="!podeFinalizarr()"
              class="w-full py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              @if (carregando()) { Processando… } @else { Finalizar Venda }
            </button>
            <button
              (click)="limpar()"
              class="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Limpar carrinho
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PdvComponent implements OnInit {
  readonly carrinho = inject(CarrinhoService);
  private readonly vendaService = inject(VendaService);
  private readonly produtoService = inject(ProdutoService);
  private readonly clienteService = inject(ClienteService);
  private readonly authService = inject(AuthService);
  private readonly lojaService = inject(LojaService);

  // Form inputs
  buscaProduto = '';
  observacoesInput = '';
  descontoInput = 0;

  // Store resolved from JWT (US2)
  lojaId: string | null = null;

  // Payment form inputs
  pagMetodo: PagamentoRequest['metodo'] = 'Dinheiro';
  pagValor = 0;
  pagParcelas = 1;

  // Product search
  readonly resultadosBusca = signal<ProdutoResponse[]>([]);

  // Payment signals
  readonly pagamentos = signal<PagamentoRequest[]>([]);
  readonly carregando = signal(false);
  readonly erro = signal('');
  readonly sucesso = signal('');
  readonly ultimoPedidoId = signal<string | null>(null);

  // Client typeahead signals (US1)
  readonly clienteSelecionado = signal<ClienteResponse | null>(null);
  readonly mostrarDropdownCliente = signal(false);
  readonly carregandoClientes = signal(false);
  readonly erroClientes = signal(false);

  // RxJS typeahead pipeline
  readonly termoBuscaCliente$ = new Subject<string>();
  readonly clientes$: Observable<ClienteResponse[]> = this.termoBuscaCliente$.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    filter(t => t.length >= 2),
    switchMap(t => {
      this.carregandoClientes.set(true);
      this.erroClientes.set(false);
      return this.clienteService.buscar(t).pipe(
        tap(() => this.carregandoClientes.set(false)),
        catchError(() => {
          this.carregandoClientes.set(false);
          this.erroClientes.set(true);
          return of([]);
        })
      );
    })
  );

  // Payment computed signals
  readonly totalPago = computed(() =>
    this.pagamentos().reduce((acc, p) => acc + p.valor, 0)
  );

  // US3: payment validation computed signals
  readonly saldoRestante = computed(() => this.carrinho.total() - this.totalPago());

  readonly podeFinalizarr = computed(() =>
    this.clienteSelecionado() !== null &&
    !!this.lojaId &&
    this.totalPago() >= this.carrinho.total() &&
    this.carrinho.total() > 0 &&
    this.carrinho.itens().length > 0
  );

  ngOnInit(): void {
    const role = this.authService.getRole();
    // Fallback to JWT claim while API loads (avoids flash)
    this.lojaId = this.authService.getLojaId() ?? this.authService.getLojaIds()[0] ?? null;
    this.lojaService.listar().subscribe({
      next: lojas => {
        const ativas = lojas.filter(l => l.ativa);
        if (ativas.length > 0 && !this.lojaId) {
          this.lojaId = ativas[0].id;
        } else if (ativas.length === 0 && role !== 'admin') {
          this.lojaId = null;
        }
      },
    });
  }

  buscarProdutos(q: string): void {
    if (q.length < 2) { this.resultadosBusca.set([]); return; }
    this.produtoService.buscar(q).subscribe({
      next: items => this.resultadosBusca.set(items),
      error: () => this.resultadosBusca.set([]),
    });
  }

  selecionarProduto(p: ProdutoResponse): void {
    this.carrinho.adicionarItem({
      produtoId: p.id,
      nomeProduto: p.nome,
      unidadeMedida: p.unidadeMedida,
      quantidade: 1,
      precoUnitario: p.precoVenda,
    });
    this.buscaProduto = '';
    this.resultadosBusca.set([]);
  }

  // Client typeahead methods (US1)
  onBuscaClienteChange(termo: string): void {
    this.termoBuscaCliente$.next(termo);
    this.mostrarDropdownCliente.set(termo.length >= 2);
  }

  selecionarCliente(c: ClienteResponse): void {
    this.carrinho.setCliente(c.id, c.nome);
    this.clienteSelecionado.set(c);
    this.mostrarDropdownCliente.set(false);
    this.carregandoClientes.set(false);
  }

  limparClienteSelecionado(): void {
    this.clienteSelecionado.set(null);
    this.mostrarDropdownCliente.set(false);
    this.carrinho.limparCliente();
  }

  get aceitaParcelas(): boolean {
    return this.pagMetodo === 'CartaoCredito';
  }

  onMetodoChange(): void {
    this.pagParcelas = 1;
  }

  labelMetodo(metodo: string): string {
    const labels: Record<string, string> = {
      Dinheiro: 'Dinheiro',
      CartaoDebito: 'Cartão Débito',
      CartaoCredito: 'Cartão Crédito',
      PIX: 'PIX',
      ContaCliente: 'Conta Cliente',
    };
    return labels[metodo] ?? metodo;
  }

  adicionarPagamento(): void {
    if (this.pagValor <= 0) return;
    this.pagamentos.update(p => [...p, {
      metodo: this.pagMetodo,
      valor: this.pagValor,
      parcelas: this.aceitaParcelas ? this.pagParcelas : 1,
    }]);
    this.pagValor = 0;
    this.pagParcelas = 1;
  }

  removerPagamento(index: number): void {
    this.pagamentos.update(p => p.filter((_, i) => i !== index));
  }

  finalizarVenda(): void {
    this.erro.set('');
    this.sucesso.set('');

    if (!this.podeFinalizarr()) {
      this.erro.set('Selecione um cliente e verifique o total pago.');
      return;
    }

    this.carregando.set(true);

    this.vendaService.criarPedido({
      lojaId: this.lojaId!,
      clienteId: this.carrinho.clienteId(),
      itens: this.carrinho.itens(),
      descontoTotal: this.carrinho.descontoTotal(),
      observacoes: this.carrinho.observacoes() || undefined,
    }).subscribe({
      next: pedido => {
        this.vendaService.finalizarPedido(pedido.id, {
          pagamentos: this.pagamentos(),
        }).subscribe({
          next: () => {
            this.carregando.set(false);
            this.ultimoPedidoId.set(pedido.id);
            this.sucesso.set(`Venda #${pedido.id.slice(0, 8)} finalizada com sucesso!`);
            this.limpar();
          },
          error: (err) => {
            this.carregando.set(false);
            this.erro.set(err?.error?.erros ? 'Estoque insuficiente para um ou mais itens.' : 'Erro ao finalizar a venda.');
          },
        });
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set('Erro ao criar o pedido.');
      },
    });
  }

  limpar(): void {
    this.carrinho.limpar();
    this.pagamentos.set([]);
    this.ultimoPedidoId.set(null);
    this.clienteSelecionado.set(null);
    this.mostrarDropdownCliente.set(false);
    this.observacoesInput = '';
    this.descontoInput = 0;
  }

  reciboUrl(pedidoId: string): string {
    return `http://localhost:8000/sales/v1/pedidos/${pedidoId}/recibo`;
  }
}
