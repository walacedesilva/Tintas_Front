import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PermissaoTelaDto {
  codigoTela: string;
  permitido: boolean;
}

export interface MatrizPermissoesPapel {
  papel: string;
  telas: PermissaoTelaDto[];
}

export interface MatrizPermissoesResponse {
  papeis: MatrizPermissoesPapel[];
}

const API_BASE = 'http://localhost:8000/core';

@Injectable({ providedIn: 'root' })
export class PermissoesTelaService {
  private http = inject(HttpClient);

  listar(): Observable<MatrizPermissoesResponse> {
    return this.http.get<MatrizPermissoesResponse>(`${API_BASE}/v1/configuracoes/permissoes-tela`);
  }

  atualizar(papel: string, permissoes: PermissaoTelaDto[]): Observable<void> {
    return this.http.put<void>(
      `${API_BASE}/v1/configuracoes/permissoes-tela/${encodeURIComponent(papel)}`,
      { permissoes }
    );
  }
}
