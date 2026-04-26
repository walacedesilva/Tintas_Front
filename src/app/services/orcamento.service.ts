import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE = 'http://localhost:8000/sales/v1';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface ItemOrcamentoRequest {
  produtoId: string;
  nomeProduto: string;
  unidadeMedida: string;
  quantidade: number;
  precoUnitario: number;
  descontoItem?: number;
}

export interface CriarOrcamentoRequest {
  lojaId: string;
  clienteId: string;
  itens: ItemOrcamentoRequest[];
  dataValidade: string; // ISO date yyyy-MM-dd
  descontoTotal?: number;
  observacoes?: string;
}

export interface ItemOrcamentoResponse {
  id: string;
  produtoId: string;
  nomeProduto: string;
  unidadeMedida: string;
  quantidade: number;
  precoUnitario: number;
  descontoItem: number;
  totalItem: number;
}

export interface OrcamentoResponse {
  id: string;
  empresaId: string;
  lojaId: string;
  clienteId: string;
  vendedorId: string;
  status: 'Aberto' | 'Convertido' | 'Expirado' | 'Cancelado';
  dataCriacao: string;
  dataValidade: string;
  subtotal: number;
  descontoTotal: number;
  total: number;
  observacoes?: string;
  temPdfSnapshot: boolean;
  convertidoEmPedidoId?: string;
  itens: ItemOrcamentoResponse[];
}

export interface OrcamentosPagedResult {
  items: OrcamentoResponse[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class OrcamentoService {
  private http = inject(HttpClient);

  criarOrcamento(request: CriarOrcamentoRequest): Observable<OrcamentoResponse> {
    return this.http.post<OrcamentoResponse>(`${API_BASE}/orcamentos`, request);
  }

  listarOrcamentos(params: {
    status?: string;
    clienteId?: string;
    page?: number;
    pageSize?: number;
  } = {}): Observable<OrcamentosPagedResult> {
    const qp: Record<string, string | number> = {};
    if (params.status) qp['status'] = params.status;
    if (params.clienteId) qp['clienteId'] = params.clienteId;
    if (params.page) qp['page'] = params.page;
    if (params.pageSize) qp['pageSize'] = params.pageSize;
    return this.http.get<OrcamentosPagedResult>(`${API_BASE}/orcamentos`, { params: qp as any });
  }

  obterOrcamento(id: string): Observable<OrcamentoResponse> {
    return this.http.get<OrcamentoResponse>(`${API_BASE}/orcamentos/${id}`);
  }

  pdfUrl(id: string): string {
    return `${API_BASE}/orcamentos/${id}/pdf`;
  }

  converterEmPedido(id: string): Observable<OrcamentoResponse> {
    return this.http.post<OrcamentoResponse>(`${API_BASE}/orcamentos/${id}/converter`, {});
  }
}
