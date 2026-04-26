import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  ClienteService,
  ClienteResponse,
  CriarClienteRequest,
  AtualizarClienteRequest,
} from '../../../services/cliente.service';

const TIPO_LABEL: Record<number, string> = { 1: 'PF', 2: 'PJ' };

@Component({
  selector: 'app-clientes-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div>
      <!-- Toolbar -->
      <div class="flex items-center justify-between mb-4">
        <input
          type="text"
          placeholder="Buscar por nome ou CPF/CNPJ..."
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
          Novo Cliente
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
          <div class="text-center py-16 text-gray-400 text-sm">Nenhum cliente encontrado.</div>
        } @else {
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
                <th class="text-left px-4 py-3 font-medium text-gray-600">CPF/CNPJ</th>
                <th class="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                <th class="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th class="text-left px-4 py-3 font-medium text-gray-600">Telefone</th>
                <th class="text-right px-4 py-3 font-medium text-gray-600">Limite Crédito</th>
                <th class="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (c of filtered(); track c.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3 font-medium text-gray-900">{{ c.nome }}</td>
                  <td class="px-4 py-3 font-mono text-xs text-gray-700">{{ c.cpfCnpj }}</td>
                  <td class="px-4 py-3 text-gray-600">
                    <span class="px-2 py-0.5 rounded text-xs font-medium"
                      [class]="c.tipo === 1 ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'">
                      {{ tipoLabel(c.tipo) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-gray-600">{{ c.email ?? '—' }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ c.telefone ?? '—' }}</td>
                  <td class="px-4 py-3 text-right text-gray-700">{{ c.limiteCredito | currency:'BRL':'symbol':'1.2-2' }}</td>
                  <td class="px-4 py-3 text-center">
                    <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                      [class]="c.ativo ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'">
                      {{ c.ativo ? 'Ativo' : 'Inativo' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button (click)="openEdit(c)"
                      class="text-blue-600 hover:text-blue-800 text-xs font-medium transition-colors">
                      Editar
                    </button>
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
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-900">{{ editId() ? 'Editar Cliente' : 'Novo Cliente' }}</h2>
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
              @if (!editId()) {
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select formControlName="tipo"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option [value]="1">Pessoa Física (PF)</option>
                    <option [value]="2">Pessoa Jurídica (PJ)</option>
                  </select>
                </div>
              }
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input type="text" formControlName="nome"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  [class.border-red-400]="form.controls.nome.invalid && form.controls.nome.touched" />
              </div>
              @if (!editId()) {
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ *</label>
                  <input type="text" formControlName="cpfCnpj" placeholder="Somente números"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    [class.border-red-400]="form.controls.cpfCnpj.invalid && form.controls.cpfCnpj.touched" />
                </div>
              }
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
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Inscrição Estadual</label>
                <input type="text" formControlName="inscricaoEstadual"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Limite de Crédito (R$)</label>
                <input type="number" formControlName="limiteCredito" min="0" step="0.01"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <!-- Endereço -->
              <div class="border-t border-gray-200 pt-4">
                <p class="text-sm font-semibold text-gray-700 mb-3">Endereço (opcional)</p>
                <div class="grid grid-cols-3 gap-3">
                  <div class="col-span-2">
                    <label class="block text-xs font-medium text-gray-600 mb-1">Logradouro</label>
                    <input type="text" formControlName="enderecoLogradouro"
                      class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Número</label>
                    <input type="text" formControlName="enderecoNumero"
                      class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Bairro</label>
                    <input type="text" formControlName="enderecoBairro"
                      class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Município</label>
                    <input type="text" formControlName="enderecoMunicipio"
                      class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">UF</label>
                    <input type="text" formControlName="enderecoUf" maxlength="2" placeholder="SP"
                      class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase" />
                  </div>
                </div>
              </div>

              <div class="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" (click)="closeForm()"
                  class="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" [disabled]="saving() || form.invalid"
                  class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {{ saving() ? 'Salvando…' : (editId() ? 'Salvar' : 'Criar') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class ClientesListComponent implements OnInit {
  private svc = inject(ClienteService);
  private fb = inject(FormBuilder);

  loading = signal(true);
  error = signal('');
  clientes = signal<ClienteResponse[]>([]);
  filtered = signal<ClienteResponse[]>([]);
  showForm = signal(false);
  editId = signal<string | null>(null);
  saving = signal(false);
  formError = signal('');

  form = this.fb.group({
    tipo: [1, Validators.required],
    nome: ['', Validators.required],
    cpfCnpj: ['', Validators.required],
    email: [''],
    telefone: [''],
    inscricaoEstadual: [''],
    limiteCredito: [0],
    enderecoLogradouro: [''],
    enderecoNumero: [''],
    enderecoBairro: [''],
    enderecoMunicipio: [''],
    enderecoUf: [''],
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.listar().subscribe({
      next: data => {
        this.clientes.set(data);
        this.filtered.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Erro ao carregar clientes.');
        this.loading.set(false);
      },
    });
  }

  tipoLabel(t: number) { return TIPO_LABEL[t] ?? `${t}`; }

  onSearch(e: Event) {
    const q = (e.target as HTMLInputElement).value.toLowerCase();
    this.filtered.set(
      this.clientes().filter(c =>
        c.nome.toLowerCase().includes(q) || c.cpfCnpj.includes(q)
      )
    );
  }

  openCreate() {
    this.editId.set(null);
    this.form.reset({ tipo: 1, limiteCredito: 0 });
    this.form.controls.cpfCnpj.enable();
    this.form.controls.tipo.enable();
    this.formError.set('');
    this.showForm.set(true);
  }

  openEdit(c: ClienteResponse) {
    this.editId.set(c.id);
    this.form.patchValue({
      tipo: c.tipo,
      nome: c.nome,
      cpfCnpj: c.cpfCnpj,
      email: c.email ?? '',
      telefone: c.telefone ?? '',
      inscricaoEstadual: c.inscricaoEstadual ?? '',
      limiteCredito: c.limiteCredito,
      enderecoLogradouro: c.enderecoLogradouro ?? '',
      enderecoNumero: c.enderecoNumero ?? '',
      enderecoBairro: c.enderecoBairro ?? '',
      enderecoMunicipio: c.enderecoMunicipio ?? '',
      enderecoUf: c.enderecoUf ?? '',
    });
    this.form.controls.cpfCnpj.disable();
    this.form.controls.tipo.disable();
    this.formError.set('');
    this.showForm.set(true);
  }

  closeForm() { this.showForm.set(false); }

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.formError.set('');
    const v = this.form.getRawValue();

    if (this.editId()) {
      const payload: AtualizarClienteRequest = {
        nome: v.nome,
        email: v.email || null,
        telefone: v.telefone || null,
        inscricaoEstadual: v.inscricaoEstadual || null,
        limiteCredito: v.limiteCredito ?? 0,
        enderecoLogradouro: v.enderecoLogradouro || null,
        enderecoNumero: v.enderecoNumero || null,
        enderecoBairro: v.enderecoBairro || null,
        enderecoMunicipio: v.enderecoMunicipio || null,
        enderecoUf: v.enderecoUf ? v.enderecoUf.toUpperCase() : null,
      };
      this.svc.atualizar(this.editId()!, payload).subscribe({
        next: updated => {
          this.clientes.update(list => list.map(c => c.id === updated.id ? updated : c));
          this.filtered.update(list => list.map(c => c.id === updated.id ? updated : c));
          this.saving.set(false);
          this.closeForm();
        },
        error: err => {
          this.formError.set(err?.error?.detail ?? 'Erro ao salvar.');
          this.saving.set(false);
        },
      });
    } else {
      const payload: CriarClienteRequest = {
        tipo: v.tipo ?? 1,
        nome: v.nome!,
        cpfCnpj: v.cpfCnpj!,
        email: v.email || null,
        telefone: v.telefone || null,
        inscricaoEstadual: v.inscricaoEstadual || null,
        limiteCredito: v.limiteCredito ?? 0,
      };
      this.svc.criar(payload).subscribe({
        next: created => {
          this.clientes.update(list => [created, ...list]);
          this.filtered.update(list => [created, ...list]);
          this.saving.set(false);
          this.closeForm();
        },
        error: err => {
          this.formError.set(err?.error?.detail ?? 'Erro ao criar cliente.');
          this.saving.set(false);
        },
      });
    }
  }
}
