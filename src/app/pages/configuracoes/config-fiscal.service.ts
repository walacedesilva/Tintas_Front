import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ConfiguracaoFiscalResponse {
  lojaId: string;
  serieNFe: number;
  serieNFCe: number;
  numeroInicialNFe: number;
  numeroInicialNFCe: number;
  regimeTributario: string;
  ambienteSefaz: string;
  cstVenda: string | null;
  cstDevolucao: string | null;
  cstTransferencia: string | null;
  csosnVenda: string | null;
  certificadoValidade: string | null;
  atualizadoEm: string | null;
}

export interface SalvarConfiguracaoFiscalRequest {
  serieNFe: number;
  serieNFCe: number;
  numeroInicialNFe: number;
  numeroInicialNFCe: number;
  regimeTributario: string;
  ambienteSefaz: string;
  cstVenda?: string | null;
  cstDevolucao?: string | null;
  cstTransferencia?: string | null;
  csosnVenda?: string | null;
}

const API_BASE = 'http://localhost:8000/fiscal/v1';

@Injectable({ providedIn: 'root' })
export class ConfigFiscalService {
  private http = inject(HttpClient);

  obter(lojaId: string): Observable<ConfiguracaoFiscalResponse> {
    return this.http.get<ConfiguracaoFiscalResponse>(`${API_BASE}/fiscal/configuracao/${lojaId}`);
  }

  salvar(lojaId: string, dados: SalvarConfiguracaoFiscalRequest): Observable<ConfiguracaoFiscalResponse> {
    return this.http.put<ConfiguracaoFiscalResponse>(`${API_BASE}/fiscal/configuracao/${lojaId}`, dados);
  }
}
