import type {
  CalculatorConfig,
  YearlyData,
  SimulationResult,
  YearResult,
  SimulationStatus,
  PortfolioAllocation,
} from '../types';
import { getTaxConfig, calculateRetirementWithdrawalTax } from '../utils/taxes';
import { calculateWithdrawal } from '../utils/withdrawalStrategies';
import { toRealDollars } from '../utils/dataParser';

/**
 * Run a single simulation starting from a specific year
 */
export function runSimulation(
  config: CalculatorConfig,
  historicalData: YearlyData[],
  startYear: number,
  baseYear: number = startYear // Year for "today's dollars"
): SimulationResult {
  const taxConfig = getTaxConfig(config.state, config.filingStatus);
  const yearResults: YearResult[] = [];

  let portfolio = config.initialPortfolio || 0;
  let cumulativeInflation = 0;
  let previousWithdrawal = 0;

  const retirementLength = config.retirementLength;
  const dataStartIndex = historicalData.findIndex(d => d.year === startYear);

  if (dataStartIndex === -1) {
    throw new Error(`Start year ${startYear} not found in historical data`);
  }

  // Run simulation year by year
  for (let yearIndex = 0; yearIndex < retirementLength; yearIndex++) {
    const dataIndex = dataStartIndex + yearIndex;

    // Check if we have data for this year
    if (dataIndex >= historicalData.length) {
      // Ran out of historical data
      break;
    }

    const yearData = historicalData[dataIndex];
    const currentYear = yearData.year;
    const yearsRemaining = retirementLength - yearIndex;

    // Portfolio at start of year
    const portfolioStart = portfolio;

    // Calculate withdrawal for this year
    let withdrawal = 0;
    if (config.withdrawal.strategy === 'constantDollar' && yearIndex === 0) {
      // First year, use base amount
      withdrawal = config.withdrawal.amount || 0;
      previousWithdrawal = withdrawal;
    } else if (config.withdrawal.strategy === 'constantDollar') {
      // Adjust for inflation from previous year
      withdrawal = previousWithdrawal * (1 + yearData.inflation);
      previousWithdrawal = withdrawal;
    } else {
      withdrawal = calculateWithdrawal(
        config.withdrawal,
        portfolio,
        yearData,
        previousWithdrawal,
        yearsRemaining
      );
      previousWithdrawal = withdrawal;
    }

    // Calculate taxes on withdrawal
    const taxes = calculateRetirementWithdrawalTax(withdrawal, taxConfig);

    // Withdraw from portfolio (including taxes)
    portfolio -= (withdrawal + taxes);

    // Check if portfolio is exhausted
    if (portfolio <= 0) {
      portfolio = 0;
      withdrawal = Math.max(0, portfolioStart); // Can only withdraw what's left

      yearResults.push({
        year: currentYear,
        age: config.currentAge ? config.currentAge + yearIndex : undefined,
        portfolioStart,
        portfolioEnd: 0,
        withdrawal,
        withdrawalRealDollars: toRealDollars(withdrawal, historicalData, currentYear, baseYear),
        taxes: 0,
        returns: {
          equities: 0,
          bonds: 0,
          cash: 0,
          total: 0,
        },
        inflation: yearData.inflation,
        cpi: yearData.endingCPI,
        cape: yearData.cape,
        stockReturn: yearData.stockReturn,
      });

      // Portfolio exhausted, fill remaining years with zeros
      for (let j = yearIndex + 1; j < retirementLength; j++) {
        const futureDataIndex = dataStartIndex + j;
        if (futureDataIndex >= historicalData.length) break;

        const futureYearData = historicalData[futureDataIndex];
        yearResults.push({
          year: futureYearData.year,
          age: config.currentAge ? config.currentAge + j : undefined,
          portfolioStart: 0,
          portfolioEnd: 0,
          withdrawal: 0,
          withdrawalRealDollars: 0,
          taxes: 0,
          returns: {
            equities: 0,
            bonds: 0,
            cash: 0,
            total: 0,
          },
          inflation: futureYearData.inflation,
          cpi: futureYearData.endingCPI,
          cape: futureYearData.cape,
          stockReturn: futureYearData.stockReturn,
        });
      }

      break;
    }

    // Calculate returns based on allocation
    const returns = calculatePortfolioReturns(
      portfolio,
      config.allocation,
      yearData
    );

    // Apply returns
    portfolio += returns.total;

    // Rebalance if configured
    if (config.rebalanceAnnually) {
      // Rebalancing is implicit in our calculation as we apply weighted returns
    }

    // Track cumulative inflation
    cumulativeInflation = (1 + cumulativeInflation) * (1 + yearData.inflation) - 1;

    // Store year result
    yearResults.push({
      year: currentYear,
      age: config.currentAge ? config.currentAge + yearIndex : undefined,
      portfolioStart,
      portfolioEnd: portfolio,
      withdrawal,
      withdrawalRealDollars: toRealDollars(withdrawal, historicalData, currentYear, baseYear),
      taxes,
      returns: {
        equities: returns.equities,
        bonds: returns.bonds,
        cash: returns.cash,
        total: returns.total,
      },
      inflation: yearData.inflation,
      cpi: yearData.endingCPI,
      cape: yearData.cape,
      stockReturn: yearData.stockReturn,
    });
  }

  // Calculate simulation statistics
  const finalPortfolio = portfolio;
  const initialPortfolio = config.initialPortfolio || 0;

  const totalWithdrawn = yearResults.reduce((sum, yr) => sum + yr.withdrawal, 0);
  const totalRealWithdrawn = yearResults.reduce((sum, yr) => sum + yr.withdrawalRealDollars, 0);
  const averageAnnualWithdrawal = totalWithdrawn / yearResults.length;
  const averageRealAnnualWithdrawal = totalRealWithdrawn / yearResults.length;

  // Determine status
  let status: SimulationStatus = 'success';
  const yearsUntilExhaustion = yearResults.findIndex(yr => yr.portfolioEnd === 0);

  if (finalPortfolio === 0) {
    status = 'failed';
  } else if (finalPortfolio < initialPortfolio * (config.minimumFinalPortfolioPercentage / 100)) {
    status = 'nearlyFailed';
  } else if (finalPortfolio > initialPortfolio * (config.largeEndPortfolioMultiple / 100)) {
    status = 'largeEnd';
  }

  return {
    startYear,
    endYear: yearResults[yearResults.length - 1]?.year || startYear,
    status,
    yearResults,
    finalPortfolio,
    totalWithdrawn,
    totalRealWithdrawn,
    averageAnnualWithdrawal,
    averageRealAnnualWithdrawal,
    yearsUntilExhaustion: yearsUntilExhaustion >= 0 ? yearsUntilExhaustion + 1 : undefined,
  };
}

