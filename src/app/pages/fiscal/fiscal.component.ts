import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-fiscal',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="flex flex-col h-full">
      <!-- Tab bar -->
      <div class="border-b border-gray-200 bg-white px-6">
        <nav class="flex gap-6">
          <a routerLink="nfe" routerLinkActive="border-b-2 border-violet-600 text-violet-700 font-medium"
            class="py-3 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            NF-e / NFC-e
          </a>
        </nav>
      </div>
      <div class="flex-1 overflow-auto">
        <router-outlet />
      </div>
    </div>
  `,
})
export class FiscalComponent {}
