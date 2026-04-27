import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE = 'http://localhost:8000/sales/v1';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface ItemPedidoRequest {
  produtoId: string;
  nomeProduto: string;
  unidadeMedida: string;
  quantidade: number;
  precoUnitario: number;
  descontoItem?: number;
}

export interface PagamentoRequest {
  metodo: 'Dinheiro' | 'CartaoDebito' | 'CartaoCredito' | 'PIX' | 'ContaCliente';
  valor: number;
  parcelas?: number;
  nsu?: string;
}

export interface CriarPedidoRequest {
  lojaId: string;
  clienteId: string;
  itens: ItemPedidoRequest[];
  descontoTotal?: number;
  observacoes?: string;
}

export interface FinalizarPedidoRequest {
  pagamentos: PagamentoRequest[];
  overrideEstoquePor?: string;
}

export interface CancelarPedidoRequest {
  motivo: string;
}

export interface ItemPedidoResponse {
  id: string;
  produtoId: string;
  nomeProduto: string;
  unidadeMedida: string;
  quantidade: number;
  precoUnitario: number;
  descontoItem: number;
  totalItem: number;
}

export interface PagamentoResponse {
  id: string;
  metodo: string;
  valor: number;
  parcelas: number;
  data: string;
  nsu: string | null;
}

export interface PedidoResponse {
  id: string;
  empresaId: string;
  lojaId: string;
  clienteId: string;
  vendedorId: string;
  status: 'Rascunho' | 'Confirmado' | 'Finalizado' | 'Cancelado';
  dataPedido: string;
  dataFinalizacao: string | null;
  subtotal: number;
  descontoTotal: number;
  total: number;
  observacoes: string | null;
  itens: ItemPedidoResponse[];
  pagamentos: PagamentoResponse[];
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RecebivelResponse {
  id: string;
  pedidoId: string;
  clienteId: string;
  valor: number;
  vencimento: string;
  status: 'Aberto' | 'Recebido' | 'Cancelado';
  dataRecebimento: string | null;
  parcelaNumero: number;
  parcelaTotal: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class VendaService {
  private http = inject(HttpClient);

  criarPedido(request: CriarPedidoRequest): Observable<PedidoResponse> {
    return this.http.post<PedidoResponse>(`${API_BASE}/pedidos`, request);
  }

  listarPedidos(params?: {
    status?: string;
    clienteId?: string;
    vendedorId?: string;
    de?: string;
    ate?: string;
    page?: number;
    pageSize?: number;
  }): Observable<PagedResult<PedidoResponse>> {
    return this.http.get<PagedResult<PedidoResponse>>(`${API_BASE}/pedidos`, { params: params as any });
  }

  obterPedido(id: string): Observable<PedidoResponse> {
    return this.http.get<PedidoResponse>(`${API_BASE}/pedidos/${id}`);
  }

  finalizarPedido(id: string, request: FinalizarPedidoRequest): Observable<PedidoResponse> {
    return this.http.post<PedidoResponse>(`${API_BASE}/pedidos/${id}/finalizar`, request);
  }

  cancelarPedido(id: string, request: CancelarPedidoRequest): Observable<PedidoResponse> {
    return this.http.post<PedidoResponse>(`${API_BASE}/pedidos/${id}/cancelar`, request);
  }

  listarRecebiveis(params?: {
    clienteId?: string;
    status?: string;
    vencimentoAte?: string;
  }): Observable<RecebivelResponse[]> {
    return this.http.get<RecebivelResponse[]>(`${API_BASE}/recebiveis`, { params: params as any });
  }

  receberRecebivel(id: string): Observable<RecebivelResponse> {
    return this.http.post<RecebivelResponse>(`${API_BASE}/recebiveis/${id}/receber`, {});
  }
}
