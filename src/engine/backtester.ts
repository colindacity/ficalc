import type {
  CalculatorConfig,
  YearlyData,
  BacktestResults,
  SimulationResult,
} from '../types';
import { runSimulation, calculateStats, calculatePercentiles } from './simulator';
import { filterDataByRange } from '../utils/dataParser';

/**
 * Run backtesting across all available historical years
 */
export function runBacktest(
  config: CalculatorConfig,
  historicalData: YearlyData[]
): BacktestResults {
  // Filter data if needed
  const filteredData = config.useAllHistoricalData
    ? historicalData
    : filterDataByRange(historicalData, config.startYear, config.endYear);

  // Determine which years we can use as start years
  const minYear = filteredData[0]?.year;
  const maxStartYear = filteredData[filteredData.length - config.retirementLength]?.year;

  if (!minYear || !maxStartYear) {
    throw new Error('Insufficient historical data for backtesting');
  }

  const simulations: SimulationResult[] = [];

  // Run simulation for each possible start year
  for (let startYear = minYear; startYear <= maxStartYear; startYear++) {
    try {
      const simulation = runSimulation(config, filteredData, startYear, minYear);
      simulations.push(simulation);
    } catch (error) {
      console.warn(`Failed to run simulation for year ${startYear}:`, error);
    }
  }

  // Calculate summary statistics
  const totalSimulations = simulations.length;
  const successfulSimulations = simulations.filter(s => s.status === 'success').length;
  const failedSimulations = simulations.filter(s => s.status === 'failed').length;
  const nearlyFailedSimulations = simulations.filter(s => s.status === 'nearlyFailed').length;
  const largeEndSimulations = simulations.filter(s => s.status === 'largeEnd').length;

  const successRate = (successfulSimulations / totalSimulations) * 100;

  // Portfolio statistics
  const finalPortfolios = simulations.map(s => s.finalPortfolio);
  const portfolioStats = calculateStats(finalPortfolios);
  const portfoliosAtZero = simulations.filter(s => s.finalPortfolio === 0).length;

  // Withdrawal statistics (in real dollars)
  const realWithdrawals = simulations.map(s => s.averageRealAnnualWithdrawal);
  const withdrawalStats = calculateStats(realWithdrawals);

  // Lifetime spend
  const averageLifetimeSpend =
    simulations.reduce((sum, s) => sum + s.totalRealWithdrawn, 0) / totalSimulations;

  return {
    config,
    simulations,
    totalSimulations,
    successfulSimulations,
    failedSimulations,
    nearlyFailedSimulations,
    largeEndSimulations,
    successRate,
    portfolioMedian: portfolioStats.median,
    portfolioMean: portfolioStats.mean,
    portfolioStdDev: portfolioStats.stdDev,
    portfolioMax: portfolioStats.max,
    portfolioMin: portfolioStats.min,
    portfoliosAtZero,
    withdrawalMedian: withdrawalStats.median,
    withdrawalMean: withdrawalStats.mean,
    withdrawalStdDev: withdrawalStats.stdDev,
    withdrawalMax: withdrawalStats.max,
    withdrawalMin: withdrawalStats.min,
    averageLifetimeSpend,
  };
}

/**
 * Solve for required initial portfolio to achieve target withdrawal
 */
export function solveForRequiredPortfolio(
  config: CalculatorConfig,
  historicalData: YearlyData[],
  targetSuccessRate: number = 95,
  maxIterations: number = 20
): BacktestResults {
  let minPortfolio = config.targetWithdrawal! * 10; // Start with 10x withdrawal
  let maxPortfolio = config.targetWithdrawal! * 50; // Max 50x withdrawal
  let bestResults: BacktestResults | null = null;

  for (let i = 0; i < maxIterations; i++) {
    const testPortfolio = (minPortfolio + maxPortfolio) / 2;

    const testConfig = {
      ...config,
      initialPortfolio: testPortfolio,
      withdrawal: {
        ...config.withdrawal,
        amount: config.targetWithdrawal,
      },
    };

    const results = runBacktest(testConfig, historicalData);
    bestResults = results;

    if (Math.abs(results.successRate - targetSuccessRate) < 1) {
      // Close enough
      break;
    }

    if (results.successRate < targetSuccessRate) {
      // Need more portfolio
      minPortfolio = testPortfolio;
    } else {
      // Can use less portfolio
      maxPortfolio = testPortfolio;
    }
  }

  if (!bestResults) {
    throw new Error('Failed to solve for required portfolio');
  }

  // Add solved value to results
  bestResults.solvedValue = bestResults.config.initialPortfolio;

  // Add confidence intervals
  const portfolios = bestResults.simulations
    .filter(s => s.status !== 'failed')
    .map(s => s.finalPortfolio);
  bestResults.confidenceIntervals = calculatePercentiles(portfolios);

  return bestResults;
}

/**
 * Solve for maximum sustainable withdrawal given portfolio
 */
