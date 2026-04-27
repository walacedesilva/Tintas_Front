import { Injectable, computed, signal } from '@angular/core';
import { ItemPedidoRequest } from './venda.service';

export interface CarrinhoItem extends ItemPedidoRequest {
  _key: string; // produtoId for dedup
}

@Injectable({ providedIn: 'root' })
export class CarrinhoService {
  private _itens = signal<CarrinhoItem[]>([]);
  private _descontoTotal = signal<number>(0);
  private _clienteId = signal<string>('');
  private _clienteNome = signal<string>('');
  private _lojaId = signal<string>('');
  private _observacoes = signal<string>('');

  readonly itens = this._itens.asReadonly();
  readonly descontoTotal = this._descontoTotal.asReadonly();
  readonly clienteId = this._clienteId.asReadonly();
  readonly clienteNome = this._clienteNome.asReadonly();
  readonly lojaId = this._lojaId.asReadonly();
  readonly observacoes = this._observacoes.asReadonly();

  readonly subtotal = computed(() =>
    this._itens().reduce(
      (acc, i) => acc + i.quantidade * (i.precoUnitario - (i.descontoItem ?? 0)),
      0
    )
  );

  readonly total = computed(() =>
    Math.max(0, this.subtotal() - this._descontoTotal())
  );

  readonly itemCount = computed(() =>
    this._itens().reduce((acc, i) => acc + i.quantidade, 0)
  );

  adicionarItem(item: ItemPedidoRequest): void {
    this._itens.update(itens => {
      const idx = itens.findIndex(i => i._key === item.produtoId);
      if (idx >= 0) {
        const updated = [...itens];
        updated[idx] = { ...updated[idx], quantidade: updated[idx].quantidade + item.quantidade };
        return updated;
      }
      return [...itens, { ...item, _key: item.produtoId }];
    });
  }

  atualizarQuantidade(produtoId: string, quantidade: number): void {
    if (quantidade <= 0) {
      this.removerItem(produtoId);
      return;
    }
    this._itens.update(itens =>
      itens.map(i => i._key === produtoId ? { ...i, quantidade } : i)
    );
  }

  removerItem(produtoId: string): void {
    this._itens.update(itens => itens.filter(i => i._key !== produtoId));
  }

  setDesconto(desconto: number): void {
    this._descontoTotal.set(Math.max(0, desconto));
  }

  setClienteId(id: string): void {
    this._clienteId.set(id);
  }

  setCliente(id: string, nome: string): void {
    this._clienteId.set(id);
    this._clienteNome.set(nome);
  }

  limparCliente(): void {
    this._clienteId.set('');
    this._clienteNome.set('');
  }

  setLojaId(id: string): void {
    this._lojaId.set(id);
  }

  setObservacoes(obs: string): void {
    this._observacoes.set(obs);
  }

  limpar(): void {
    this._itens.set([]);
    this._descontoTotal.set(0);
    this._lojaId.set('');
    this._observacoes.set('');
    this.limparCliente();
  }
}
