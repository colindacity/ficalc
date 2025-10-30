import type { BacktestResults, SimulationResult } from '../types';
import './ResultsPanel.css';

interface ResultsPanelProps {
  results: BacktestResults;
  onYearSelect: (year: number) => void;
}

export default function ResultsPanel({ results, onYearSelect }: ResultsPanelProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number, decimals: number = 2) => {
    return `${value.toFixed(decimals)}%`;
  };

  const getSimulationClass = (simulation: SimulationResult) => {
    switch (simulation.status) {
      case 'failed':
        return 'simulation-failed';
      case 'nearlyFailed':
        return 'simulation-nearly-failed';
      case 'largeEnd':
        return 'simulation-large-end';
      default:
        return 'simulation-success';
    }
  };

  const getSimulationTitle = (simulation: SimulationResult) => {
    switch (simulation.status) {
      case 'failed':
        return 'Portfolio runs out of money';
      case 'nearlyFailed':
        return 'Final year portfolio is < 35% of initial portfolio';
      case 'largeEnd':
        return 'Final year portfolio is > 300% of initial portfolio';
      default:
        return 'Final year portfolio is none of the above';
    }
  };

  return (
    <div className="results-panel">
      <h2>Results</h2>

      <div className="results-summary-note">
        <p>{results.totalSimulations} simulations were run in this backtesting calculation.</p>
        <p>All dollar amounts shown are real dollars.</p>
      </div>

      <div className="summary-blocks">
        <div className="summary-block success-rate">
          <h3>Success Rate</h3>
          <div className="stat-value">{formatPercent(results.successRate)}</div>
          <div className="stat-detail">
            {results.successfulSimulations} out of {results.totalSimulations}
          </div>
        </div>

        <div className="summary-block nearly-failed">
          <h3>Nearly Failed</h3>
          <div className="stat-value">
            {formatPercent((results.nearlyFailedSimulations / results.totalSimulations) * 100)}
          </div>
          <div className="stat-detail">
            {results.nearlyFailedSimulations} out of {results.totalSimulations}
          </div>
        </div>

        <div className="summary-block large-end">
          <h3>Large End Portfolios</h3>
          <div className="stat-value">
            {formatPercent((results.largeEndSimulations / results.totalSimulations) * 100)}
          </div>
          <div className="stat-detail">
            {results.largeEndSimulations} out of {results.totalSimulations}
          </div>
        </div>
      </div>

      <div className="stats-section">
        <h3>Portfolio at End of Retirement</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-label">Median</div>
            <div className="stat-value">{formatCurrency(results.portfolioMedian)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Average</div>
            <div className="stat-value">{formatCurrency(results.portfolioMean)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Standard Deviation</div>
            <div className="stat-value">{formatCurrency(results.portfolioStdDev)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Largest</div>
            <div className="stat-value">{formatCurrency(results.portfolioMax)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Smallest</div>
            <div className="stat-value">{formatCurrency(results.portfolioMin)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">No. of $0 Portfolios</div>
            <div className="stat-value">
              {results.portfoliosAtZero} ({formatPercent((results.portfoliosAtZero / results.totalSimulations) * 100)})
            </div>
          </div>
        </div>
      </div>

      <div className="stats-section">
        <h3>Available Spend</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-label">Median</div>
            <div className="stat-value">{formatCurrency(results.withdrawalMedian)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Average</div>
            <div className="stat-value">{formatCurrency(results.withdrawalMean)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Standard Deviation</div>
            <div className="stat-value">{formatCurrency(results.withdrawalStdDev)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Largest</div>
            <div className="stat-value">{formatCurrency(results.withdrawalMax)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Smallest</div>
            <div className="stat-value">{formatCurrency(results.withdrawalMin)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Average Lifetime Spend</div>
            <div className="stat-value">{formatCurrency(results.averageLifetimeSpend)}</div>
          </div>
        </div>
      </div>

      <div className="simulations-section">
        <h3>Simulations By Start Year</h3>
        <p className="simulations-note">Select a year to view details for that individual simulation.</p>

        <div className="simulation-legend">
          <div className="legend-item">
            <div className="legend-color simulation-failed"></div>
            <span>Portfolio runs out of money</span>
          </div>
          <div className="legend-item">
            <div className="legend-color simulation-nearly-failed"></div>
            <span>Final year portfolio is &lt; 35% of initial portfolio</span>
          </div>
          <div className="legend-item">
            <div className="legend-color simulation-large-end"></div>
            <span>Final year portfolio is &gt; 300% of initial portfolio</span>
          </div>
          <div className="legend-item">
            <div className="legend-color simulation-success"></div>
            <span>Final year portfolio is none of the above</span>
          </div>
        </div>

        <div className="simulation-years">
          {results.simulations
            .slice()
            .reverse()
            .map((simulation) => (
              <button
                key={simulation.startYear}
                className={`year-button ${getSimulationClass(simulation)}`}
                onClick={() => onYearSelect(simulation.startYear)}
                title={getSimulationTitle(simulation)}
              >
                {simulation.startYear}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
