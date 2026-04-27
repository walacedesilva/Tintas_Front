import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-empresas',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="p-6 flex flex-col h-full">
      <div class="mb-5">
        <h1 class="text-2xl font-bold text-gray-900">Cleintes/Fornecedores</h1>
        <p class="text-sm text-gray-500 mt-0.5">Cadastro</p>
      </div>
      <div class="flex gap-1 mb-5 border-b border-gray-200">
        <a routerLink="clientes" routerLinkActive="border-b-2 border-blue-600 text-blue-700 font-semibold"
           [routerLinkActiveOptions]="{exact:false}"
           class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors -mb-px">
          Clientes
        </a>
        <a routerLink="fornecedores" routerLinkActive="border-b-2 border-blue-600 text-blue-700 font-semibold"
           class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors -mb-px">
          Fornecedores
        </a>
      </div>
      <router-outlet />
    </div>
  `,
})
export class EmpresasComponent {}
