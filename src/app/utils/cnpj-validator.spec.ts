import { FormControl } from '@angular/forms';
import { normalizarCnpj, formatarCnpj, validarCnpj, cnpjValidator } from './cnpj-validator';

describe('cnpj-validator', () => {
  describe('normalizarCnpj', () => {
    it('should remove mask from formatted CNPJ', () => {
      expect(normalizarCnpj('11.222.333/0001-81')).toBe('11222333000181');
    });

    it('should return digits-only string unchanged', () => {
      expect(normalizarCnpj('11222333000181')).toBe('11222333000181');
    });

    it('should return empty string for empty input', () => {
      expect(normalizarCnpj('')).toBe('');
    });

    it('should handle null gracefully', () => {
      expect(normalizarCnpj(null as unknown as string)).toBe('');
    });
  });

  describe('formatarCnpj', () => {
    it('should format 14 digits with mask', () => {
      expect(formatarCnpj('11222333000181')).toBe('11.222.333/0001-81');
    });

    it('should return input unchanged when less than 14 digits', () => {
      expect(formatarCnpj('123')).toBe('123');
    });

    it('should format masked input idempotently', () => {
      expect(formatarCnpj('11.222.333/0001-81')).toBe('11.222.333/0001-81');
    });
  });

  describe('validarCnpj', () => {
    it('should return true for valid CNPJ without mask', () => {
      expect(validarCnpj('11222333000181')).toBeTrue();
    });

    it('should return true for valid CNPJ with mask', () => {
      expect(validarCnpj('11.222.333/0001-81')).toBeTrue();
    });

    it('should return false when first check digit is wrong', () => {
      // 11222333000181 is valid; change 13th digit to something wrong
      expect(validarCnpj('11222333000191')).toBeFalse();
    });

    it('should return false when second check digit is wrong', () => {
      // Change last digit
      expect(validarCnpj('11222333000182')).toBeFalse();
    });

    it('should return false for all equal digits', () => {
      expect(validarCnpj('11111111111111')).toBeFalse();
    });

    it('should return false for another all-equal pattern', () => {
      expect(validarCnpj('11.111.111/1111-11')).toBeFalse();
    });

    it('should return false for empty string', () => {
      expect(validarCnpj('')).toBeFalse();
    });

    it('should return false for string with less than 14 digits', () => {
      expect(validarCnpj('1122233300018')).toBeFalse();
    });
  });

  describe('cnpjValidator', () => {
    it('should return null for valid CNPJ', () => {
      const ctrl = new FormControl('11222333000181');
      expect(cnpjValidator(ctrl)).toBeNull();
    });

    it('should return error object for invalid CNPJ', () => {
      const ctrl = new FormControl('11111111111111');
      expect(cnpjValidator(ctrl)).toEqual({ cnpjInvalido: true });
    });

    it('should return error object for null control value', () => {
      const ctrl = new FormControl(null);
      expect(cnpjValidator(ctrl)).toEqual({ cnpjInvalido: true });
    });

    it('should return error object for empty control value', () => {
      const ctrl = new FormControl('');
      expect(cnpjValidator(ctrl)).toEqual({ cnpjInvalido: true });
    });
  });
});
