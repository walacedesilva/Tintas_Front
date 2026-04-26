import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE = 'http://localhost:8000/core';

export interface VinculoResponse {
  id: string;
  empresaId: string;
  usuarioId: string;
  lojaId: string;
  ativo: boolean;
  criadoEm: string;
}

export interface PermissaoUsuarioDto {
  id: string;
  login: string;
  email: string;
  role: string;
  ativo: boolean;
  vinculos: VinculoResponse[];
}

export interface PermissoesPagedResponse {
  items: PermissaoUsuarioDto[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class PermissaoService {
  private http = inject(HttpClient);

  adicionarVinculo(usuarioId: string, lojaId: string): Observable<VinculoResponse> {
    return this.http.post<VinculoResponse>(
      `${API_BASE}/v1/permissoes/vinculos`,
      { usuarioId, lojaId }
    );
  }

  removerVinculo(vinculoId: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/v1/permissoes/vinculos/${vinculoId}`);
  }

  atualizarPapel(usuarioId: string, papel: string): Observable<PermissaoUsuarioDto> {
    return this.http.put<PermissaoUsuarioDto>(
      `${API_BASE}/v1/permissoes/usuarios/${usuarioId}/papel`,
      { papel }
    );
  }

  listarPermissoes(params: {
    lojaId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Observable<PermissoesPagedResponse> {
    let httpParams = new HttpParams();
    if (params.lojaId) httpParams = httpParams.set('lojaId', params.lojaId);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.page !== undefined) httpParams = httpParams.set('page', String(params.page));
    if (params.pageSize !== undefined) httpParams = httpParams.set('pageSize', String(params.pageSize));
    return this.http.get<PermissoesPagedResponse>(`${API_BASE}/v1/permissoes/usuarios`, { params: httpParams });
  }
}
