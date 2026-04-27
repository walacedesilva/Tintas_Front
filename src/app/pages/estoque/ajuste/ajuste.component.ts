import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { EstoqueService } from '../../../services/estoque.service';
import { ProdutoService, ProdutoResponse } from '../../../services/produto.service';
import { LojaService, LojaResponse } from '../../../services/loja.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-ajuste',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-xl">
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h2 class="text-base font-semibold text-gray-900 mb-5">Registrar Ajuste de Estoque</h2>

        @if (success()) {
          <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
            Ajuste registrado com sucesso!
          </div>
        }
        @if (formError()) {
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{{ formError() }}</div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Produto *</label>
            <select formControlName="produtoId"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              [class.border-red-400]="form.controls.produtoId.invalid && form.controls.produtoId.touched">
              <option value="">Selecione...</option>
              @for (p of produtos(); track p.id) {
                <option [value]="p.id">{{ p.codigo }} — {{ p.nome }}</option>
              }
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Loja *</label>
            @if (lojas().length === 0) {
              <div class="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Nenhuma loja vinculada. Contate o administrador.
              </div>
            } @else if (lojas().length === 1) {
              <div class="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700">
                {{ lojas()[0].nome }}
              </div>
            } @else {
              <select formControlName="lojaId"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                [class.border-red-400]="form.controls.lojaId.invalid && form.controls.lojaId.touched">
                <option value="">Selecione a loja...</option>
                @for (l of lojas(); track l.id) {
                  <option [value]="l.id">{{ l.nome }}</option>
                }
              </select>
            }
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Delta *
              <span class="font-normal text-gray-400">(positivo = entrada, negativo = saída)</span>
            </label>
            <input type="number" step="0.001" formControlName="delta"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              [class.border-red-400]="form.controls.delta.invalid && form.controls.delta.touched" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Justificativa *</label>
            <textarea formControlName="justificativa" rows="3"
              placeholder="Descreva o motivo do ajuste..."
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              [class.border-red-400]="form.controls.justificativa.invalid && form.controls.justificativa.touched"></textarea>
          </div>

          <div class="flex justify-end pt-2">
            <button type="submit" [disabled]="saving() || lojas().length === 0"
              class="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              {{ saving() ? 'Registrando...' : 'Registrar Ajuste' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class AjusteEstoqueComponent implements OnInit {
  private estoqueSvc = inject(EstoqueService);
  private produtoSvc = inject(ProdutoService);
  private lojaSvc = inject(LojaService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  produtos = signal<ProdutoResponse[]>([]);
  lojas = signal<LojaResponse[]>([]);
  saving = signal(false);
  formError = signal('');
  success = signal(false);

  form = this.fb.group({
    produtoId: ['', Validators.required],
    lojaId: ['', Validators.required],
    delta: [0, Validators.required],
    justificativa: ['', Validators.required],
  });

  ngOnInit() {
    this.produtoSvc.listar().subscribe({ next: d => this.produtos.set(d) });
    this.carregarLojas();
  }

  private carregarLojas() {
    const role = this.auth.getRole();
    const lojaIds = this.auth.getLojaIds();

    this.lojaSvc.listar().subscribe({
      next: todas => {
        const disponiveis = role === 'admin'
          ? todas
          : todas.filter(l => lojaIds.includes(l.id));
        this.lojas.set(disponiveis);

        // pré-selecionar automaticamente quando há apenas uma loja
        if (disponiveis.length === 1) {
          this.form.controls.lojaId.setValue(disponiveis[0].id);
        }
      },
    });
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.formError.set('');
    this.success.set(false);
    const v = this.form.value;
    this.estoqueSvc.ajustar({
      produtoId: v.produtoId!,
      lojaId: v.lojaId!,
      delta: v.delta!,
      justificativa: v.justificativa!,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(true);
        this.form.reset({ delta: 0 });
        this.carregarLojas();
      },
      error: () => { this.formError.set('Erro ao registrar ajuste.'); this.saving.set(false); },
    });
  }
}
