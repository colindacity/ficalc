// Historical data types
export interface HistoricalDataPoint {
  date: string; // Format: YYYY.MM
  year: number;
  month: number;
  price: number; // S&P Composite Price
  dividend: number;
  earnings: number;
  cpi: number; // Consumer Price Index
  longRate: number; // Long-term interest rate
  realPrice: number;
  realDividend: number;
  realEarnings: number;
  cape: number; // Cyclically Adjusted Price-to-Earnings ratio
}

export interface YearlyData {
  year: number;
  startingCPI: number;
  endingCPI: number;
  inflation: number;
  stockReturn: number; // Total return including dividends
  bondReturn: number;
  cashReturn: number;
  cape: number;
}

// Configuration types
export interface PortfolioAllocation {
  equities: number; // Percentage (0-100)
  bonds: number; // Percentage (0-100)
  cash: number; // Percentage (0-100)
}

export type WithdrawalStrategy =
  | 'constantDollar'
  | 'percentageOfPortfolio'
  | 'capeBasedWithdrawal'
  | 'guardrails'
  | 'dynamicSpending';

export interface WithdrawalConfig {
  strategy: WithdrawalStrategy;
  amount?: number; // For constant dollar
  percentage?: number; // For percentage-based
  capeBase?: number; // For CAPE-based (a parameter)
  capeWeight?: number; // For CAPE-based (b parameter)
  minWithdrawal?: number;
  maxWithdrawal?: number;
}

export type CalculatorMode =
  | 'retirement' // Start from retirement with initial portfolio
  | 'accumulation' // Start from today, accumulate to retirement
  | 'combined'; // Both accumulation and retirement phases

export type ObjectiveFunction =
  | 'requiredSavings' // How much to save per year to reach target portfolio
  | 'requiredPortfolio' // Portfolio needed for target withdrawal
  | 'maxWithdrawal' // Max sustainable withdrawal given portfolio
  | 'retirementAge' // When can I retire given inputs
  | 'simulate'; // Just simulate given all inputs

export interface CalculatorConfig {
  mode: CalculatorMode;
  objective: ObjectiveFunction;

  // Time parameters
  retirementLength: number; // Years in retirement
  yearsUntilRetirement?: number; // For accumulation phase
  currentAge?: number;
  retirementAge?: number;

  // Portfolio parameters
  initialPortfolio?: number;
  targetPortfolio?: number;
  allocation: PortfolioAllocation;
  rebalanceAnnually: boolean;

  // Withdrawal parameters
  withdrawal: WithdrawalConfig;
  targetWithdrawal?: number;

  // Accumulation parameters
  annualSavings?: number;
  targetSavings?: number; // For objective function

  // Tax configuration
  state: string; // e.g., "WA"
  filingStatus: 'single' | 'married' | 'headOfHousehold';

  // Historical data range
  useAllHistoricalData: boolean;
  startYear?: number;
  endYear?: number;

  // Success criteria
  minimumFinalPortfolioPercentage: number; // e.g., 35% means nearly failed if below 35%
  largeEndPortfolioMultiple: number; // e.g., 300% means large if above 300%
}

// Simulation results types
export interface YearResult {
  year: number;
  age?: number;
  portfolioStart: number;
  portfolioEnd: number;
  withdrawal: number;
  withdrawalRealDollars: number;
  taxes: number;
  returns: {
    equities: number;
    bonds: number;
    cash: number;
    total: number;
  };
  inflation: number;
  cpi: number;
  cape: number;
  stockReturn: number;
}

export type SimulationStatus =
  | 'success'
  | 'failed' // Portfolio exhausted
  | 'nearlyFailed' // Final portfolio < 35% of initial
  | 'largeEnd'; // Final portfolio > 300% of initial

export interface SimulationResult {
  startYear: number;
  endYear: number;
  status: SimulationStatus;
  yearResults: YearResult[];
  finalPortfolio: number;
  totalWithdrawn: number;
  totalRealWithdrawn: number; // In today's dollars
  averageAnnualWithdrawal: number;
  averageRealAnnualWithdrawal: number;
  yearsUntilExhaustion?: number;
}

export interface BacktestResults {
  config: CalculatorConfig;
  simulations: SimulationResult[];

  // Summary statistics
  totalSimulations: number;
  successfulSimulations: number;
  failedSimulations: number;
  nearlyFailedSimulations: number;
  largeEndSimulations: number;

  successRate: number; // Percentage

  // Portfolio statistics (at end of retirement)
  portfolioMedian: number;
  portfolioMean: number;
  portfolioStdDev: number;
  portfolioMax: number;
  portfolioMin: number;
  portfoliosAtZero: number;

  // Withdrawal statistics (real dollars)
  withdrawalMedian: number;
  withdrawalMean: number;
  withdrawalStdDev: number;
  withdrawalMax: number;
  withdrawalMin: number;

  // Lifetime spend
  averageLifetimeSpend: number;

  // For objective functions
  solvedValue?: number; // The answer to the objective function
  confidenceIntervals?: {
    p10: number; // 10th percentile
    p25: number;
    p50: number; // Median
    p75: number;
    p90: number;
  };
}

// Tax calculation types
export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

export interface TaxConfig {
  federalBrackets: TaxBracket[];
  stateBrackets: TaxBracket[];
  standardDeduction: number;
  capitalGainsRates: TaxBracket[];
  socialSecurityTaxRate?: number;
  medicareTaxRate?: number;
}
