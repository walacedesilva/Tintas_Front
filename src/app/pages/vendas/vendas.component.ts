import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-vendas',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="p-6 flex flex-col gap-4 h-full">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Vendas</h1>
          <p class="text-sm text-gray-500 mt-0.5">PDV e gestão de pedidos</p>
        </div>
      </div>

      <!-- Tab navigation -->
      <nav class="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <a
          routerLink="pdv"
          routerLinkActive="bg-white shadow-sm text-gray-900 font-semibold"
          class="px-4 py-1.5 text-sm text-gray-500 rounded-md transition-all"
        >
          PDV
        </a>
        <a
          routerLink="pedidos"
          routerLinkActive="bg-white shadow-sm text-gray-900 font-semibold"
          class="px-4 py-1.5 text-sm text-gray-500 rounded-md transition-all"
        >
          Pedidos
        </a>
        <a
          routerLink="orcamentos"
          routerLinkActive="bg-white shadow-sm text-gray-900 font-semibold"
          class="px-4 py-1.5 text-sm text-gray-500 rounded-md transition-all"
        >
          Orçamentos
        </a>
        <a
          routerLink="relatorios"
          routerLinkActive="bg-white shadow-sm text-gray-900 font-semibold"
          class="px-4 py-1.5 text-sm text-gray-500 rounded-md transition-all"
        >
          Relatórios
        </a>
      </nav>

      <div class="flex-1 min-h-0">
        <router-outlet />
      </div>
    </div>
  `,
})
export class VendasComponent {}
