import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-acesso-negado',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div class="text-center max-w-md">
        <div class="text-8xl font-bold text-red-500 mb-4">403</div>
        <h1 class="text-2xl font-semibold text-gray-800 mb-2">Acesso Negado</h1>
        <p class="text-gray-500 mb-8">
          Você não tem permissão para acessar esta tela.<br />
          Entre em contato com o administrador se acredita que isso é um erro.
        </p>
        <button
          (click)="voltar()"
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          Voltar
        </button>
      </div>
    </div>
  `
})
export class AcessoNegadoComponent {
  private location = inject(Location);

  voltar(): void {
    this.location.back();
  }
}
