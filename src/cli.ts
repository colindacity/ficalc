#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { parseShillerData, convertToYearlyData } from './utils/dataParser.js';
import { runBacktest, solveForRequiredPortfolio, solveForMaxWithdrawal } from './engine/backtester.js';
import type { CalculatorConfig } from './types.js';

const program = new Command();

program
  .name('ficalc')
  .description('Retirement backtesting calculator using historical market data')
  .version('1.0.0');

program
  .command('simulate')
  .description('Run retirement simulation with backtesting')
  .option('-p, --portfolio <amount>', 'Initial portfolio amount', '1000000')
  .option('-w, --withdrawal <amount>', 'Annual withdrawal amount', '40000')
  .option('-y, --years <number>', 'Retirement length in years', '30')
  .option('-e, --equities <percent>', 'Equities allocation %', '80')
  .option('-b, --bonds <percent>', 'Bonds allocation %', '15')
  .option('-c, --cash <percent>', 'Cash allocation %', '5')
  .option('-s, --strategy <strategy>', 'Withdrawal strategy (constantDollar, percentageOfPortfolio, capeBasedWithdrawal)', 'constantDollar')
  .option('-d, --data <path>', 'Path to historical data CSV', './data/shiller-data.csv')
  .option('--start-year <year>', 'Start year for historical data filter')
  .option('--end-year <year>', 'End year for historical data filter')
  .option('--json', 'Output results as JSON')
  .action(async (options) => {
    try {
      console.log(chalk.blue.bold('\n🎯 FI Calc - Retirement Backtesting\n'));

      // Load historical data
      console.log(chalk.gray('Loading historical data...'));
      const csvContent = readFileSync(options.data, 'utf-8');
      const monthlyData = await parseShillerData(csvContent);
      const historicalData = convertToYearlyData(monthlyData);

      // Build configuration
      const config: CalculatorConfig = {
        mode: 'retirement',
        objective: 'simulate',
        retirementLength: parseInt(options.years),
        initialPortfolio: parseFloat(options.portfolio),
        allocation: {
          equities: parseFloat(options.equities),
          bonds: parseFloat(options.bonds),
          cash: parseFloat(options.cash),
        },
        rebalanceAnnually: true,
        withdrawal: {
          strategy: options.strategy,
          amount: parseFloat(options.withdrawal),
        },
        state: 'WA',
        filingStatus: 'single',
        useAllHistoricalData: !options.startYear && !options.endYear,
        startYear: options.startYear ? parseInt(options.startYear) : undefined,
        endYear: options.endYear ? parseInt(options.endYear) : undefined,
        minimumFinalPortfolioPercentage: 35,
        largeEndPortfolioMultiple: 300,
        currentAge: 65,
      };

      console.log(chalk.gray('Running simulations...\n'));

      // Run backtest
      const results = runBacktest(config, historicalData);

      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
        return;
      }

      // Display results
      console.log(chalk.green.bold('📊 Results Summary\n'));
      console.log(`Total Simulations: ${chalk.yellow(results.totalSimulations)}`);
      console.log(`Success Rate: ${chalk.green(results.successRate.toFixed(2) + '%')}`);
      console.log(`Successful: ${chalk.green(results.successfulSimulations)} | Failed: ${chalk.red(results.failedSimulations)}`);
      console.log(`Nearly Failed: ${chalk.yellow(results.nearlyFailedSimulations)} | Large End: ${chalk.blue(results.largeEndSimulations)}\n`);

      console.log(chalk.cyan.bold('💰 Portfolio at End of Retirement\n'));
      console.log(`Median: ${chalk.yellow('$' + results.portfolioMedian.toLocaleString())}`);
      console.log(`Average: ${chalk.yellow('$' + results.portfolioMean.toLocaleString())}`);
      console.log(`Std Dev: ${chalk.gray('$' + results.portfolioStdDev.toLocaleString())}`);
      console.log(`Range: ${chalk.gray('$' + results.portfolioMin.toLocaleString())} - ${chalk.gray('$' + results.portfolioMax.toLocaleString())}`);
      console.log(`Portfolios at $0: ${chalk.red(results.portfoliosAtZero)}\n`);

      console.log(chalk.cyan.bold('💵 Available Spend (Real Dollars)\n'));
      console.log(`Median: ${chalk.yellow('$' + results.withdrawalMedian.toLocaleString())}`);
      console.log(`Average: ${chalk.yellow('$' + results.withdrawalMean.toLocaleString())}`);
      console.log(`Average Lifetime Spend: ${chalk.yellow('$' + results.averageLifetimeSpend.toLocaleString())}\n`);

      console.log(chalk.green('✅ Simulation complete!\n'));
    } catch (error) {
      console.error(chalk.red('Error running simulation:'), error);
      process.exit(1);
    }
  });

