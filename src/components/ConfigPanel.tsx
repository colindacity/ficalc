import { useState } from 'react';
import type { CalculatorConfig } from '../types';
import './ConfigPanel.css';

interface ConfigPanelProps {
  config: CalculatorConfig;
  onChange: (config: CalculatorConfig) => void;
  onCalculate: () => void;
  isCalculating: boolean;
  dataLoaded: boolean;
}

export default function ConfigPanel({
  config,
  onChange,
  onCalculate,
  isCalculating,
  dataLoaded,
}: ConfigPanelProps) {
  const [uploadedData, setUploadedData] = useState<File | null>(null);

  const handleChange = (field: string, value: any) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    onChange({
      ...config,
      [parent]: {
        ...(config as any)[parent],
        [field]: value,
      },
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedData(file);
      // In a real implementation, we would parse this file
      console.log('File uploaded:', file.name);
    }
  };

  return (
    <div className="config-panel">
      <h2>Configuration</h2>

      <div className="config-section">
        <h3>Objective</h3>
        <select
          value={config.objective}
          onChange={(e) => handleChange('objective', e.target.value)}
        >
          <option value="simulate">Simulate Given Inputs</option>
          <option value="requiredPortfolio">Portfolio Needed for Withdrawal</option>
          <option value="maxWithdrawal">Max Withdrawal from Portfolio</option>
          <option value="requiredSavings">Savings Needed per Year</option>
          <option value="retirementAge">Calculate Retirement Age</option>
        </select>
      </div>

      <div className="config-section">
        <h3>Time Parameters</h3>

        <label>
          Retirement Length (years)
          <input
            type="number"
            value={config.retirementLength}
            onChange={(e) => handleChange('retirementLength', parseInt(e.target.value))}
            min="1"
            max="60"
          />
        </label>

        <label>
          Current Age
          <input
            type="number"
            value={config.currentAge || 65}
            onChange={(e) => handleChange('currentAge', parseInt(e.target.value))}
            min="18"
            max="100"
          />
        </label>
      </div>

      <div className="config-section">
        <h3>Portfolio</h3>

        <label>
          Initial Portfolio ($)
          <input
            type="number"
            value={config.initialPortfolio || 0}
            onChange={(e) => handleChange('initialPortfolio', parseFloat(e.target.value))}
            step="10000"
            min="0"
          />
        </label>

        <h4>Asset Allocation</h4>

        <label>
          Equities (%)
          <input
            type="number"
            value={config.allocation.equities}
            onChange={(e) => handleNestedChange('allocation', 'equities', parseFloat(e.target.value))}
            min="0"
            max="100"
          />
        </label>

        <label>
          Bonds (%)
          <input
            type="number"
            value={config.allocation.bonds}
            onChange={(e) => handleNestedChange('allocation', 'bonds', parseFloat(e.target.value))}
            min="0"
            max="100"
          />
        </label>

        <label>
          Cash (%)
          <input
            type="number"
            value={config.allocation.cash}
            onChange={(e) => handleNestedChange('allocation', 'cash', parseFloat(e.target.value))}
            min="0"
            max="100"
          />
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={config.rebalanceAnnually}
            onChange={(e) => handleChange('rebalanceAnnually', e.target.checked)}
          />
          Rebalance Annually
        </label>
      </div>

      <div className="config-section">
        <h3>Withdrawal Strategy</h3>

        <label>
          Strategy
          <select
            value={config.withdrawal.strategy}
            onChange={(e) => handleNestedChange('withdrawal', 'strategy', e.target.value)}
          >
            <option value="constantDollar">Constant Dollar</option>
            <option value="percentageOfPortfolio">Percentage of Portfolio</option>
            <option value="capeBasedWithdrawal">CAPE-Based</option>
            <option value="guardrails">Guardrails</option>
            <option value="dynamicSpending">Dynamic Spending</option>
          </select>
        </label>

        {config.withdrawal.strategy === 'constantDollar' && (
          <label>
            Annual Withdrawal ($)
            <input
              type="number"
              value={config.withdrawal.amount || 0}
              onChange={(e) => handleNestedChange('withdrawal', 'amount', parseFloat(e.target.value))}
              step="1000"
              min="0"
            />
          </label>
        )}

        {(config.withdrawal.strategy === 'percentageOfPortfolio' ||
          config.withdrawal.strategy === 'guardrails' ||
          config.withdrawal.strategy === 'dynamicSpending') && (
          <label>
            Percentage (%)
            <input
              type="number"
              value={config.withdrawal.percentage || 4}
              onChange={(e) => handleNestedChange('withdrawal', 'percentage', parseFloat(e.target.value))}
              step="0.1"
              min="0"
              max="20"
            />
          </label>
        )}
      </div>

      <div className="config-section">
        <h3>Tax Settings</h3>

        <label>
          State
          <select
            value={config.state}
            onChange={(e) => handleChange('state', e.target.value)}
          >
            <option value="WA">Washington</option>
          </select>
        </label>

        <label>
          Filing Status
          <select
            value={config.filingStatus}
            onChange={(e) => handleChange('filingStatus', e.target.value)}
          >
            <option value="single">Single</option>
            <option value="married">Married Filing Jointly</option>
            <option value="headOfHousehold">Head of Household</option>
          </select>
        </label>
      </div>

      <div className="config-section">
        <h3>Historical Data</h3>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={config.useAllHistoricalData}
            onChange={(e) => handleChange('useAllHistoricalData', e.target.checked)}
          />
          Use All Historical Data (1871-present)
        </label>

        {!config.useAllHistoricalData && (
          <>
            <label>
              Start Year
              <input
                type="number"
                value={config.startYear || 1926}
                onChange={(e) => handleChange('startYear', parseInt(e.target.value))}
                min="1871"
              />
            </label>

            <label>
              End Year
              <input
                type="number"
                value={config.endYear || 2024}
                onChange={(e) => handleChange('endYear', parseInt(e.target.value))}
                min="1871"
              />
            </label>
          </>
        )}

        <label className="file-upload">
          Upload Custom Data (CSV)
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
          />
          {uploadedData && <span className="file-name">{uploadedData.name}</span>}
        </label>
      </div>

      <button
        className="calculate-button"
        onClick={onCalculate}
        disabled={isCalculating || !dataLoaded}
      >
        {isCalculating ? 'Calculating...' : 'Calculate'}
      </button>
    </div>
  );
}
