import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription, forkJoin, of } from 'rxjs';
import { switchMap, startWith, catchError } from 'rxjs/operators';

interface ProdutoDashboardDto {
  produtoId: string;
  nome: string;
  quantidade: number;
  receita: number;
}

interface ClienteDashboardDto {
  clienteId: string;
  pedidos: number;
  receita: number;
}

interface VendedorDashboardDto {
  vendedorId: string;
  pedidos: number;
  receita: number;
}

interface DashboardKpiResponse {
  pedidosHoje: number;
  receitaHoje: number;
  pedidosMes: number;
  receitaMes: number;
  ticketMedio: number;
  top5Produtos: ProdutoDashboardDto[];
  top5Clientes: ClienteDashboardDto[];
  vendasPorVendedor: VendedorDashboardDto[];
}

interface AlertaEstoqueBaixoDto {
  produtoId: string;
  codigo: string;
  nome: string;
  lojaId: string;
  quantidadeAtual: number;
  estoqueMinimo: number;
}

interface AlertasEstoqueBaixoResponse {
  alertas: AlertaEstoqueBaixoDto[];
  total: number;
}

interface NfePendenteCountResponse {
  pendentes: number;
  processando: number;
  erroTecnico: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  today = new Date();

  kpis = signal<DashboardKpiResponse | null>(null);
  kpiErro = signal(false);
  alertas = signal<AlertaEstoqueBaixoDto[]>([]);
  nfePendentes = signal<NfePendenteCountResponse | null>(null);

  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = interval(30_000).pipe(
      startWith(0),
      switchMap(() =>
        forkJoin({
          kpis: this.http.get<DashboardKpiResponse>('http://localhost:8000/sales/v1/dashboard/kpis').pipe(
            catchError(() => of(null))
          ),
          alertas: this.http.get<AlertasEstoqueBaixoResponse>('http://localhost:8000/inventory/v1/dashboard/alertas').pipe(
            catchError(() => of(null))
          ),
          nfe: this.http.get<NfePendenteCountResponse>('http://localhost:8000/fiscal/v1/dashboard/nfe-pendentes').pipe(
            catchError(() => of(null))
          ),
        })
      )
    ).subscribe({
      next: (r) => {
        if (r.kpis) this.kpis.set(r.kpis);
        if (r.alertas) this.alertas.set(r.alertas.alertas.slice(0, 5));
        if (r.nfe) this.nfePendentes.set(r.nfe);
        this.kpiErro.set(!r.kpis && !r.alertas && !r.nfe);
      },
      error: () => this.kpiErro.set(true),
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  fmt(v: number | undefined | null): string {
    if (v == null) return '—';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  }

  fmtNum(v: number | undefined | null): string {
    if (v == null) return '—';
    return new Intl.NumberFormat('pt-BR').format(v);
  }

  get totalNfePendentes(): number {
    const n = this.nfePendentes();
    if (!n) return 0;
    return n.pendentes + n.processando + n.erroTecnico;
  }
}

