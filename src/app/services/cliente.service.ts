import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ClienteResponse {
  id: string;
  empresaId: string;
  tipo: number;
  nome: string;
  cpfCnpj: string;
  inscricaoEstadual: string | null;
  email: string | null;
  telefone: string | null;
  enderecoLogradouro: string | null;
  enderecoNumero: string | null;
  enderecoComplemento: string | null;
  enderecoBairro: string | null;
  enderecoMunicipio: string | null;
  enderecoUf: string | null;
  enderecoCep: string | null;
  limiteCredito: number;
  ativo: boolean;
}

export interface CriarClienteRequest {
  tipo: number;
  nome: string;
  cpfCnpj: string;
  inscricaoEstadual?: string | null;
  email?: string | null;
  telefone?: string | null;
  limiteCredito: number;
}

export interface AtualizarClienteRequest {
  nome?: string | null;
  email?: string | null;
  telefone?: string | null;
  inscricaoEstadual?: string | null;
  enderecoLogradouro?: string | null;
  enderecoNumero?: string | null;
  enderecoComplemento?: string | null;
  enderecoBairro?: string | null;
  enderecoMunicipio?: string | null;
  enderecoUf?: string | null;
  enderecoCep?: string | null;
  limiteCredito?: number | null;
}

export interface FornecedorResponse {
  id: string;
  empresaId: string;
  razaoSocial: string;
  cnpj: string;
  email: string | null;
  telefone: string | null;
  ativo: boolean;
}

export interface CriarFornecedorRequest {
  razaoSocial: string;
  cnpj: string;
  email?: string | null;
  telefone?: string | null;
}

const API_BASE = 'http://localhost:8000/companies/v1';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private http = inject(HttpClient);

  listar(): Observable<ClienteResponse[]> {
    return this.http.get<ClienteResponse[]>(`${API_BASE}/clientes`);
  }

  buscar(termo: string): Observable<ClienteResponse[]> {
    return this.http.get<ClienteResponse[]>(`${API_BASE}/clientes/buscar`, { params: { q: termo } });
  }

  obter(id: string): Observable<ClienteResponse> {
    return this.http.get<ClienteResponse>(`${API_BASE}/clientes/${id}`);
  }

  criar(data: CriarClienteRequest): Observable<ClienteResponse> {
    return this.http.post<ClienteResponse>(`${API_BASE}/clientes`, data);
  }

  atualizar(id: string, data: AtualizarClienteRequest): Observable<ClienteResponse> {
    return this.http.put<ClienteResponse>(`${API_BASE}/clientes/${id}`, data);
  }

  // Fornecedores

  listarFornecedores(): Observable<FornecedorResponse[]> {
    return this.http.get<FornecedorResponse[]>(`${API_BASE}/fornecedores`);
  }

  criarFornecedor(data: CriarFornecedorRequest): Observable<FornecedorResponse> {
    return this.http.post<FornecedorResponse>(`${API_BASE}/fornecedores`, data);
  }
}
