import type { WithdrawalConfig, YearlyData } from '../types';

/**
 * Calculate withdrawal amount based on strategy
 */
export function calculateWithdrawal(
  config: WithdrawalConfig,
  portfolio: number,
  yearData: YearlyData,
  previousWithdrawal: number,
  yearsRemaining: number
): number {
  let withdrawal = 0;

  switch (config.strategy) {
    case 'constantDollar':
      withdrawal = config.amount || 0;
      break;

    case 'percentageOfPortfolio':
      withdrawal = portfolio * ((config.percentage || 4) / 100);
      break;

    case 'capeBasedWithdrawal':
      withdrawal = calculateCapeBasedWithdrawal(
        portfolio,
        yearData.cape,
        config.capeBase || 0.04,
        config.capeWeight || 0.5
      );
      break;

    case 'guardrails':
      withdrawal = calculateGuardrailsWithdrawal(
        portfolio,
        previousWithdrawal,
        config.percentage || 4,
        config.minWithdrawal,
        config.maxWithdrawal
      );
      break;

    case 'dynamicSpending':
      withdrawal = calculateDynamicSpending(
        portfolio,
        yearsRemaining,
        config.percentage || 4
      );
      break;

    default:
      withdrawal = config.amount || 0;
  }

  // Apply min/max constraints if specified
  if (config.minWithdrawal && withdrawal < config.minWithdrawal) {
    withdrawal = config.minWithdrawal;
  }
  if (config.maxWithdrawal && withdrawal > config.maxWithdrawal) {
    withdrawal = config.maxWithdrawal;
  }

  // Can't withdraw more than portfolio
  return Math.min(withdrawal, portfolio);
}

/**
 * CAPE-based withdrawal strategy
 * Formula: (a + b * CAEY) * P
 * Where CAEY = 1/CAPE
 */
function calculateCapeBasedWithdrawal(
  portfolio: number,
  cape: number,
  base: number,
  weight: number
): number {
  if (!cape || cape <= 0) {
    // Fallback to constant percentage if CAPE not available
    return portfolio * base;
  }

  const caey = 1 / cape;
  const withdrawalRate = base + weight * caey;

  return portfolio * withdrawalRate;
}

/**
 * Guardrails strategy
 * Adjusts withdrawal based on portfolio performance but smooths changes
 */
function calculateGuardrailsWithdrawal(
  portfolio: number,
  previousWithdrawal: number,
  baseRate: number,
  minWithdrawal?: number,
  maxWithdrawal?: number
): number {
  const baseWithdrawal = portfolio * (baseRate / 100);

  // If first year or no previous withdrawal, use base
  if (!previousWithdrawal) {
    return baseWithdrawal;
  }

  // Define guardrails (±20% from base)
  const upperGuardrail = baseWithdrawal * 1.2;
  const lowerGuardrail = baseWithdrawal * 0.8;

  // Current withdrawal is previous adjusted for portfolio performance
  let withdrawal = previousWithdrawal;

  // If we're outside guardrails, adjust
  if (baseWithdrawal > upperGuardrail) {
    withdrawal = upperGuardrail;
  } else if (baseWithdrawal < lowerGuardrail) {
    withdrawal = lowerGuardrail;
  }

  return withdrawal;
}

/**
 * Dynamic spending strategy
 * Adjusts based on remaining years and portfolio value
 */
function calculateDynamicSpending(
  portfolio: number,
  yearsRemaining: number,
  baseRate: number
): number {
  if (yearsRemaining <= 0) return 0;

  // Simple dynamic approach: divide portfolio by remaining years
  // with a floor based on base rate
  const evenDistribution = portfolio / yearsRemaining;
  const baseWithdrawal = portfolio * (baseRate / 100);

  // Use the higher of the two
  return Math.max(evenDistribution, baseWithdrawal);
}

/**
 * Adjust withdrawal for inflation
 */
export function inflationAdjustWithdrawal(
  baseWithdrawal: number,
  cumulativeInflation: number
): number {
  return baseWithdrawal * (1 + cumulativeInflation);
}
