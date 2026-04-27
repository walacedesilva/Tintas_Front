import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProdutoResponse {
  id: string;
  empresaId: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  unidadeMedida: string;
  precoVenda: number;
  precoCusto: number;
  estoqueMinimo: number;
  ncm: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CriarProdutoRequest {
  codigo: string;
  nome: string;
  unidadeMedida: string;
  precoVenda: number;
  precoCusto?: number;
  estoqueMinimo?: number;
  descricao?: string | null;
  ncm?: string | null;
}

export interface AtualizarProdutoRequest {
  nome?: string | null;
  descricao?: string | null;
  unidadeMedida?: string | null;
  precoVenda?: number | null;
  precoCusto?: number | null;
  estoqueMinimo?: number | null;
  ncm?: string | null;
}

const API_BASE = 'http://localhost:8000/inventory/v1';

@Injectable({ providedIn: 'root' })
export class ProdutoService {
  private http = inject(HttpClient);

  listar(): Observable<ProdutoResponse[]> {
    return this.http.get<ProdutoResponse[]>(`${API_BASE}/produtos`);
  }

  buscar(termo: string): Observable<ProdutoResponse[]> {
    if (!termo?.trim()) return this.listar();
    return this.http.get<ProdutoResponse[]>(`${API_BASE}/produtos/buscar`, { params: { q: termo } });
  }

  obter(id: string): Observable<ProdutoResponse> {
    return this.http.get<ProdutoResponse>(`${API_BASE}/produtos/${id}`);
  }

  criar(request: CriarProdutoRequest): Observable<ProdutoResponse> {
    return this.http.post<ProdutoResponse>(`${API_BASE}/produtos`, request);
  }

  atualizar(id: string, request: AtualizarProdutoRequest): Observable<ProdutoResponse> {
    return this.http.put<ProdutoResponse>(`${API_BASE}/produtos/${id}`, request);
  }
}