/**
 * Calculate portfolio returns for a year based on allocation
 */
function calculatePortfolioReturns(
  portfolio: number,
  allocation: PortfolioAllocation,
  yearData: YearlyData
): {
  equities: number;
  bonds: number;
  cash: number;
  total: number;
} {
  const equitiesReturn = (portfolio * allocation.equities / 100) * yearData.stockReturn;
  const bondsReturn = (portfolio * allocation.bonds / 100) * yearData.bondReturn;
  const cashReturn = (portfolio * allocation.cash / 100) * yearData.cashReturn;

  return {
    equities: equitiesReturn,
    bonds: bondsReturn,
    cash: cashReturn,
    total: equitiesReturn + bondsReturn + cashReturn,
  };
}

/**
 * Calculate statistics from array of numbers
 */
export function calculateStats(values: number[]): {
  median: number;
  mean: number;
  stdDev: number;
  min: number;
  max: number;
} {
  if (values.length === 0) {
    return { median: 0, mean: 0, stdDev: 0, min: 0, max: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;

  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return {
    median,
    mean,
    stdDev,
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

/**
 * Calculate percentiles from array of numbers
 */
export function calculatePercentiles(values: number[]): {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
} {
  if (values.length === 0) {
    return { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);

  const getPercentile = (p: number) => {
    const index = Math.floor((p / 100) * sorted.length);
    return sorted[Math.min(index, sorted.length - 1)];
  };

  return {
    p10: getPercentile(10),
    p25: getPercentile(25),
    p50: getPercentile(50),
    p75: getPercentile(75),
    p90: getPercentile(90),
  };
}
