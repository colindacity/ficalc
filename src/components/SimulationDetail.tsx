import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { SimulationResult, CalculatorConfig, YearlyData } from '../types';
import './SimulationDetail.css';

interface SimulationDetailProps {
  simulation: SimulationResult;
  config: CalculatorConfig;
  historicalData: YearlyData[];
  onBack: () => void;
}

export default function SimulationDetail({
  simulation,
  config,
  historicalData,
  onBack,
}: SimulationDetailProps) {
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

  const getStatusLabel = () => {
    switch (simulation.status) {
      case 'success':
        return 'Succeeded';
      case 'failed':
        return 'Failed';
      case 'nearlyFailed':
        return 'Nearly Failed';
      case 'largeEnd':
        return 'Large End Portfolio';
      default:
        return 'Unknown';
    }
  };

  const getStatusClass = () => {
    switch (simulation.status) {
      case 'success':
        return 'status-success';
      case 'failed':
        return 'status-failed';
      case 'nearlyFailed':
        return 'status-nearly-failed';
      case 'largeEnd':
        return 'status-large-end';
      default:
        return '';
    }
  };

  const getStatusDescription = () => {
    switch (simulation.status) {
      case 'success':
        return 'Withdrawals sustained until the end.';
      case 'failed':
        return 'Portfolio exhausted before the end of retirement.';
      case 'nearlyFailed':
        return 'Final portfolio value fell below 35% of initial portfolio.';
      case 'largeEnd':
        return 'Final portfolio value exceeded 300% of initial portfolio.';
      default:
        return '';
    }
  };

  // Prepare data for portfolio chart
  const portfolioChartData = simulation.yearResults.map((yr) => ({
    year: yr.year,
    portfolio: yr.portfolioEnd,
  }));

  // Calculate S&P 500 performance stats
  const stockReturns = simulation.yearResults.map(yr => yr.stockReturn * 100);
  const avgReturn = stockReturns.reduce((sum, r) => sum + r, 0) / stockReturns.length;
  const bestYearReturn = Math.max(...stockReturns);
  const worstYearReturn = Math.min(...stockReturns);
  const yearsUp = stockReturns.filter(r => r > 0).length;
  const yearsDown = stockReturns.filter(r => r <= 0).length;

  const bestYearIndex = stockReturns.indexOf(bestYearReturn);
  const worstYearIndex = stockReturns.indexOf(worstYearReturn);
  const bestYear = simulation.yearResults[bestYearIndex]?.year;
  const worstYear = simulation.yearResults[worstYearIndex]?.year;

  // Calculate inflation stats
  const inflationRates = simulation.yearResults.map(yr => yr.inflation * 100);
  const avgInflation = inflationRates.reduce((sum, r) => sum + r, 0) / inflationRates.length;
  const highestInflation = Math.max(...inflationRates);
  const lowestInflation = Math.min(...inflationRates);

  const highestInflationIndex = inflationRates.indexOf(highestInflation);
  const lowestInflationIndex = inflationRates.indexOf(lowestInflation);
  const highestInflationYear = simulation.yearResults[highestInflationIndex]?.year;
  const lowestInflationYear = simulation.yearResults[lowestInflationIndex]?.year;

  const totalInflation = simulation.yearResults.reduce((acc, yr) => acc * (1 + yr.inflation), 1) - 1;

  // Calculate purchasing power data
  const initialPurchasingPower = 10000;
  let cumulativePurchasingPower = initialPurchasingPower;
  const purchasingPowerData = simulation.yearResults.map((yr) => {
    cumulativePurchasingPower = cumulativePurchasingPower / (1 + yr.inflation);
    return {
      year: yr.year,
      purchasingPower: cumulativePurchasingPower,
    };
  });

  const finalPurchasingPower = purchasingPowerData[purchasingPowerData.length - 1]?.purchasingPower || 0;
  const purchasingPowerChange = ((finalPurchasingPower - initialPurchasingPower) / initialPurchasingPower) * 100;

  return (
    <div className="simulation-detail">
      <button className="back-button" onClick={onBack}>
        ← Return to Results
      </button>

      <div className="simulation-header">
        <h2>
          {new Date(simulation.startYear, 0, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          {' – '}
          {new Date(simulation.endYear, 0, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </h2>
        <div className={`status-badge ${getStatusClass()}`}>
          {getStatusLabel()}
        </div>
      </div>

      <p className="status-description">{getStatusDescription()}</p>

      <div className="stats-grid">
        <div className="stat-section">
          <h3>Portfolio</h3>
          <div className="stat-items">
            <div className="stat-row">
              <span className="label">Median</span>
              <span className="value">
                {formatCurrency(
                  simulation.yearResults.reduce((sum, yr) => sum + yr.portfolioEnd, 0) /
                    simulation.yearResults.length
                )}
              </span>
            </div>
            <div className="stat-row">
              <span className="label">Final Value</span>
              <span className="value">{formatCurrency(simulation.finalPortfolio)}</span>
            </div>
          </div>
        </div>

        <div className="stat-section">
          <h3>Available Spend</h3>
          <div className="stat-items">
            <div className="stat-row">
              <span className="label">Average</span>
              <span className="value">{formatCurrency(simulation.averageRealAnnualWithdrawal)}</span>
            </div>
            <div className="stat-row">
              <span className="label">Lifetime Spend</span>
              <span className="value">{formatCurrency(simulation.totalRealWithdrawn)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="chart-section">
        <h3>Portfolio Value Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={portfolioChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Line
              type="monotone"
              dataKey="portfolio"
              stroke="#1976d2"
              strokeWidth={2}
              dot={false}
              name="Portfolio Value"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="performance-sections">
        <div className="performance-section">
          <h3>S&P 500 Performance</h3>
          <p className="section-note">Real performance of $10,000 invested in the S&P 500 over this period.</p>
          <div className="stat-items">
            <div className="stat-row">
              <span className="label">Average Return, All Years</span>
              <span className="value">{formatPercent(avgReturn)}</span>
            </div>
            <div className="stat-row">
              <span className="label">Best Year Return</span>
              <span className="value">
                {formatPercent(bestYearReturn)} ({bestYear})
              </span>
            </div>
            <div className="stat-row">
              <span className="label">Worst Year Return</span>
              <span className="value">
                {formatPercent(worstYearReturn)} ({worstYear})
              </span>
            </div>
            <div className="stat-row">
              <span className="label"># of Years Up</span>
              <span className="value">
                {yearsUp} ({formatPercent((yearsUp / simulation.yearResults.length) * 100)})
              </span>
            </div>
            <div className="stat-row">
              <span className="label"># of Years Down</span>
              <span className="value">
                {yearsDown} ({formatPercent((yearsDown / simulation.yearResults.length) * 100)})
              </span>
            </div>
          </div>
        </div>

        <div className="performance-section">
          <h3>Inflation</h3>
          <p className="section-note">Annual inflation over this period.</p>
          <div className="stat-items">
            <div className="stat-row">
              <span className="label">Average Inflation, All Years</span>
              <span className="value">{formatPercent(avgInflation)}</span>
            </div>
            <div className="stat-row">
              <span className="label">Inflation Over Period</span>
              <span className="value">{formatPercent(totalInflation * 100)}</span>
            </div>
            <div className="stat-row">
              <span className="label">Highest Annual Inflation</span>
              <span className="value">
                {formatPercent(highestInflation)} ({highestInflationYear})
              </span>
            </div>
            <div className="stat-row">
              <span className="label">Lowest Annual Inflation</span>
              <span className="value">
                {formatPercent(lowestInflation)} ({lowestInflationYear})
              </span>
            </div>
          </div>
        </div>

        <div className="performance-section">
          <h3>Purchasing Power</h3>
          <p className="section-note">
            The impact of inflation on the purchasing power of $10,000 over this period.
          </p>
          <div className="stat-items">
            <div className="stat-row">
              <span className="label">Initial Value</span>
              <span className="value">{formatCurrency(initialPurchasingPower)}</span>
            </div>
            <div className="stat-row">
              <span className="label">Final Value</span>
              <span className="value">{formatCurrency(finalPurchasingPower)}</span>
            </div>
            <div className="stat-row">
              <span className="label">Total Change</span>
              <span className="value">{formatPercent(purchasingPowerChange)}</span>
            </div>
          </div>

          <div className="chart-section-small">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={purchasingPowerData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Line
                  type="monotone"
                  dataKey="purchasingPower"
                  stroke="#f57c00"
                  strokeWidth={2}
                  dot={false}
                  name="Purchasing Power"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
