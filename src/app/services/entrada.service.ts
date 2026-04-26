import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface ItemPreviewDto {
  codigoProdutoNf: string;
  descricaoProdutoNf: string;
  ncm: string | null;
  unidadeMedida: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  produtoIdVinculado: string | null;
  naoVinculado: boolean;
}

export interface EntradaPreviewDto {
  chNFe: string;
  numeroNf: string;
  serieNf: string;
  dataEmissao: string;
  valorTotal: number;
  itens: ItemPreviewDto[];
  possuiItensNaoVinculados: boolean;
}

export interface ConfirmarItemRequest {
  codigoProdutoNf: string;
  descricaoProdutoNf: string;
  ncm: string | null;
  unidadeMedida: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  produtoId: string;
}

export interface ConfirmarEntradaRequest {
  lojaId: string;
  fornecedorId: string;
  chNFe: string;
  numeroNf: string;
  serieNf: string;
  dataEmissao: string;
  valorTotal: number;
  itens: ConfirmarItemRequest[];
}

export interface ItemEntradaResponse {
  id: string;
  produtoId: string | null;
  codigoProdutoNf: string;
  descricaoProdutoNf: string;
  ncm: string | null;
  unidadeMedida: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface EntradaMercadoriaResponse {
  id: string;
  empresaId: string;
  lojaId: string;
  chNFe: string;
  numeroNf: string;
  serieNf: string;
  dataEmissao: string;
  valorTotal: number;
  status: string;
  createdAt: string;
  confirmadaAt: string | null;
  itens: ItemEntradaResponse[];
}

export interface VincularProdutoRequest {
  empresaId?: string;
  chNFe: string;
  codigoProdutoNf: string;
  produtoId: string;
}

const API_BASE = 'http://localhost:8000/inventory/v1';

@Injectable({ providedIn: 'root' })
export class EntradaService {
  private http = inject(HttpClient);

  /** Parse NF-e XML — returns preview without persisting. */
  parsear(file: File): Observable<EntradaPreviewDto> {
    const form = new FormData();
    form.append('xml', file, file.name);
    return this.http.post<EntradaPreviewDto>(`${API_BASE}/entrada/parsear`, form);
  }

  /** Confirm and persist NF-e goods receipt. Updates stock. */
  confirmar(request: ConfirmarEntradaRequest): Observable<EntradaMercadoriaResponse> {
    return this.http.post<EntradaMercadoriaResponse>(`${API_BASE}/entrada/confirmar`, request);
  }

  /** Link an unmatched NF-e item to an existing product. */
  vincularProduto(cmd: VincularProdutoRequest): Observable<{ success: boolean; error?: string }> {
    return this.http.post<{ success: boolean; error?: string }>(
      `${API_BASE}/entrada/vincular-produto`,
      cmd
    );
  }

  /** List confirmed/pending entradas for the current empresa. */
  listar(page = 1, pageSize = 20): Observable<EntradaMercadoriaResponse[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<EntradaMercadoriaResponse[]>(`${API_BASE}/entrada`, { params });
  }
}
