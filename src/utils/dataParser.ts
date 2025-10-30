import Papa from 'papaparse';
import type { HistoricalDataPoint, YearlyData } from '../types';

/**
 * Parse Shiller historical data CSV
 * The CSV has multiple header rows before the actual data
 */
export async function parseShillerData(csvContent: string): Promise<HistoricalDataPoint[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      comments: '#',
      complete: (results) => {
        try {
          const data: HistoricalDataPoint[] = results.data
            .filter((row: any) => row.Date && !isNaN(parseFloat(row.Date)))
            .map((row: any) => {
              const dateStr = String(row.Date);
              const [yearStr, monthStr] = dateStr.split('.');
              const year = parseInt(yearStr, 10);
              const month = monthStr ? parseInt(monthStr, 10) : 1;

              return {
                date: dateStr,
                year,
                month,
                price: parseFloat(row.Price) || 0,
                dividend: parseFloat(row.Dividend) || 0,
                earnings: parseFloat(row.Earnings) || 0,
                cpi: parseFloat(row.CPI) || 0,
                longRate: parseFloat(row.Long_Rate) || 0,
                realPrice: parseFloat(row.Real_Price) || 0,
                realDividend: parseFloat(row.Real_Dividend) || 0,
                realEarnings: parseFloat(row.Real_Earnings) || 0,
                cape: parseFloat(row.CAPE) || 0,
              };
            });

          resolve(data);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

/**
 * Convert monthly Shiller data to yearly data for backtesting
 * Uses January values for each year
 */
export function convertToYearlyData(monthlyData: HistoricalDataPoint[]): YearlyData[] {
  const yearlyMap = new Map<number, HistoricalDataPoint[]>();

  // Group by year
  monthlyData.forEach(point => {
    if (!yearlyMap.has(point.year)) {
      yearlyMap.set(point.year, []);
    }
    yearlyMap.get(point.year)!.push(point);
  });

  const years = Array.from(yearlyMap.keys()).sort((a, b) => a - b);
  const yearlyData: YearlyData[] = [];

  for (let i = 0; i < years.length - 1; i++) {
    const year = years[i];
    const nextYear = years[i + 1];

    const startData = yearlyMap.get(year)!.find(d => d.month === 1) || yearlyMap.get(year)![0];
    const endData = yearlyMap.get(nextYear)!.find(d => d.month === 1) || yearlyMap.get(nextYear)![0];

    if (!startData || !endData) continue;

    // Calculate inflation
    const inflation = startData.cpi > 0
      ? (endData.cpi - startData.cpi) / startData.cpi
      : 0;

    // Calculate stock return (capital appreciation + dividend yield)
    const priceReturn = startData.price > 0
      ? (endData.price - startData.price) / startData.price
      : 0;
    const dividendYield = startData.price > 0
      ? startData.dividend / startData.price
      : 0;
    const stockReturn = priceReturn + dividendYield;

    // Bond return approximation from long-term interest rate
    // This is a simplified calculation
    const bondReturn = (startData.longRate / 100) - (inflation * 0.5);

    // Cash return (default to historical average, can be customized)
    const cashReturn = 0.015; // 1.5% default

    yearlyData.push({
      year,
      startingCPI: startData.cpi,
      endingCPI: endData.cpi,
      inflation,
      stockReturn,
      bondReturn,
      cashReturn,
      cape: startData.cape,
    });
  }

  return yearlyData;
}

/**
 * Calculate inflation factor from one year to another
 */
export function calculateInflationFactor(
  yearlyData: YearlyData[],
  fromYear: number,
  toYear: number
): number {
  if (fromYear === toYear) return 1;

  let factor = 1;
  const start = Math.min(fromYear, toYear);
  const end = Math.max(fromYear, toYear);

  for (const data of yearlyData) {
    if (data.year >= start && data.year < end) {
      factor *= (1 + data.inflation);
    }
  }

  return fromYear < toYear ? factor : 1 / factor;
}

/**
 * Convert nominal dollars to real dollars (today's dollars)
 */
export function toRealDollars(
  nominalAmount: number,
  yearlyData: YearlyData[],
  fromYear: number,
  toYear: number
): number {
  const inflationFactor = calculateInflationFactor(yearlyData, fromYear, toYear);
  return nominalAmount / inflationFactor;
}

/**
 * Filter yearly data by date range
 */
export function filterDataByRange(
  data: YearlyData[],
  startYear?: number,
  endYear?: number
): YearlyData[] {
  let filtered = [...data];

  if (startYear) {
    filtered = filtered.filter(d => d.year >= startYear);
  }

  if (endYear) {
    filtered = filtered.filter(d => d.year <= endYear);
  }

  return filtered;
}
