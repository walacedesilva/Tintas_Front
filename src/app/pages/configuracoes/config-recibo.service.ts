import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ConfiguracaoReciboResponse {
  lojaId: string;
  urlLogotipo: string | null;
  textoCabecalho: string | null;
  textoRodape: string | null;
  mensagemAgradecimento: string | null;
  exibirCnpjCliente: boolean;
  exibirEnderecoCliente: boolean;
  atualizadoEm: string | null;
}

export interface SalvarConfiguracaoReciboRequest {
  urlLogotipo?: string | null;
  textoCabecalho?: string | null;
  textoRodape?: string | null;
  mensagemAgradecimento?: string | null;
  exibirCnpjCliente: boolean;
  exibirEnderecoCliente: boolean;
}

const API_BASE = 'http://localhost:8000/sales/v1';

@Injectable({ providedIn: 'root' })
export class ConfigReciboService {
  private http = inject(HttpClient);

  obter(lojaId: string): Observable<ConfiguracaoReciboResponse> {
    return this.http.get<ConfiguracaoReciboResponse>(`${API_BASE}/vendas/configuracao-recibo/${lojaId}`);
  }

  salvar(lojaId: string, dados: SalvarConfiguracaoReciboRequest): Observable<ConfiguracaoReciboResponse> {
    return this.http.put<ConfiguracaoReciboResponse>(`${API_BASE}/vendas/configuracao-recibo/${lojaId}`, dados);
  }

  uploadLogotipo(lojaId: string, arquivo: File): Observable<{ url: string }> {
    const form = new FormData();
    form.append('arquivo', arquivo);
    return this.http.post<{ url: string }>(`${API_BASE}/vendas/configuracao-recibo/${lojaId}/logotipo`, form);
  }
}
