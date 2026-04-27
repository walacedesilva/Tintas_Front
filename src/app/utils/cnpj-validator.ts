import { AbstractControl, ValidatorFn } from '@angular/forms';

export function normalizarCnpj(cnpj: string): string {
  return (cnpj ?? '').replace(/\D/g, '');
}

export function formatarCnpj(cnpj: string): string {
  const n = normalizarCnpj(cnpj);
  if (n.length !== 14) return cnpj;
  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12, 14)}`;
}

export function validarCnpj(cnpj: string): boolean {
  const n = normalizarCnpj(cnpj);
  if (n.length !== 14) return false;
  if (/^(\d)\1+$/.test(n)) return false;

  const calcDigit = (digits: string, weights: number[]): number => {
    const sum = digits.split('').reduce((acc, d, i) => acc + Number(d) * weights[i], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const d1 = calcDigit(n.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (d1 !== Number(n[12])) return false;

  const d2 = calcDigit(n.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d2 === Number(n[13]);
}

export const cnpjValidator: ValidatorFn = (control: AbstractControl) =>
  validarCnpj(control.value ?? '') ? null : { cnpjInvalido: true };
