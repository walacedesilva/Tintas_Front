import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UsuarioResponse {
  id: string;
  login: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  empresaId: string;
}

export interface CriarUsuarioRequest {
  login: string;
  nome: string;
  email: string;
  password: string;
  role: string;
  empresaId: string;
}

export interface AtualizarUsuarioRequest {
  nome?: string;
  role?: string;
  ativo?: boolean;
}

const API_BASE = 'http://localhost:8000/core/v1';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);

  listar(): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(`${API_BASE}/usuarios`);
  }

  criar(data: CriarUsuarioRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(`${API_BASE}/usuarios`, data);
  }

  atualizar(id: string, data: AtualizarUsuarioRequest): Observable<UsuarioResponse> {
    return this.http.put<UsuarioResponse>(`${API_BASE}/usuarios/${id}`, data);
  }
}