program
  .command('required-portfolio')
  .description('Calculate portfolio needed for target withdrawal')
  .requiredOption('-w, --withdrawal <amount>', 'Target annual withdrawal amount')
  .option('-y, --years <number>', 'Retirement length in years', '30')
  .option('-r, --success-rate <percent>', 'Target success rate %', '95')
  .option('-e, --equities <percent>', 'Equities allocation %', '80')
  .option('-b, --bonds <percent>', 'Bonds allocation %', '15')
  .option('-c, --cash <percent>', 'Cash allocation %', '5')
  .option('-d, --data <path>', 'Path to historical data CSV', './data/shiller-data.csv')
  .option('--json', 'Output results as JSON')
  .action(async (options) => {
    try {
      console.log(chalk.blue.bold('\n🎯 FI Calc - Required Portfolio Calculator\n'));

      const csvContent = readFileSync(options.data, 'utf-8');
      const monthlyData = await parseShillerData(csvContent);
      const historicalData = convertToYearlyData(monthlyData);

      const config: CalculatorConfig = {
        mode: 'retirement',
        objective: 'requiredPortfolio',
        retirementLength: parseInt(options.years),
        targetWithdrawal: parseFloat(options.withdrawal),
        allocation: {
          equities: parseFloat(options.equities),
          bonds: parseFloat(options.bonds),
          cash: parseFloat(options.cash),
        },
        rebalanceAnnually: true,
        withdrawal: {
          strategy: 'constantDollar',
        },
        state: 'WA',
        filingStatus: 'single',
        useAllHistoricalData: true,
        minimumFinalPortfolioPercentage: 35,
        largeEndPortfolioMultiple: 300,
        currentAge: 65,
      };

      console.log(chalk.gray('Calculating required portfolio...\n'));

      const results = solveForRequiredPortfolio(
        config,
        historicalData,
        parseFloat(options.successRate)
      );

      if (options.json) {
        console.log(JSON.stringify({ requiredPortfolio: results.solvedValue, ...results }, null, 2));
        return;
      }

      console.log(chalk.green.bold('✅ Solution Found!\n'));
      console.log(`Target Withdrawal: ${chalk.yellow('$' + parseFloat(options.withdrawal).toLocaleString() + '/year')}`);
      console.log(`Target Success Rate: ${chalk.yellow(options.successRate + '%')}`);
      console.log(chalk.cyan.bold(`\nRequired Portfolio: ${chalk.green('$' + (results.solvedValue || 0).toLocaleString())}\n`));
      console.log(`Actual Success Rate: ${chalk.green(results.successRate.toFixed(2) + '%')}`);
      console.log(`Total Simulations: ${results.totalSimulations}\n`);
    } catch (error) {
      console.error(chalk.red('Error calculating required portfolio:'), error);
      process.exit(1);
    }
  });

program
  .command('max-withdrawal')
  .description('Calculate maximum sustainable withdrawal')
  .requiredOption('-p, --portfolio <amount>', 'Initial portfolio amount')
  .option('-y, --years <number>', 'Retirement length in years', '30')
  .option('-r, --success-rate <percent>', 'Target success rate %', '95')
  .option('-e, --equities <percent>', 'Equities allocation %', '80')
  .option('-b, --bonds <percent>', 'Bonds allocation %', '15')
  .option('-c, --cash <percent>', 'Cash allocation %', '5')
  .option('-d, --data <path>', 'Path to historical data CSV', './data/shiller-data.csv')
  .option('--json', 'Output results as JSON')
  .action(async (options) => {
    try {
      console.log(chalk.blue.bold('\n🎯 FI Calc - Maximum Withdrawal Calculator\n'));

      const csvContent = readFileSync(options.data, 'utf-8');
      const monthlyData = await parseShillerData(csvContent);
      const historicalData = convertToYearlyData(monthlyData);

      const config: CalculatorConfig = {
        mode: 'retirement',
        objective: 'maxWithdrawal',
        retirementLength: parseInt(options.years),
        initialPortfolio: parseFloat(options.portfolio),
        allocation: {
          equities: parseFloat(options.equities),
          bonds: parseFloat(options.bonds),
          cash: parseFloat(options.cash),
        },
        rebalanceAnnually: true,
        withdrawal: {
          strategy: 'constantDollar',
        },
        state: 'WA',
        filingStatus: 'single',
        useAllHistoricalData: true,
        minimumFinalPortfolioPercentage: 35,
        largeEndPortfolioMultiple: 300,
        currentAge: 65,
      };

      console.log(chalk.gray('Calculating maximum withdrawal...\n'));

      const results = solveForMaxWithdrawal(
        config,
        historicalData,
        parseFloat(options.successRate)
      );

      if (options.json) {
        console.log(JSON.stringify({ maxWithdrawal: results.solvedValue, ...results }, null, 2));
        return;
      }

      console.log(chalk.green.bold('✅ Solution Found!\n'));
      console.log(`Initial Portfolio: ${chalk.yellow('$' + parseFloat(options.portfolio).toLocaleString())}`);
      console.log(`Target Success Rate: ${chalk.yellow(options.successRate + '%')}`);
      console.log(chalk.cyan.bold(`\nMaximum Withdrawal: ${chalk.green('$' + (results.solvedValue || 0).toLocaleString() + '/year')}\n`));
      console.log(`Withdrawal Rate: ${chalk.yellow(((results.solvedValue || 0) / parseFloat(options.portfolio) * 100).toFixed(2) + '%')}`);
      console.log(`Actual Success Rate: ${chalk.green(results.successRate.toFixed(2) + '%')}`);
      console.log(`Total Simulations: ${results.totalSimulations}\n`);
    } catch (error) {
      console.error(chalk.red('Error calculating maximum withdrawal:'), error);
      process.exit(1);
    }
  });

program.parse();
