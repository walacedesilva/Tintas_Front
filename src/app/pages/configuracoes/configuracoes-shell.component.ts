import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-configuracoes-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-full">
      <aside class="w-56 bg-white border-r border-gray-200 p-4 shrink-0">
        <h2 class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Configurações</h2>
        <nav class="flex flex-col gap-1">
          <a routerLink="permissoes-tela"
             routerLinkActive="bg-blue-50 text-blue-700 font-medium"
             class="px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            Permissões de Tela
          </a>
          <a routerLink="fiscal"
             routerLinkActive="bg-blue-50 text-blue-700 font-medium"
             class="px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            Nota Fiscal
          </a>
          <a routerLink="recibo"
             routerLinkActive="bg-blue-50 text-blue-700 font-medium"
             class="px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            Recibo de Venda
          </a>
          <a routerLink="orcamento"
             routerLinkActive="bg-blue-50 text-blue-700 font-medium"
             class="px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            Orçamentos
          </a>
        </nav>
      </aside>
      <main class="flex-1 overflow-auto p-6">
        <router-outlet />
      </main>
    </div>
  `
})
export class ConfiguracoesShellComponent {}
