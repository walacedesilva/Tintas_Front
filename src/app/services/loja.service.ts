import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LojaResponse {
  id: string;
  nome: string;
  cnpjLoja: string | null;
  ativa: boolean;
}

const API_BASE = 'http://localhost:8000/core/v1';

@Injectable({ providedIn: 'root' })
export class LojaService {
  private http = inject(HttpClient);

  listar(): Observable<LojaResponse[]> {
    return this.http.get<LojaResponse[]>(`${API_BASE}/lojas`);
  }
}
