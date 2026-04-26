import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  ClienteService,
  FornecedorResponse,
  CriarFornecedorRequest,
} from '../../../services/cliente.service';

@Component({
  selector: 'app-fornecedores-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div>
      <!-- Toolbar -->
      <div class="flex items-center justify-between mb-4">
        <input
          type="text"
          placeholder="Buscar por razão social ou CNPJ..."
          (input)="onSearch($event)"
          class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          (click)="openCreate()"
          class="ml-4 shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Novo Fornecedor
        </button>
      </div>

      @if (error()) {
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{{ error() }}</div>
      }

      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        @if (loading()) {
          <div class="flex items-center justify-center py-16 text-gray-400">
            <svg class="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Carregando...
          </div>
        } @else if (filtered().length === 0) {
          <div class="text-center py-16 text-gray-400 text-sm">Nenhum fornecedor encontrado.</div>
        } @else {
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="text-left px-4 py-3 font-medium text-gray-600">Razão Social</th>
                <th class="text-left px-4 py-3 font-medium text-gray-600">CNPJ</th>
                <th class="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th class="text-left px-4 py-3 font-medium text-gray-600">Telefone</th>
                <th class="text-center px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (f of filtered(); track f.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3 font-medium text-gray-900">{{ f.razaoSocial }}</td>
                  <td class="px-4 py-3 font-mono text-xs text-gray-700">{{ f.cnpj }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ f.email ?? '—' }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ f.telefone ?? '—' }}</td>
                  <td class="px-4 py-3 text-center">
                    <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                      [class]="f.ativo ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'">
                      {{ f.ativo ? 'Ativo' : 'Inativo' }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Modal -->
      @if (showForm()) {
        <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-900">Novo Fornecedor</h2>
              <button (click)="closeForm()" class="text-gray-400 hover:text-gray-600">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form [formGroup]="form" (ngSubmit)="submit()" class="px-6 py-4 space-y-4">
              @if (formError()) {
                <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{{ formError() }}</div>
              }
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Razão Social *</label>
                <input type="text" formControlName="razaoSocial"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  [class.border-red-400]="form.controls.razaoSocial.invalid && form.controls.razaoSocial.touched" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">CNPJ *</label>
                <input type="text" formControlName="cnpj" placeholder="Somente números"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  [class.border-red-400]="form.controls.cnpj.invalid && form.controls.cnpj.touched" />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" formControlName="email"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input type="text" formControlName="telefone" placeholder="(00) 00000-0000"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div class="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" (click)="closeForm()"
                  class="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" [disabled]="saving() || form.invalid"
                  class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {{ saving() ? 'Salvando…' : 'Criar' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class FornecedoresListComponent implements OnInit {
  private svc = inject(ClienteService);
  private fb = inject(FormBuilder);

  loading = signal(true);
  error = signal('');
  fornecedores = signal<FornecedorResponse[]>([]);
  filtered = signal<FornecedorResponse[]>([]);
  showForm = signal(false);
  saving = signal(false);
  formError = signal('');

  form = this.fb.group({
    razaoSocial: ['', Validators.required],
    cnpj: ['', Validators.required],
    email: [''],
    telefone: [''],
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.listarFornecedores().subscribe({
      next: data => {
        this.fornecedores.set(data);
        this.filtered.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Erro ao carregar fornecedores.');
        this.loading.set(false);
      },
    });
  }

  onSearch(e: Event) {
    const q = (e.target as HTMLInputElement).value.toLowerCase();
    this.filtered.set(
      this.fornecedores().filter(f =>
        f.razaoSocial.toLowerCase().includes(q) || f.cnpj.includes(q)
      )
    );
  }

  openCreate() {
    this.form.reset();
    this.formError.set('');
    this.showForm.set(true);
  }

  closeForm() { this.showForm.set(false); }

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.formError.set('');
    const v = this.form.getRawValue();

    const payload: CriarFornecedorRequest = {
      razaoSocial: v.razaoSocial!,
      cnpj: v.cnpj!,
      email: v.email || null,
      telefone: v.telefone || null,
    };

    this.svc.criarFornecedor(payload).subscribe({
      next: created => {
        this.fornecedores.update(list => [created, ...list]);
        this.filtered.update(list => [created, ...list]);
        this.saving.set(false);
        this.closeForm();
      },
      error: err => {
        this.formError.set(err?.error?.detail ?? 'Erro ao criar fornecedor.');
        this.saving.set(false);
      },
    });
  }
}
