import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UsuarioService, UsuarioResponse, CriarUsuarioRequest } from '../../services/usuario.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuarios.component.html',
})
export class UsuariosComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  usuarios = signal<UsuarioResponse[]>([]);
  loading = signal(false);
  error = signal('');
  showForm = signal(false);
  saving = signal(false);
  formError = signal('');

  readonly roles = ['admin', 'gerente_vendas', 'vendedor', 'estoquista'];
  // Use a placeholder empresaId from the current user's token until empresa management is done
  private empresaId = this.getEmpresaId();

  form = this.fb.group({
    login: ['', [Validators.required, Validators.minLength(3)]],
    nome: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['vendedor', Validators.required],
  });

  ngOnInit() {
    this.loadUsuarios();
  }

  loadUsuarios() {
    this.loading.set(true);
    this.error.set('');
    this.usuarioService.listar().subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Erro ao carregar usuários.');
        this.loading.set(false);
      },
    });
  }

  openForm() {
    this.form.reset({ role: 'vendedor' });
    this.formError.set('');
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.formError.set('');
    const v = this.form.value;
    const request: CriarUsuarioRequest = {
      login: v.login!,
      nome: v.nome!,
      email: v.email!,
      password: v.password!,
      role: v.role!,
      empresaId: this.empresaId,
    };
    this.usuarioService.criar(request).subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.loadUsuarios();
      },
      error: (err) => {
        this.formError.set(err?.error?.error ?? 'Erro ao criar usuário.');
        this.saving.set(false);
      },
    });
  }

  toggleAtivo(u: UsuarioResponse) {
    this.usuarioService.atualizar(u.id, { ativo: !u.ativo }).subscribe({
      next: () => this.loadUsuarios(),
    });
  }

  private getEmpresaId(): string {
    const token = this.auth.getToken();
    if (!token) return '';
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      return payload['empresa_id'] ?? '';
    } catch {
      return '';
    }
  }
}
