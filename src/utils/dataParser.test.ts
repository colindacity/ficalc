import { describe, it, expect } from 'vitest';
import {
  convertToYearlyData,
  calculateInflationFactor,
  toRealDollars,
  filterDataByRange,
} from './dataParser';
import type { HistoricalDataPoint, YearlyData } from '../types';

describe('dataParser', () => {
  const mockMonthlyData: HistoricalDataPoint[] = [
    {
      date: '2020.01',
      year: 2020,
      month: 1,
      price: 3225.52,
      dividend: 58.99,
      earnings: 124.51,
      cpi: 257.97,
      longRate: 1.92,
      realPrice: 3139.11,
      realDividend: 57.43,
      realEarnings: 121.11,
      cape: 30.5,
    },
    {
      date: '2021.01',
      year: 2021,
      month: 1,
      price: 3793.75,
      dividend: 58.92,
      earnings: 139.47,
      cpi: 260.47,
      longRate: 1.11,
      realPrice: 3656.59,
      realDividend: 56.82,
      realEarnings: 134.52,
      cape: 35.7,
    },
    {
      date: '2022.01',
      year: 2022,
      month: 1,
      price: 4515.55,
      dividend: 63.23,
      earnings: 195.24,
      cpi: 281.15,
      longRate: 1.88,
      realPrice: 4031.85,
      realDividend: 56.43,
      realEarnings: 174.28,
      cape: 36.8,
    },
  ];

  describe('convertToYearlyData', () => {
    it('should convert monthly data to yearly data', () => {
      const yearlyData = convertToYearlyData(mockMonthlyData);

      expect(yearlyData).toHaveLength(2); // 2020->2021 and 2021->2022
      expect(yearlyData[0].year).toBe(2020);
      expect(yearlyData[1].year).toBe(2021);
    });

    it('should calculate inflation correctly', () => {
      const yearlyData = convertToYearlyData(mockMonthlyData);

      // Inflation from 2020 to 2021: (260.47 - 257.97) / 257.97
      const expectedInflation2020 = (260.47 - 257.97) / 257.97;
      expect(yearlyData[0].inflation).toBeCloseTo(expectedInflation2020, 4);

      // Inflation from 2021 to 2022: (281.15 - 260.47) / 260.47
      const expectedInflation2021 = (281.15 - 260.47) / 260.47;
      expect(yearlyData[1].inflation).toBeCloseTo(expectedInflation2021, 4);
    });

    it('should calculate stock returns', () => {
      const yearlyData = convertToYearlyData(mockMonthlyData);

      // Stock return includes capital appreciation + dividend yield
      const priceReturn2020 = (3793.75 - 3225.52) / 3225.52;
      const dividendYield2020 = 58.99 / 3225.52;
      const expectedStockReturn2020 = priceReturn2020 + dividendYield2020;

      expect(yearlyData[0].stockReturn).toBeCloseTo(expectedStockReturn2020, 4);
    });

    it('should handle CAPE values', () => {
      const yearlyData = convertToYearlyData(mockMonthlyData);

      expect(yearlyData[0].cape).toBe(30.5);
      expect(yearlyData[1].cape).toBe(35.7);
    });
  });

  describe('calculateInflationFactor', () => {
    const mockYearlyData: YearlyData[] = [
      {
        year: 2020,
        startingCPI: 257.97,
        endingCPI: 260.47,
        inflation: 0.0097,
        stockReturn: 0.20,
        bondReturn: 0.03,
        cashReturn: 0.015,
        cape: 30.5,
      },
      {
        year: 2021,
        startingCPI: 260.47,
        endingCPI: 281.15,
        inflation: 0.0794,
        stockReturn: 0.15,
        bondReturn: 0.02,
        cashReturn: 0.015,
        cape: 35.7,
      },
      {
        year: 2022,
        startingCPI: 281.15,
        endingCPI: 299.17,
        inflation: 0.0641,
        stockReturn: -0.18,
        bondReturn: -0.10,
        cashReturn: 0.015,
        cape: 28.8,
      },
    ];

    it('should return 1 for same year', () => {
      const factor = calculateInflationFactor(mockYearlyData, 2020, 2020);
      expect(factor).toBe(1);
    });

    it('should calculate cumulative inflation forward', () => {
      const factor = calculateInflationFactor(mockYearlyData, 2020, 2022);

      // Cumulative: (1 + 0.0097) * (1 + 0.0794) * (1 + 0.0641)
      const expectedFactor = 1.0097 * 1.0794 * 1.0641;
      expect(factor).toBeCloseTo(expectedFactor, 4);
    });

    it('should calculate inverse inflation backward', () => {
      const factor = calculateInflationFactor(mockYearlyData, 2022, 2020);

      const forwardFactor = 1.0097 * 1.0794 * 1.0641;
      const expectedFactor = 1 / forwardFactor;
      expect(factor).toBeCloseTo(expectedFactor, 4);
    });
  });

  describe('toRealDollars', () => {
    const mockYearlyData: YearlyData[] = [
      {
        year: 2020,
        startingCPI: 257.97,
        endingCPI: 260.47,
        inflation: 0.0097,
        stockReturn: 0.20,
        bondReturn: 0.03,
        cashReturn: 0.015,
        cape: 30.5,
      },
      {
        year: 2021,
        startingCPI: 260.47,
        endingCPI: 281.15,
        inflation: 0.0794,
        stockReturn: 0.15,
        bondReturn: 0.02,
        cashReturn: 0.015,
        cape: 35.7,
      },
    ];

    it('should convert nominal to real dollars', () => {
      const nominalAmount = 100000;
      const realAmount = toRealDollars(nominalAmount, mockYearlyData, 2020, 2021);

      const inflationFactor = 1.0097 * 1.0794;
      const expectedRealAmount = nominalAmount / inflationFactor;

      expect(realAmount).toBeCloseTo(expectedRealAmount, 2);
    });

    it('should return same amount for same year', () => {
      const amount = 100000;
      const realAmount = toRealDollars(amount, mockYearlyData, 2020, 2020);
      expect(realAmount).toBe(amount);
    });
  });

  describe('filterDataByRange', () => {
    const mockData: YearlyData[] = [
      { year: 1900, startingCPI: 10, endingCPI: 11, inflation: 0.1, stockReturn: 0.08, bondReturn: 0.03, cashReturn: 0.015, cape: 15 },
      { year: 1920, startingCPI: 20, endingCPI: 21, inflation: 0.05, stockReturn: 0.10, bondReturn: 0.04, cashReturn: 0.015, cape: 12 },
      { year: 1940, startingCPI: 30, endingCPI: 31, inflation: 0.03, stockReturn: 0.06, bondReturn: 0.03, cashReturn: 0.015, cape: 10 },
      { year: 1960, startingCPI: 40, endingCPI: 41, inflation: 0.02, stockReturn: 0.12, bondReturn: 0.05, cashReturn: 0.015, cape: 18 },
    ];

    it('should filter by start year', () => {
      const filtered = filterDataByRange(mockData, 1920);
      expect(filtered).toHaveLength(3);
      expect(filtered[0].year).toBe(1920);
    });

    it('should filter by end year', () => {
      const filtered = filterDataByRange(mockData, undefined, 1940);
      expect(filtered).toHaveLength(3);
      expect(filtered[filtered.length - 1].year).toBe(1940);
    });

    it('should filter by both start and end year', () => {
      const filtered = filterDataByRange(mockData, 1920, 1940);
      expect(filtered).toHaveLength(2);
      expect(filtered[0].year).toBe(1920);
      expect(filtered[1].year).toBe(1940);
    });

    it('should return all data if no filters', () => {
      const filtered = filterDataByRange(mockData);
      expect(filtered).toHaveLength(4);
    });
  });
});
