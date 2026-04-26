import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EstoqueLojaResponse {
  produtoId: string;
  lojaId: string;
  quantidade: number;
  updatedAt: string;
}

export interface MovimentacaoResponse {
  id: string;
  produtoId: string;
  lojaId: string;
  tipo: string;
  delta: number;
  quantidadeAntes: number;
  quantidadeDepois: number;
  operadorId: string;
  justificativa: string | null;
  criadoEm: string;
}

export interface AjusteEstoqueRequest {
  produtoId: string;
  lojaId: string;
  delta: number;
  justificativa: string;
}

const API_BASE = 'http://localhost:8000/inventory/v1';

@Injectable({ providedIn: 'root' })
export class EstoqueService {
  private http = inject(HttpClient);

  listarEstoque(): Observable<EstoqueLojaResponse[]> {
    return this.http.get<EstoqueLojaResponse[]>(`${API_BASE}/estoque`);
  }

  ajustar(request: AjusteEstoqueRequest): Observable<MovimentacaoResponse> {
    return this.http.post<MovimentacaoResponse>(`${API_BASE}/estoque/ajuste`, request);
  }

  listarMovimentacoes(
    produtoId?: string,
    lojaId?: string,
    page = 1,
    pageSize = 50
  ): Observable<MovimentacaoResponse[]> {
    const params: Record<string, string | number> = { page, pageSize };
    if (produtoId) params['produtoId'] = produtoId;
    if (lojaId) params['lojaId'] = lojaId;
    return this.http.get<MovimentacaoResponse[]>(`${API_BASE}/movimentacoes`, { params });
  }
}
