import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ProdutoService, ProdutoResponse, CriarProdutoRequest, AtualizarProdutoRequest } from '../../../services/produto.service';

@Component({
  selector: 'app-produtos-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div>
      <!-- Toolbar -->
      <div class="flex items-center justify-between mb-4">
        <input type="text" placeholder="Buscar por código ou nome..."
          (input)="onSearch($event)"
          class="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full max-w-md focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        <button (click)="openCreate()"
          class="ml-4 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Novo Produto
        </button>
      </div>

      @if (error()) {
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{{ error() }}</div>
      }

      <!-- Table -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        @if (loading()) {
          <div class="flex items-center justify-center py-16 text-gray-400">
            <svg class="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Carregando...
          </div>
        } @else if (produtos().length === 0) {
          <div class="text-center py-16 text-gray-400 text-sm">Nenhum produto encontrado.</div>
        } @else {
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="text-left px-4 py-3 font-medium text-gray-600">Código</th>
                <th class="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
                <th class="text-left px-4 py-3 font-medium text-gray-600">UN</th>
                <th class="text-right px-4 py-3 font-medium text-gray-600">Preço Venda</th>
                <th class="text-right px-4 py-3 font-medium text-gray-600">Est. Mín.</th>
                <th class="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (p of produtos(); track p.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3 font-mono text-xs text-gray-700">{{ p.codigo }}</td>
                  <td class="px-4 py-3 font-medium text-gray-900">{{ p.nome }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ p.unidadeMedida }}</td>
                  <td class="px-4 py-3 text-right text-gray-700">{{ p.precoVenda | currency:'BRL':'symbol':'1.2-2' }}</td>
                  <td class="px-4 py-3 text-right text-gray-600">{{ p.estoqueMinimo }}</td>
                  <td class="px-4 py-3 text-center">
                    <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                      [class]="p.ativo ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'">
                      {{ p.ativo ? 'Ativo' : 'Inativo' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button (click)="openEdit(p)"
                      class="text-emerald-600 hover:text-emerald-800 text-xs font-medium transition-colors">
                      Editar
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Modal Form -->
      @if (showForm()) {
        <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-900">{{ editId() ? 'Editar Produto' : 'Novo Produto' }}</h2>
              <button (click)="closeForm()" class="text-gray-400 hover:text-gray-600 transition-colors">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form [formGroup]="form" (ngSubmit)="submit()" class="px-6 py-4 space-y-4">
              @if (!editId()) {
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                  <input type="text" formControlName="codigo"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                    [class.border-red-400]="form.controls.codigo.invalid && form.controls.codigo.touched" />
                </div>
              }
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input type="text" formControlName="nome"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  [class.border-red-400]="form.controls.nome.invalid && form.controls.nome.touched" />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Unidade *</label>
                  <input type="text" formControlName="unidadeMedida" placeholder="LT, KG, UN..."
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                    [class.border-red-400]="form.controls.unidadeMedida.invalid && form.controls.unidadeMedida.touched" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">NCM</label>
                  <input type="text" formControlName="ncm" placeholder="00000000"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Preço Venda *</label>
                  <input type="number" step="0.01" min="0.01" formControlName="precoVenda"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    [class.border-red-400]="form.controls.precoVenda.invalid && form.controls.precoVenda.touched" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Preço Custo</label>
                  <input type="number" step="0.01" min="0" formControlName="precoCusto"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Est. Mínimo</label>
                  <input type="number" step="0.001" min="0" formControlName="estoqueMinimo"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea formControlName="descricao" rows="2"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
              </div>

              @if (formError()) {
                <p class="text-red-600 text-sm">{{ formError() }}</p>
              }

              <div class="flex justify-end gap-3 pt-2">
                <button type="button" (click)="closeForm()"
                  class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" [disabled]="saving()"
                  class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  {{ saving() ? 'Salvando...' : 'Salvar' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class ProdutosListComponent implements OnInit {
  private svc = inject(ProdutoService);
  private fb = inject(FormBuilder);

  produtos = signal<ProdutoResponse[]>([]);
  loading = signal(false);
  error = signal('');
  searchTerm = '';

  showForm = signal(false);
  editId = signal<string | null>(null);
  saving = signal(false);
  formError = signal('');

  form = this.fb.group({
    codigo: [''],
    nome: ['', Validators.required],
    unidadeMedida: ['', Validators.required],
    precoVenda: [0, [Validators.required, Validators.min(0.01)]],
    precoCusto: [0, Validators.min(0)],
    estoqueMinimo: [0, Validators.min(0)],
    ncm: [''],
    descricao: [''],
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set('');
    const obs = this.searchTerm.trim()
      ? this.svc.buscar(this.searchTerm.trim())
      : this.svc.listar();
    obs.subscribe({
      next: d => { this.produtos.set(d); this.loading.set(false); },
      error: () => { this.error.set('Erro ao carregar produtos.'); this.loading.set(false); },
    });
  }

  onSearch(e: Event) {
    this.searchTerm = (e.target as HTMLInputElement).value;
    this.load();
  }

  openCreate() {
    this.editId.set(null);
    this.form.reset({ precoVenda: 0, precoCusto: 0, estoqueMinimo: 0 });
    this.form.controls.codigo.setValidators(Validators.required);
    this.form.controls.codigo.updateValueAndValidity();
    this.formError.set('');
    this.showForm.set(true);
  }

  openEdit(p: ProdutoResponse) {
    this.editId.set(p.id);
    this.form.controls.codigo.clearValidators();
    this.form.controls.codigo.updateValueAndValidity();
    this.form.patchValue({
      nome: p.nome,
      unidadeMedida: p.unidadeMedida,
      precoVenda: p.precoVenda,
      precoCusto: p.precoCusto,
      estoqueMinimo: p.estoqueMinimo,
      ncm: p.ncm ?? '',
      descricao: p.descricao ?? '',
    });
    this.formError.set('');
    this.showForm.set(true);
  }

  closeForm() { this.showForm.set(false); }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.formError.set('');
    const v = this.form.value;
    const id = this.editId();

    if (id) {
      const req: AtualizarProdutoRequest = {
        nome: v.nome || null,
        unidadeMedida: v.unidadeMedida || null,
        precoVenda: v.precoVenda ?? null,
        precoCusto: v.precoCusto ?? null,
        estoqueMinimo: v.estoqueMinimo ?? null,
        ncm: v.ncm || null,
        descricao: v.descricao || null,
      };
      this.svc.atualizar(id, req).subscribe({
        next: () => { this.saving.set(false); this.closeForm(); this.load(); },
        error: () => { this.formError.set('Erro ao atualizar produto.'); this.saving.set(false); },
      });
    } else {
      const req: CriarProdutoRequest = {
        codigo: v.codigo!,
        nome: v.nome!,
        unidadeMedida: v.unidadeMedida!,
        precoVenda: v.precoVenda!,
        precoCusto: v.precoCusto ?? 0,
        estoqueMinimo: v.estoqueMinimo ?? 0,
        ncm: v.ncm || null,
        descricao: v.descricao || null,
      };
      this.svc.criar(req).subscribe({
        next: () => { this.saving.set(false); this.closeForm(); this.load(); },
        error: () => { this.formError.set('Erro ao criar produto.'); this.saving.set(false); },
      });
    }
  }
}
