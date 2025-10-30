import { describe, it, expect } from 'vitest';
import { calculateWithdrawal } from './withdrawalStrategies';
import type { WithdrawalConfig, YearlyData } from '../types';

describe('withdrawalStrategies', () => {
  const mockYearData: YearlyData = {
    year: 2020,
    startingCPI: 257.97,
    endingCPI: 260.47,
    inflation: 0.01,
    stockReturn: 0.10,
    bondReturn: 0.03,
    cashReturn: 0.015,
    cape: 30.5,
  };

  describe('constantDollar strategy', () => {
    const config: WithdrawalConfig = {
      strategy: 'constantDollar',
      amount: 40000,
    };

    it('should return fixed amount', () => {
      const withdrawal = calculateWithdrawal(config, 1000000, mockYearData, 0, 30);
      expect(withdrawal).toBe(40000);
    });

    it('should not exceed portfolio', () => {
      const withdrawal = calculateWithdrawal(config, 30000, mockYearData, 0, 30);
      expect(withdrawal).toBe(30000);
    });

    it('should respect min/max constraints', () => {
      const configWithMin: WithdrawalConfig = {
        ...config,
        minWithdrawal: 50000,
      };

      const withdrawal = calculateWithdrawal(configWithMin, 1000000, mockYearData, 0, 30);
      expect(withdrawal).toBe(50000);
    });
  });

  describe('percentageOfPortfolio strategy', () => {
    const config: WithdrawalConfig = {
      strategy: 'percentageOfPortfolio',
      percentage: 4,
    };

    it('should calculate percentage correctly', () => {
      const withdrawal = calculateWithdrawal(config, 1000000, mockYearData, 0, 30);
      expect(withdrawal).toBe(40000); // 4% of 1M
    });

    it('should adjust with portfolio value', () => {
      const withdrawal1 = calculateWithdrawal(config, 1000000, mockYearData, 0, 30);
      const withdrawal2 = calculateWithdrawal(config, 500000, mockYearData, 0, 30);

      expect(withdrawal2).toBe(withdrawal1 / 2);
    });

    it('should handle different percentages', () => {
      const config5: WithdrawalConfig = {
        strategy: 'percentageOfPortfolio',
        percentage: 5,
      };

      const withdrawal = calculateWithdrawal(config5, 1000000, mockYearData, 0, 30);
      expect(withdrawal).toBe(50000); // 5% of 1M
    });
  });

  describe('capeBasedWithdrawal strategy', () => {
    const config: WithdrawalConfig = {
      strategy: 'capeBasedWithdrawal',
      capeBase: 0.04,
      capeWeight: 0.5,
    };

    it('should adjust based on CAPE', () => {
      const withdrawal = calculateWithdrawal(config, 1000000, mockYearData, 0, 30);

      // Formula: (0.04 + 0.5 * (1/30.5)) * 1000000
      const caey = 1 / 30.5;
      const expectedRate = 0.04 + 0.5 * caey;
      const expected = 1000000 * expectedRate;

      expect(withdrawal).toBeCloseTo(expected, 0);
    });

    it('should use fallback when CAPE is invalid', () => {
      const yearDataNoCape = { ...mockYearData, cape: 0 };
      const withdrawal = calculateWithdrawal(config, 1000000, yearDataNoCape, 0, 30);

      // Should fallback to base rate
      expect(withdrawal).toBe(40000); // 4% of 1M
    });
  });

  describe('guardrails strategy', () => {
    const config: WithdrawalConfig = {
      strategy: 'guardrails',
      percentage: 4,
    };

    it('should use base rate on first year', () => {
      const withdrawal = calculateWithdrawal(config, 1000000, mockYearData, 0, 30);
      expect(withdrawal).toBe(40000); // 4% of 1M
    });

    it('should maintain previous withdrawal within guardrails', () => {
      const portfolio = 950000; // Down 5%
      const previousWithdrawal = 40000;

      const withdrawal = calculateWithdrawal(config, portfolio, mockYearData, previousWithdrawal, 29);

      // Base would be 38000, but guardrails keep it at 40000 (within ±20%)
      expect(withdrawal).toBe(previousWithdrawal);
    });

    it('should adjust when outside guardrails', () => {
      const portfolio = 1500000; // Up 50%
      const previousWithdrawal = 40000;

      const withdrawal = calculateWithdrawal(config, portfolio, mockYearData, previousWithdrawal, 29);

      // Base is 60000, upper guardrail is 48000 (40000 * 1.2)
      expect(withdrawal).toBe(48000);
    });
  });

  describe('dynamicSpending strategy', () => {
    const config: WithdrawalConfig = {
      strategy: 'dynamicSpending',
      percentage: 4,
    };

    it('should calculate withdrawal based on remaining years', () => {
      const portfolio = 1000000;
      const yearsRemaining = 25;

      const withdrawal = calculateWithdrawal(config, portfolio, mockYearData, 0, yearsRemaining);

      // Should be max of (portfolio/years) or (base rate * portfolio)
      const evenDist = portfolio / yearsRemaining; // 40000
      const baseWithdrawal = portfolio * 0.04; // 40000

      expect(withdrawal).toBe(Math.max(evenDist, baseWithdrawal));
    });

    it('should increase withdrawal rate near end of retirement', () => {
      const portfolio = 1000000;

      const withdrawal30 = calculateWithdrawal(config, portfolio, mockYearData, 0, 30);
      const withdrawal10 = calculateWithdrawal(config, portfolio, mockYearData, 0, 10);
      const withdrawal5 = calculateWithdrawal(config, portfolio, mockYearData, 0, 5);

      // Later years should have higher withdrawals
      expect(withdrawal10).toBeGreaterThan(withdrawal30);
      expect(withdrawal5).toBeGreaterThan(withdrawal10);
    });

    it('should return 0 for 0 years remaining', () => {
      const withdrawal = calculateWithdrawal(config, 1000000, mockYearData, 0, 0);
      expect(withdrawal).toBe(0);
    });
  });

  describe('min/max constraints', () => {
    it('should enforce minimum withdrawal', () => {
      const config: WithdrawalConfig = {
        strategy: 'percentageOfPortfolio',
        percentage: 4,
        minWithdrawal: 50000,
      };

      const withdrawal = calculateWithdrawal(config, 1000000, mockYearData, 0, 30);
      expect(withdrawal).toBe(50000);
    });

    it('should enforce maximum withdrawal', () => {
      const config: WithdrawalConfig = {
        strategy: 'percentageOfPortfolio',
        percentage: 10,
        maxWithdrawal: 60000,
      };

      const withdrawal = calculateWithdrawal(config, 1000000, mockYearData, 0, 30);
      expect(withdrawal).toBe(60000);
    });

    it('should not withdraw more than portfolio', () => {
      const config: WithdrawalConfig = {
        strategy: 'constantDollar',
        amount: 100000,
      };

      const withdrawal = calculateWithdrawal(config, 50000, mockYearData, 0, 30);
      expect(withdrawal).toBe(50000);
    });
  });
});
