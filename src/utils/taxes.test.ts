import { describe, it, expect } from 'vitest';
import {
  getTaxConfig,
  calculateTax,
  calculateRetirementWithdrawalTax,
  calculateEffectiveTaxRate,
  calculateNetWithdrawal,
} from './taxes';

describe('taxes', () => {
  describe('getTaxConfig', () => {
    it('should return WA tax config for single filer', () => {
      const config = getTaxConfig('WA', 'single');

      expect(config.federalBrackets).toBeDefined();
      expect(config.stateBrackets).toBeDefined();
      expect(config.standardDeduction).toBe(14600); // 2024 single
      expect(config.capitalGainsRates).toBeDefined();
    });

    it('should return WA tax config for married filer', () => {
      const config = getTaxConfig('WA', 'married');

      expect(config.standardDeduction).toBe(29200); // 2024 married
    });

    it('should have no state tax for WA', () => {
      const config = getTaxConfig('WA', 'single');

      // Washington has no state income tax
      expect(config.stateBrackets[0].rate).toBe(0);
    });
  });

  describe('calculateTax', () => {
    it('should calculate zero tax for zero income', () => {
      const brackets = [
        { min: 0, max: 10000, rate: 0.10 },
        { min: 10000, max: 20000, rate: 0.15 },
      ];

      const tax = calculateTax(0, brackets);
      expect(tax).toBe(0);
    });

    it('should calculate tax in first bracket', () => {
      const brackets = [
        { min: 0, max: 10000, rate: 0.10 },
        { min: 10000, max: 20000, rate: 0.15 },
      ];

      const tax = calculateTax(5000, brackets);
      expect(tax).toBe(500); // 5000 * 0.10
    });

    it('should calculate tax across multiple brackets', () => {
      const brackets = [
        { min: 0, max: 10000, rate: 0.10 },
        { min: 10000, max: 20000, rate: 0.15 },
        { min: 20000, max: Infinity, rate: 0.20 },
      ];

      const tax = calculateTax(25000, brackets);

      // First bracket: 10000 * 0.10 = 1000
      // Second bracket: 10000 * 0.15 = 1500
      // Third bracket: 5000 * 0.20 = 1000
      // Total: 3500
      expect(tax).toBe(3500);
    });

    it('should handle progressive taxation correctly', () => {
      const brackets = [
        { min: 0, max: 11600, rate: 0.10 },
        { min: 11600, max: 47150, rate: 0.12 },
      ];

      const tax = calculateTax(30000, brackets);

      // First bracket: 11600 * 0.10 = 1160
      // Second bracket: (30000 - 11600) * 0.12 = 2208
      // Total: 3368
      expect(tax).toBeCloseTo(3368, 0);
    });
  });

  describe('calculateRetirementWithdrawalTax', () => {
    const taxConfig = getTaxConfig('WA', 'single');

    it('should calculate zero tax for zero withdrawal', () => {
      const tax = calculateRetirementWithdrawalTax(0, taxConfig);
      expect(tax).toBe(0);
    });

    it('should calculate tax on small withdrawal', () => {
      const tax = calculateRetirementWithdrawalTax(20000, taxConfig);

      // With standard deduction of 14600, only small amount is taxable
      // Should be relatively small tax
      expect(tax).toBeGreaterThan(0);
      expect(tax).toBeLessThan(3000);
    });

    it('should calculate tax on typical retirement withdrawal', () => {
      const tax = calculateRetirementWithdrawalTax(40000, taxConfig);

      // 50% ordinary income = 20000
      // After standard deduction (14600), taxable = 5400
      // 50% capital gains = 20000 (likely 0% or 15%)
      expect(tax).toBeGreaterThan(0);
      expect(tax).toBeLessThan(8000);
    });

    it('should calculate higher tax on large withdrawal', () => {
      const tax1 = calculateRetirementWithdrawalTax(40000, taxConfig);
      const tax2 = calculateRetirementWithdrawalTax(100000, taxConfig);

      expect(tax2).toBeGreaterThan(tax1);
    });

    it('should respect ordinary income ratio', () => {
      const tax100 = calculateRetirementWithdrawalTax(40000, taxConfig, 1.0); // All ordinary
      const tax50 = calculateRetirementWithdrawalTax(40000, taxConfig, 0.5); // 50/50 split
      const tax0 = calculateRetirementWithdrawalTax(40000, taxConfig, 0.0); // All capital gains

      // More ordinary income = higher tax (progressive rates)
      expect(tax100).toBeGreaterThan(tax50);
      expect(tax50).toBeGreaterThan(tax0);
    });
  });

  describe('calculateEffectiveTaxRate', () => {
    const taxConfig = getTaxConfig('WA', 'single');

    it('should calculate effective tax rate', () => {
      const rate = calculateEffectiveTaxRate(40000, taxConfig);

      expect(rate).toBeGreaterThan(0);
      expect(rate).toBeLessThan(0.20); // Should be less than 20%
    });

    it('should return 0 for zero withdrawal', () => {
      const rate = calculateEffectiveTaxRate(0, taxConfig);
      expect(rate).toBe(0);
    });

    it('should increase with withdrawal amount', () => {
      const rate1 = calculateEffectiveTaxRate(30000, taxConfig);
      const rate2 = calculateEffectiveTaxRate(60000, taxConfig);
      const rate3 = calculateEffectiveTaxRate(100000, taxConfig);

      expect(rate2).toBeGreaterThan(rate1);
      expect(rate3).toBeGreaterThan(rate2);
    });
  });

  describe('calculateNetWithdrawal', () => {
    const taxConfig = getTaxConfig('WA', 'single');

    it('should calculate net withdrawal after taxes', () => {
      const gross = 40000;
      const net = calculateNetWithdrawal(gross, taxConfig);

      expect(net).toBeLessThan(gross);
      expect(net).toBeGreaterThan(gross * 0.80); // At least 80% after tax
    });

    it('should return zero for zero gross', () => {
      const net = calculateNetWithdrawal(0, taxConfig);
      expect(net).toBe(0);
    });

    it('should have lower effective rate for capital gains', () => {
      const net100 = calculateNetWithdrawal(40000, taxConfig, 1.0); // All ordinary
      const net0 = calculateNetWithdrawal(40000, taxConfig, 0.0); // All capital gains

      expect(net0).toBeGreaterThan(net100); // More net with capital gains
    });
  });
});
