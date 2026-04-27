import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type PapelLoja = 'admin' | 'gerente_vendas' | 'vendedor' | 'operador_estoque' | 'operador_fiscal';

export const PAPEIS_LOJA: { value: PapelLoja; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'gerente_vendas', label: 'Gerente de Vendas' },
  { value: 'vendedor', label: 'Vendedor' },
  { value: 'operador_estoque', label: 'Operador de Estoque' },
  { value: 'operador_fiscal', label: 'Operador Fiscal' },
];

export interface VinculoLojaResponse {
  id: string;
  usuarioId: string;
  nomeUsuario: string;
  emailUsuario: string;
  papel: PapelLoja;
  ativo: boolean;
}

export interface CriarVinculoRequest {
  usuarioId: string;
  papel: PapelLoja;
}

const API_BASE = 'http://localhost:8000/core/v1';

@Injectable({ providedIn: 'root' })
export class VinculoLojaService {
  private http = inject(HttpClient);

  listarPorLoja(lojaId: string): Observable<VinculoLojaResponse[]> {
    return this.http.get<VinculoLojaResponse[]>(`${API_BASE}/lojas/${lojaId}/vinculos`);
  }

  criar(lojaId: string, data: CriarVinculoRequest): Observable<VinculoLojaResponse> {
    return this.http.post<VinculoLojaResponse>(`${API_BASE}/lojas/${lojaId}/vinculos`, data);
  }

  remover(lojaId: string, usuarioId: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/lojas/${lojaId}/vinculos/${usuarioId}`);
  }
}
