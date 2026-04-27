import { Component, signal } from '@angular/core';
import { UsuariosTabComponent } from './tabs/usuarios-tab/usuarios-tab.component';
import { LojasTabComponent } from './tabs/lojas-tab/lojas-tab.component';
import { VinculosTabComponent } from './tabs/vinculos-tab/vinculos-tab.component';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [UsuariosTabComponent, LojasTabComponent, VinculosTabComponent],
  templateUrl: './usuarios.component.html',
})
export class UsuariosComponent {
  currentTab = signal<'usuarios' | 'lojas' | 'vinculos'>('usuarios');
}