export function solveForMaxWithdrawal(
  config: CalculatorConfig,
  historicalData: YearlyData[],
  targetSuccessRate: number = 95,
  maxIterations: number = 20
): BacktestResults {
  const initialPortfolio = config.initialPortfolio!;
  let minWithdrawal = initialPortfolio * 0.01; // 1% min
  let maxWithdrawal = initialPortfolio * 0.10; // 10% max
  let bestResults: BacktestResults | null = null;

  for (let i = 0; i < maxIterations; i++) {
    const testWithdrawal = (minWithdrawal + maxWithdrawal) / 2;

    const testConfig = {
      ...config,
      withdrawal: {
        ...config.withdrawal,
        amount: testWithdrawal,
      },
    };

    const results = runBacktest(testConfig, historicalData);
    bestResults = results;

    if (Math.abs(results.successRate - targetSuccessRate) < 1) {
      // Close enough
      break;
    }

    if (results.successRate < targetSuccessRate) {
      // Withdrawal too high
      maxWithdrawal = testWithdrawal;
    } else {
      // Can withdraw more
      minWithdrawal = testWithdrawal;
    }
  }

  if (!bestResults) {
    throw new Error('Failed to solve for maximum withdrawal');
  }

  // Add solved value
  bestResults.solvedValue = bestResults.config.withdrawal.amount;

  // Add confidence intervals for different success rates
  const withdrawals = [80, 85, 90, 95, 99].map(successRate => {
    const result = solveForMaxWithdrawalAtSuccessRate(
      config,
      historicalData,
      successRate,
      10
    );
    return result.config.withdrawal.amount!;
  });

  bestResults.confidenceIntervals = {
    p10: withdrawals[0],
    p25: withdrawals[1],
    p50: withdrawals[2],
    p75: withdrawals[3],
    p90: withdrawals[4],
  };

  return bestResults;
}

/**
 * Helper function to solve for withdrawal at specific success rate
 */
function solveForMaxWithdrawalAtSuccessRate(
  config: CalculatorConfig,
  historicalData: YearlyData[],
  targetSuccessRate: number,
  maxIterations: number
): BacktestResults {
  const initialPortfolio = config.initialPortfolio!;
  let minWithdrawal = initialPortfolio * 0.01;
  let maxWithdrawal = initialPortfolio * 0.10;
  let bestResults: BacktestResults | null = null;

  for (let i = 0; i < maxIterations; i++) {
    const testWithdrawal = (minWithdrawal + maxWithdrawal) / 2;

    const testConfig = {
      ...config,
      withdrawal: {
        ...config.withdrawal,
        amount: testWithdrawal,
      },
    };

    const results = runBacktest(testConfig, historicalData);
    bestResults = results;

    if (Math.abs(results.successRate - targetSuccessRate) < 2) {
      break;
    }

    if (results.successRate < targetSuccessRate) {
      maxWithdrawal = testWithdrawal;
    } else {
      minWithdrawal = testWithdrawal;
    }
  }

  return bestResults!;
}

/**
 * Solve for required annual savings to reach target portfolio
 */
export function solveForRequiredSavings(
  config: CalculatorConfig,
  historicalData: YearlyData[],
  maxIterations: number = 20
): BacktestResults {
  // This would simulate accumulation phase
  // For now, simplified version
  const yearsToSave = config.yearsUntilRetirement || 30;
  const targetPortfolio = config.targetPortfolio!;

  // Simple approximation using average historical returns
  const avgReturn = historicalData.reduce((sum, d) => sum + d.stockReturn, 0) / historicalData.length;

  // Future value of annuity formula: FV = PMT * [(1 + r)^n - 1] / r
  const futureValueFactor = (Math.pow(1 + avgReturn, yearsToSave) - 1) / avgReturn;
  const requiredAnnualSavings = targetPortfolio / futureValueFactor;

  // Run a simulation to verify
  const testConfig = {
    ...config,
    initialPortfolio: targetPortfolio,
  };

  const results = runBacktest(testConfig, historicalData);
  results.solvedValue = requiredAnnualSavings;

  return results;
}

/**
 * Solve for retirement age given savings rate and target
 */
export function solveForRetirementAge(
  config: CalculatorConfig,
  historicalData: YearlyData[],
  maxIterations: number = 20
): BacktestResults {
  // Simplified version - would need accumulation phase simulation
  const annualSavings = config.annualSavings!;
  const targetPortfolio = config.targetPortfolio!;

  const avgReturn = historicalData.reduce((sum, d) => sum + d.stockReturn, 0) / historicalData.length;

  // Solve for n in: FV = PMT * [(1 + r)^n - 1] / r
  const yearsToRetirement = Math.log(1 + (targetPortfolio * avgReturn) / annualSavings) / Math.log(1 + avgReturn);
  const retirementAge = (config.currentAge || 30) + yearsToRetirement;

  const testConfig = {
    ...config,
    initialPortfolio: targetPortfolio,
  };

  const results = runBacktest(testConfig, historicalData);
  results.solvedValue = retirementAge;

  return results;
}
