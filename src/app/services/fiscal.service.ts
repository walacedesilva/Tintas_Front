import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EmitirNFeRequest {
  empresaId: string;
  lojaId: string;
  pedidoId: string;
  modelo: number; // 55 | 65
  serie: number;
  ambiente: 'Producao' | 'Homologacao';
}

export interface EventoNFeResponse {
  id: string;
  tipo: string;
  mensagem: string;
  codigoSefaz: string | null;
  timestamp: string;
}

export interface NFeResponse {
  id: string;
  empresaId: string;
  lojaId: string;
  pedidoId: string;
  modelo: number;
  serie: number;
  numero: number;
  chNfe: string | null;
  status: string;
  ambiente: string;
  codigoStatusSefaz: string | null;
  mensagemSefaz: string | null;
  tentativas: number;
  autorizadaEm: string | null;
  canceladaEm: string | null;
  createdAt: string;
  eventos: EventoNFeResponse[];
}

export interface NFePagedResult {
  items: NFeResponse[];
  totalItems: number;
  page: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class FiscalService {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8000/fiscal/v1';

  emitirNFe(request: EmitirNFeRequest): Observable<NFeResponse> {
    return this.http.post<NFeResponse>(`${this.base}/nfe`, request);
  }

  listarNFes(status?: string, page = 1, pageSize = 20): Observable<NFePagedResult> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (status) params = params.set('status', status);
    return this.http.get<NFePagedResult>(`${this.base}/nfe`, { params });
  }

  obterNFe(id: string): Observable<NFeResponse> {
    return this.http.get<NFeResponse>(`${this.base}/nfe/${id}`);
  }

  danfeUrl(id: string): string {
    return `${this.base}/nfe/${id}/danfe`;
  }

  cancelarNFe(id: string, justificativa: string): Observable<NFeResponse> {
    return this.http.post<NFeResponse>(`${this.base}/nfe/${id}/cancelar`, { justificativa });
  }
}
