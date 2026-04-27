import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './shell.component.html',
})
export class ShellComponent implements OnInit {
  private auth = inject(AuthService);

  username = 'Usuário';
  role = '';

  ngOnInit() {
    this.username = this.auth.getUsername() || 'Usuário';
    this.role = this.auth.getRole();
  }

  canAccessTela(slug: string): boolean {
    return this.auth.canAccessTela(slug);
  }

  logout() {
    this.auth.logout();
  }
}

