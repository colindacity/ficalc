import { useState, useEffect } from 'react';
import type { CalculatorConfig, YearlyData, BacktestResults } from './types';
import { parseShillerData, convertToYearlyData } from './utils/dataParser';
import { runBacktest, solveForRequiredPortfolio, solveForMaxWithdrawal } from './engine/backtester';
import ConfigPanel from './components/ConfigPanel';
import ResultsPanel from './components/ResultsPanel';
import SimulationDetail from './components/SimulationDetail';
import './App.css';

function App() {
  const [historicalData, setHistoricalData] = useState<YearlyData[]>([]);
  const [config, setConfig] = useState<CalculatorConfig>({
    mode: 'retirement',
    objective: 'simulate',
    retirementLength: 30,
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
  });

  const [results, setResults] = useState<BacktestResults | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load historical data on mount
  useEffect(() => {
    loadHistoricalData();
  }, []);

  const loadHistoricalData = async () => {
    try {
      const response = await fetch('/data/shiller-data.csv');
      const csvText = await response.text();
      const monthlyData = await parseShillerData(csvText);
      const yearlyData = convertToYearlyData(monthlyData);
      setHistoricalData(yearlyData);
    } catch (err) {
      setError(`Failed to load historical data: ${err}`);
    }
  };

  const handleCalculate = async () => {
    if (historicalData.length === 0) {
      setError('Historical data not loaded');
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      let backtestResults: BacktestResults;

      switch (config.objective) {
        case 'simulate':
          backtestResults = runBacktest(config, historicalData);
          break;

        case 'requiredPortfolio':
          backtestResults = solveForRequiredPortfolio(config, historicalData);
          break;

        case 'maxWithdrawal':
          backtestResults = solveForMaxWithdrawal(config, historicalData);
          break;

        default:
          backtestResults = runBacktest(config, historicalData);
      }

      setResults(backtestResults);
      setSelectedYear(null);
    } catch (err) {
      setError(`Calculation failed: ${err}`);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
  };

  const handleBackToResults = () => {
    setSelectedYear(null);
  };

  const selectedSimulation = selectedYear
    ? results?.simulations.find(s => s.startYear === selectedYear)
    : null;

  return (
    <div className="app">
      <header className="app-header">
        <h1>FI Calc</h1>
        <p>Retirement Backtesting Calculator</p>
      </header>

      <main className="app-main">
        <div className="app-content">
          <div className="left-panel">
            <ConfigPanel
              config={config}
              onChange={setConfig}
              onCalculate={handleCalculate}
              isCalculating={isCalculating}
              dataLoaded={historicalData.length > 0}
            />
          </div>

          <div className="right-panel">
            {error && (
              <div className="error-message">
                <strong>Error:</strong> {error}
              </div>
            )}

            {isCalculating && (
              <div className="calculating-message">
                <div className="spinner"></div>
                <p>Running simulations...</p>
              </div>
            )}

            {!isCalculating && results && !selectedSimulation && (
              <ResultsPanel
                results={results}
                onYearSelect={handleYearSelect}
              />
            )}

            {!isCalculating && results && selectedSimulation && (
              <SimulationDetail
                simulation={selectedSimulation}
                config={config}
                historicalData={historicalData}
                onBack={handleBackToResults}
              />
            )}

            {!isCalculating && !results && !error && (
              <div className="welcome-message">
                <h2>Welcome to FI Calc</h2>
                <p>Configure your retirement parameters on the left and click "Calculate" to run backtesting simulations.</p>
                <div className="features">
                  <h3>Features:</h3>
                  <ul>
                    <li>Backtesting using historical market data (1871-present)</li>
                    <li>Multiple withdrawal strategies</li>
                    <li>Real dollar calculations adjusted for inflation</li>
                    <li>Tax calculations for Seattle, WA</li>
                    <li>View individual simulation details</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>&copy; 2024 FI Calc | Data from Robert Shiller</p>
      </footer>
    </div>
  );
}

export default App;
