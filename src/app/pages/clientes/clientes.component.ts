import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ClienteService, ClienteResponse, CriarClienteRequest } from '../../services/cliente.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './clientes.component.html',
})
export class ClientesComponent implements OnInit {
  private svc = inject(ClienteService);
  private fb = inject(FormBuilder);

  clientes = signal<ClienteResponse[]>([]);
  loading = signal(false);
  error = signal('');
  searchTerm = '';

  showForm = signal(false);
  saving = signal(false);
  formError = signal('');

  showDetalhe = signal<ClienteResponse | null>(null);

  readonly tipoOpts = [
    { value: 1, label: 'Pessoa Física' },
    { value: 2, label: 'Pessoa Jurídica' },
  ];

  form = this.fb.group({
    tipo: [2, Validators.required],
    nome: ['', Validators.required],
    cpfCnpj: ['', Validators.required],
    inscricaoEstadual: [''],
    email: ['', Validators.email],
    telefone: [''],
    limiteCredito: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit() {
    this.loadClientes();
  }

  loadClientes() {
    this.loading.set(true);
    this.error.set('');
    const obs = this.searchTerm.trim()
      ? this.svc.buscar(this.searchTerm.trim())
      : this.svc.listar();
    obs.subscribe({
      next: (data) => { this.clientes.set(data); this.loading.set(false); },
      error: () => { this.error.set('Erro ao carregar clientes.'); this.loading.set(false); },
    });
  }

  onSearch(event: Event) {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.loadClientes();
  }

  openForm() {
    this.form.reset({ tipo: 2, limiteCredito: 0 });
    this.formError.set('');
    this.showForm.set(true);
  }

  closeForm() { this.showForm.set(false); }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.formError.set('');
    const v = this.form.value;
    const req: CriarClienteRequest = {
      tipo: v.tipo!,
      nome: v.nome!,
      cpfCnpj: v.cpfCnpj!,
      inscricaoEstadual: v.inscricaoEstadual || null,
      email: v.email || null,
      telefone: v.telefone || null,
      limiteCredito: v.limiteCredito ?? 0,
    };
    this.svc.criar(req).subscribe({
      next: () => { this.saving.set(false); this.showForm.set(false); this.loadClientes(); },
      error: () => { this.formError.set('Erro ao criar cliente.'); this.saving.set(false); },
    });
  }

  openDetalhe(c: ClienteResponse) { this.showDetalhe.set(c); }
  closeDetalhe() { this.showDetalhe.set(null); }

  tipoLabel(tipo: number): string {
    return tipo === 1 ? 'PF' : 'PJ';
  }
}
