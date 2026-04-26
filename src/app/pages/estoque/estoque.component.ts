import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-estoque',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="p-6 flex flex-col h-full">
      <!-- Header -->
      <div class="mb-5">
        <h1 class="text-2xl font-bold text-gray-900">Estoque</h1>
        <p class="text-sm text-gray-500 mt-0.5">Produtos, níveis de estoque e movimentações</p>
      </div>
      <!-- Tab nav -->
      <div class="flex gap-1 mb-5 border-b border-gray-200">
        <a routerLink="produtos" routerLinkActive="border-b-2 border-emerald-600 text-emerald-700 font-semibold"
           [routerLinkActiveOptions]="{exact:false}"
           class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors -mb-px">
          Produtos
        </a>
        <a routerLink="niveis" routerLinkActive="border-b-2 border-emerald-600 text-emerald-700 font-semibold"
           class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors -mb-px">
          Níveis de Estoque
        </a>
        <a routerLink="ajuste" routerLinkActive="border-b-2 border-emerald-600 text-emerald-700 font-semibold"
           class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors -mb-px">
          Ajuste
        </a>
        <a routerLink="movimentacoes" routerLinkActive="border-b-2 border-emerald-600 text-emerald-700 font-semibold"
           class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors -mb-px">
          Movimentações
        </a>
        <a routerLink="importacao" routerLinkActive="border-b-2 border-emerald-600 text-emerald-700 font-semibold"
           class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors -mb-px">
          Importar NF-e
        </a>
      </div>
      <!-- Child route -->
      <router-outlet />
    </div>
  `,
})
export class EstoqueComponent {}

