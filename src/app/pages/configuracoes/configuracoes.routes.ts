import { Routes } from '@angular/router';
import { telaPermitidaGuard } from '../../guards/tela-permitida.guard';

export const CONFIGURACOES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./configuracoes-shell.component').then(m => m.ConfiguracoesShellComponent),
    children: [
      { path: '', redirectTo: 'permissoes-tela', pathMatch: 'full' },
      {
        path: 'permissoes-tela',
        canActivate: [telaPermitidaGuard('configuracoes')],
        loadComponent: () =>
          import('./permissoes-tela/permissoes-tela.component').then(m => m.PermissoesTelaComponent)
      },
      {
        path: 'fiscal',
        canActivate: [telaPermitidaGuard('configuracoes')],
        loadComponent: () =>
          import('./config-fiscal/config-fiscal.component').then(m => m.ConfigFiscalComponent)
      },
      {
        path: 'recibo',
        canActivate: [telaPermitidaGuard('configuracoes')],
        loadComponent: () =>
          import('./config-recibo/config-recibo.component').then(m => m.ConfigReciboComponent)
      },
      {
        path: 'orcamento',
        canActivate: [telaPermitidaGuard('configuracoes')],
        loadComponent: () =>
          import('./config-orcamento/config-orcamento.component').then(m => m.ConfigOrcamentoComponent)
      },
    ]
  }
];
