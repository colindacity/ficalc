import type { TaxBracket, TaxConfig } from '../types';

/**
 * Tax brackets and rates for 2024 (will need to be updated annually)
 */

// Federal income tax brackets (2024, single filer)
const FEDERAL_BRACKETS_SINGLE: TaxBracket[] = [
  { min: 0, max: 11600, rate: 0.10 },
  { min: 11600, max: 47150, rate: 0.12 },
  { min: 47150, max: 100525, rate: 0.22 },
  { min: 100525, max: 191950, rate: 0.24 },
  { min: 191950, max: 243725, rate: 0.32 },
  { min: 243725, max: 609350, rate: 0.35 },
  { min: 609350, max: Infinity, rate: 0.37 },
];

// Federal income tax brackets (2024, married filing jointly)
const FEDERAL_BRACKETS_MARRIED: TaxBracket[] = [
  { min: 0, max: 23200, rate: 0.10 },
  { min: 23200, max: 94300, rate: 0.12 },
  { min: 94300, max: 201050, rate: 0.22 },
  { min: 201050, max: 383900, rate: 0.24 },
  { min: 383900, max: 487450, rate: 0.32 },
  { min: 487450, max: 731200, rate: 0.35 },
  { min: 731200, max: Infinity, rate: 0.37 },
];

// Long-term capital gains brackets (2024)
const CAPITAL_GAINS_BRACKETS_SINGLE: TaxBracket[] = [
  { min: 0, max: 47025, rate: 0.00 },
  { min: 47025, max: 518900, rate: 0.15 },
  { min: 518900, max: Infinity, rate: 0.20 },
];

const CAPITAL_GAINS_BRACKETS_MARRIED: TaxBracket[] = [
  { min: 0, max: 94050, rate: 0.00 },
  { min: 94050, max: 583750, rate: 0.15 },
  { min: 583750, max: Infinity, rate: 0.20 },
];

// Washington State has no state income tax!
const WA_STATE_BRACKETS: TaxBracket[] = [
  { min: 0, max: Infinity, rate: 0.00 },
];

// Standard deductions (2024)
const STANDARD_DEDUCTION_SINGLE = 14600;
const STANDARD_DEDUCTION_MARRIED = 29200;
const STANDARD_DEDUCTION_HEAD = 21900;

/**
 * Get tax configuration for a specific state and filing status
 */
export function getTaxConfig(
  state: string,
  filingStatus: 'single' | 'married' | 'headOfHousehold'
): TaxConfig {
  const federalBrackets =
    filingStatus === 'married'
      ? FEDERAL_BRACKETS_MARRIED
      : FEDERAL_BRACKETS_SINGLE;

  const capitalGainsRates =
    filingStatus === 'married'
      ? CAPITAL_GAINS_BRACKETS_MARRIED
      : CAPITAL_GAINS_BRACKETS_SINGLE;

  const standardDeduction =
    filingStatus === 'married'
      ? STANDARD_DEDUCTION_MARRIED
      : filingStatus === 'headOfHousehold'
      ? STANDARD_DEDUCTION_HEAD
      : STANDARD_DEDUCTION_SINGLE;

  // For now, only Washington state is implemented
  const stateBrackets = state.toUpperCase() === 'WA' ? WA_STATE_BRACKETS : [];

  return {
    federalBrackets,
    stateBrackets,
    standardDeduction,
    capitalGainsRates,
  };
}

/**
 * Calculate tax on a given income amount using progressive brackets
 */
export function calculateTax(income: number, brackets: TaxBracket[]): number {
  if (income <= 0) return 0;

  let tax = 0;

  for (const bracket of brackets) {
    if (income <= bracket.min) break;

    const taxableInBracket = Math.min(income, bracket.max) - bracket.min;
    tax += taxableInBracket * bracket.rate;
  }

  return tax;
}

/**
 * Calculate retirement withdrawal taxes
 *
 * This is a simplified calculation that treats withdrawals as:
 * - Long-term capital gains (portfolio withdrawals)
 * - Ordinary income (401k/IRA withdrawals)
 *
 * For simplicity, we'll assume 50% is capital gains and 50% is ordinary income
 */
export function calculateRetirementWithdrawalTax(
  withdrawal: number,
  taxConfig: TaxConfig,
  ordinaryIncomeRatio: number = 0.5
): number {
  if (withdrawal <= 0) return 0;

  const ordinaryIncome = withdrawal * ordinaryIncomeRatio;
  const capitalGains = withdrawal * (1 - ordinaryIncomeRatio);

  // Calculate taxable ordinary income (after standard deduction)
  const taxableOrdinaryIncome = Math.max(0, ordinaryIncome - taxConfig.standardDeduction);

  // Calculate taxes
  const federalOrdinaryTax = calculateTax(taxableOrdinaryIncome, taxConfig.federalBrackets);
  const stateOrdinaryTax = calculateTax(taxableOrdinaryIncome, taxConfig.stateBrackets);
  const capitalGainsTax = calculateTax(capitalGains, taxConfig.capitalGainsRates);

  return federalOrdinaryTax + stateOrdinaryTax + capitalGainsTax;
}

/**
 * Calculate effective tax rate on withdrawal
 */
export function calculateEffectiveTaxRate(
  withdrawal: number,
  taxConfig: TaxConfig,
  ordinaryIncomeRatio: number = 0.5
): number {
  if (withdrawal <= 0) return 0;
  const tax = calculateRetirementWithdrawalTax(withdrawal, taxConfig, ordinaryIncomeRatio);
  return tax / withdrawal;
}

/**
 * Calculate net withdrawal after taxes
 */
export function calculateNetWithdrawal(
  grossWithdrawal: number,
  taxConfig: TaxConfig,
  ordinaryIncomeRatio: number = 0.5
): number {
  const tax = calculateRetirementWithdrawalTax(grossWithdrawal, taxConfig, ordinaryIncomeRatio);
  return grossWithdrawal - tax;
}

/**
 * Calculate gross withdrawal needed for a target net amount
 */
export function calculateGrossWithdrawalForNetAmount(
  targetNet: number,
  taxConfig: TaxConfig,
  ordinaryIncomeRatio: number = 0.5,
  maxIterations: number = 20
): number {
  // Use iterative approach to find gross amount
  let guess = targetNet / 0.85; // Start with assumption of ~15% tax rate
  let iteration = 0;

  while (iteration < maxIterations) {
    const netAmount = calculateNetWithdrawal(guess, taxConfig, ordinaryIncomeRatio);
    const error = targetNet - netAmount;

    if (Math.abs(error) < 1) {
      // Close enough (within $1)
      break;
    }

    // Adjust guess
    guess += error / 0.85;
    iteration++;
  }

  return guess;
}
