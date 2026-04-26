import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ConfiguracaoOrcamentoResponse {
  prazoValidadeDias: number;
  textoCondicoes: string | null;
  observacoesPadrao: string | null;
  descontosMaximos: Record<string, number> | null;
  atualizadoEm: string | null;
}

export interface SalvarConfiguracaoOrcamentoRequest {
  prazoValidadeDias: number;
  textoCondicoes?: string | null;
  observacoesPadrao?: string | null;
  descontosMaximos?: Record<string, number> | null;
}

const API_BASE = 'http://localhost:8000/sales/v1';

@Injectable({ providedIn: 'root' })
export class ConfigOrcamentoService {
  private http = inject(HttpClient);

  obter(): Observable<ConfiguracaoOrcamentoResponse> {
    return this.http.get<ConfiguracaoOrcamentoResponse>(`${API_BASE}/vendas/configuracao-orcamento`);
  }

  salvar(dados: SalvarConfiguracaoOrcamentoRequest): Observable<ConfiguracaoOrcamentoResponse> {
    return this.http.put<ConfiguracaoOrcamentoResponse>(`${API_BASE}/vendas/configuracao-orcamento`, dados);
  }
}
