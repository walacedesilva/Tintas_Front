import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { telaPermitidaGuard } from './guards/tela-permitida.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'app/dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'app',
    loadComponent: () =>
      import('./layout/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'empresas',
        loadComponent: () =>
          import('./pages/empresas/empresas.component').then(m => m.EmpresasComponent),
        children: [
          { path: '', redirectTo: 'clientes', pathMatch: 'full' },
          {
            path: 'clientes',
            loadComponent: () =>
              import('./pages/empresas/clientes/clientes.component').then(m => m.ClientesListComponent)
          },
          {
            path: 'fornecedores',
            loadComponent: () =>
              import('./pages/empresas/fornecedores/fornecedores.component').then(m => m.FornecedoresListComponent)
          },
        ]
      },
      {
        path: 'estoque',
        loadComponent: () =>
          import('./pages/estoque/estoque.component').then(m => m.EstoqueComponent),
        children: [
          { path: '', redirectTo: 'produtos', pathMatch: 'full' },
          {
            path: 'produtos',
            loadComponent: () =>
              import('./pages/estoque/produtos/produtos.component').then(m => m.ProdutosListComponent)
          },
          {
            path: 'niveis',
            loadComponent: () =>
              import('./pages/estoque/niveis/niveis.component').then(m => m.NiveisEstoqueComponent)
          },
          {
            path: 'ajuste',
            loadComponent: () =>
              import('./pages/estoque/ajuste/ajuste.component').then(m => m.AjusteEstoqueComponent)
          },
          {
            path: 'movimentacoes',
            loadComponent: () =>
              import('./pages/estoque/movimentacoes/movimentacoes.component').then(m => m.MovimentacoesComponent)
          },
          {
            path: 'importacao',
            loadComponent: () =>
              import('./pages/estoque/importacao/importacao.component').then(m => m.ImportacaoComponent)
          },
        ]
      },
      {
        path: 'vendas',
        loadComponent: () =>
          import('./pages/vendas/vendas.component').then(m => m.VendasComponent),
        children: [
          { path: '', redirectTo: 'pdv', pathMatch: 'full' },
          {
            path: 'pdv',
            loadComponent: () =>
              import('./pages/vendas/pdv/pdv.component').then(m => m.PdvComponent)
          },
          {
            path: 'pedidos',
            loadComponent: () =>
              import('./pages/vendas/pedidos/pedidos.component').then(m => m.PedidosListComponent)
          },
          {
            path: 'orcamentos',
            loadComponent: () =>
              import('./pages/vendas/orcamento/orcamentos-list.component').then(m => m.OrcamentosListComponent)
          },
          {
            path: 'orcamentos/novo',
            loadComponent: () =>
              import('./pages/vendas/orcamento/orcamento-form.component').then(m => m.OrcamentoFormComponent)
          },
          {
            path: 'orcamentos/:id',
            loadComponent: () =>
              import('./pages/vendas/orcamento/orcamento-detalhe.component').then(m => m.OrcamentoDetalheComponent)
          },
          {
            path: 'relatorios',
            loadComponent: () =>
              import('./pages/vendas/relatorios/relatorios.component').then(m => m.RelatoriosComponent)
          },
        ]
      },
      {
        path: 'fiscal',
        loadComponent: () =>
          import('./pages/fiscal/fiscal.component').then(m => m.FiscalComponent),
        children: [
          {
            path: '',
            redirectTo: 'nfe',
            pathMatch: 'full'
          },
          {
            path: 'nfe',
            loadComponent: () =>
              import('./pages/fiscal/nfe/nfe-list.component').then(m => m.NfeListComponent)
          },
          {
            path: 'nfe/:id',
            loadComponent: () =>
              import('./pages/fiscal/nfe/nfe-detalhe.component').then(m => m.NfeDetalheComponent)
          },
        ]
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./pages/clientes/clientes.component').then(m => m.ClientesComponent)
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./pages/usuarios/usuarios.component').then(m => m.UsuariosComponent)
      },
      {
        path: 'configuracoes/permissoes',
        loadComponent: () =>
          import('./pages/permissoes/permissoes.component').then(m => m.PermissoesComponent)
      },
      {
        path: 'configuracoes',
        loadChildren: () =>
          import('./pages/configuracoes/configuracoes.routes').then(m => m.CONFIGURACOES_ROUTES),
        canActivate: [telaPermitidaGuard('configuracoes')]
      },
      {
        path: 'acesso-negado',
        loadComponent: () =>
          import('./shared/components/acesso-negado/acesso-negado.component').then(m => m.AcessoNegadoComponent)
      },
    ]
  },
  // legacy redirect — old /dashboard link goes to new route
  { path: 'dashboard', redirectTo: 'app/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
