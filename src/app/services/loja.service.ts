import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LojaResponse {
  id: string;
  nome: string;
  cnpjLoja: string | null;
  endereco: string | null;
  ativa: boolean;
}

export interface CriarLojaRequest {
  nome: string;
  cnpj: string;
  endereco?: string;
}

export interface AtualizarLojaRequest {
  nome: string;
  cnpj: string;
  endereco?: string;
  ativa?: boolean;
}

const API_BASE = 'http://localhost:8000/core/v1';

@Injectable({ providedIn: 'root' })
export class LojaService {
  private http = inject(HttpClient);

  listar(): Observable<LojaResponse[]> {
    return this.http.get<LojaResponse[]>(`${API_BASE}/lojas`);
  }

  criar(data: CriarLojaRequest): Observable<LojaResponse> {
    return this.http.post<LojaResponse>(`${API_BASE}/lojas`, data);
  }

  atualizar(id: string, data: AtualizarLojaRequest): Observable<LojaResponse> {
    return this.http.put<LojaResponse>(`${API_BASE}/lojas/${id}`, data);
  }

  desativar(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/lojas/${id}`);
  }
}
