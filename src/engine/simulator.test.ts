import { describe, it, expect } from 'vitest';
import { runSimulation, calculateStats, calculatePercentiles } from './simulator';
import type { CalculatorConfig, YearlyData } from '../types';

describe('simulator', () => {
  const mockHistoricalData: YearlyData[] = [
    { year: 2020, startingCPI: 257.97, endingCPI: 260.47, inflation: 0.01, stockReturn: 0.10, bondReturn: 0.03, cashReturn: 0.015, cape: 30.5 },
    { year: 2021, startingCPI: 260.47, endingCPI: 281.15, inflation: 0.08, stockReturn: 0.25, bondReturn: -0.02, cashReturn: 0.015, cape: 35.7 },
    { year: 2022, startingCPI: 281.15, endingCPI: 299.17, inflation: 0.06, stockReturn: -0.18, bondReturn: -0.10, cashReturn: 0.015, cape: 28.8 },
    { year: 2023, startingCPI: 299.17, endingCPI: 308.42, inflation: 0.03, stockReturn: 0.22, bondReturn: 0.05, cashReturn: 0.015, cape: 32.1 },
    { year: 2024, startingCPI: 308.42, endingCPI: 315.00, inflation: 0.02, stockReturn: 0.15, bondReturn: 0.04, cashReturn: 0.015, cape: 30.0 },
  ];

  const baseConfig: CalculatorConfig = {
    mode: 'retirement',
    objective: 'simulate',
    retirementLength: 5,
    initialPortfolio: 1000000,
    allocation: {
      equities: 80,
      bonds: 15,
      cash: 5,
    },
    rebalanceAnnually: true,
    withdrawal: {
      strategy: 'constantDollar',
      amount: 40000,
    },
    state: 'WA',
    filingStatus: 'single',
    useAllHistoricalData: true,
    minimumFinalPortfolioPercentage: 35,
    largeEndPortfolioMultiple: 300,
    currentAge: 65,
  };

  describe('runSimulation', () => {
    it('should run a complete simulation', () => {
      const result = runSimulation(baseConfig, mockHistoricalData, 2020);

      expect(result).toBeDefined();
      expect(result.startYear).toBe(2020);
      expect(result.yearResults).toHaveLength(5);
      expect(result.status).toBeDefined();
    });

    it('should track portfolio value over time', () => {
      const result = runSimulation(baseConfig, mockHistoricalData, 2020);

      expect(result.yearResults[0].portfolioStart).toBe(1000000);

      // Each year should have start and end values
      result.yearResults.forEach(year => {
        expect(year.portfolioStart).toBeGreaterThanOrEqual(0);
        expect(year.portfolioEnd).toBeGreaterThanOrEqual(0);
      });
    });

    it('should apply withdrawals', () => {
      const result = runSimulation(baseConfig, mockHistoricalData, 2020);

      // Each year should have a withdrawal
      result.yearResults.forEach(year => {
        expect(year.withdrawal).toBeGreaterThan(0);
      });

      expect(result.totalWithdrawn).toBeGreaterThan(0);
    });

    it('should calculate taxes', () => {
      const result = runSimulation(baseConfig, mockHistoricalData, 2020);

      // Each year should have taxes
      result.yearResults.forEach(year => {
        expect(year.taxes).toBeGreaterThanOrEqual(0);
      });
    });

    it('should apply returns based on allocation', () => {
      const result = runSimulation(baseConfig, mockHistoricalData, 2020);

      result.yearResults.forEach(year => {
        expect(year.returns).toBeDefined();
        expect(year.returns.total).toBeDefined();
        expect(year.returns.equities).toBeDefined();
        expect(year.returns.bonds).toBeDefined();
        expect(year.returns.cash).toBeDefined();
      });
    });

    it('should handle portfolio exhaustion', () => {
      const configLargeWithdrawal: CalculatorConfig = {
        ...baseConfig,
        withdrawal: {
          strategy: 'constantDollar',
          amount: 300000, // Unsustainably high
        },
      };

      const result = runSimulation(configLargeWithdrawal, mockHistoricalData, 2020);

      expect(result.status).toBe('failed');
      expect(result.finalPortfolio).toBe(0);
      expect(result.yearsUntilExhaustion).toBeDefined();
    });

    it('should detect nearly failed scenarios', () => {
      const configHighWithdrawal: CalculatorConfig = {
        ...baseConfig,
        withdrawal: {
          strategy: 'constantDollar',
          amount: 60000,
        },
      };

      const result = runSimulation(configHighWithdrawal, mockHistoricalData, 2020);

      // With high withdrawal and short period, might be nearly failed
      if (result.finalPortfolio < baseConfig.initialPortfolio! * 0.35 && result.finalPortfolio > 0) {
        expect(result.status).toBe('nearlyFailed');
      }
    });

    it('should calculate real dollar withdrawals', () => {
      const result = runSimulation(baseConfig, mockHistoricalData, 2020);

      result.yearResults.forEach(year => {
        expect(year.withdrawalRealDollars).toBeDefined();
        expect(year.withdrawalRealDollars).toBeGreaterThanOrEqual(0);
      });

      expect(result.totalRealWithdrawn).toBeGreaterThan(0);
    });

    it('should adjust for inflation', () => {
      const result = runSimulation(baseConfig, mockHistoricalData, 2020);

      // Later years should have higher CPI
      expect(result.yearResults[4].cpi).toBeGreaterThan(result.yearResults[0].cpi);
    });
  });

  describe('calculateStats', () => {
    it('should calculate statistics correctly', () => {
      const values = [10, 20, 30, 40, 50];
      const stats = calculateStats(values);

      expect(stats.median).toBe(30);
      expect(stats.mean).toBe(30);
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(50);
      expect(stats.stdDev).toBeGreaterThan(0);
    });

    it('should handle single value', () => {
      const values = [100];
      const stats = calculateStats(values);

      expect(stats.median).toBe(100);
      expect(stats.mean).toBe(100);
      expect(stats.min).toBe(100);
      expect(stats.max).toBe(100);
      expect(stats.stdDev).toBe(0);
    });

    it('should handle empty array', () => {
      const values: number[] = [];
      const stats = calculateStats(values);

      expect(stats.median).toBe(0);
      expect(stats.mean).toBe(0);
      expect(stats.min).toBe(0);
      expect(stats.max).toBe(0);
      expect(stats.stdDev).toBe(0);
    });

    it('should calculate standard deviation', () => {
      const values = [1, 2, 3, 4, 5];
      const stats = calculateStats(values);

      // Variance = ((1-3)² + (2-3)² + (3-3)² + (4-3)² + (5-3)²) / 5 = 10/5 = 2
      // StdDev = √2 ≈ 1.414
      expect(stats.stdDev).toBeCloseTo(1.414, 2);
    });
  });

  describe('calculatePercentiles', () => {
    it('should calculate percentiles correctly', () => {
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const percentiles = calculatePercentiles(values);

      expect(percentiles.p10).toBe(10);
      expect(percentiles.p25).toBe(20);
      expect(percentiles.p50).toBe(50);
      expect(percentiles.p75).toBe(70);
      expect(percentiles.p90).toBe(90);
    });

    it('should handle empty array', () => {
      const values: number[] = [];
      const percentiles = calculatePercentiles(values);

      expect(percentiles.p10).toBe(0);
      expect(percentiles.p25).toBe(0);
      expect(percentiles.p50).toBe(0);
      expect(percentiles.p75).toBe(0);
      expect(percentiles.p90).toBe(0);
    });

    it('should handle small arrays', () => {
      const values = [100];
      const percentiles = calculatePercentiles(values);

      expect(percentiles.p10).toBe(100);
      expect(percentiles.p50).toBe(100);
      expect(percentiles.p90).toBe(100);
    });
  });
});
