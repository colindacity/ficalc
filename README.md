# FI Calc - Retirement Backtesting Calculator

[![CI/CD](https://github.com/colindacity/ficalc/workflows/CI%2FCD/badge.svg)](https://github.com/colindacity/ficalc/actions)
[![Coverage](https://img.shields.io/codecov/c/github/colindacity/ficalc)](https://codecov.io/gh/colindacity/ficalc)

A comprehensive retirement calculator that uses backtesting with historical market data instead of Monte Carlo simulations. Inspired by Personal Capital and FI Calc, this calculator allows you to simulate retirement scenarios using actual year-by-year historical data from Robert Shiller's dataset (1871-present).

**[🌐 Live Demo](https://colindacity.github.io/ficalc/)**

## Features

### Core Functionality
- **Backtesting with Historical Data**: Uses real market returns from 1871 to present day
- **Multiple Objective Functions**:
  - How much you need to save per year to reach a target portfolio
  - How much portfolio you need at retirement for a target withdrawal
  - Maximum sustainable withdrawal given a portfolio size
  - Retirement age calculation based on savings rate
  - Full simulation of all scenarios

### Withdrawal Strategies
- **Constant Dollar**: Withdraw a fixed amount adjusted for inflation
- **Percentage of Portfolio**: Withdraw a fixed percentage each year
- **CAPE-Based Withdrawal**: Adjust withdrawals based on market valuation (CAPE ratio)
- **Guardrails**: Smooth withdrawal changes with upper/lower bounds
- **Dynamic Spending**: Adjust based on remaining years and portfolio value

### Advanced Features
- **Real Dollar Calculations**: All amounts shown in today's dollars using actual inflation rates
- **Tax Calculations**: Accurate tax modeling for Seattle, WA (no state income tax)
- **Portfolio Allocation**: Customize equity/bond/cash allocation with annual rebalancing
- **Success Rate Analysis**: Shows percentage of historical scenarios that succeeded
- **Individual Simulation Views**: Click through to see detailed year-by-year projections for each historical start year
- **Interactive Charts**: Visualize portfolio performance, inflation, and purchasing power

## Historical Data

The calculator uses the Shiller dataset, compiled by Nobel Prize-winning economist Robert Shiller. This includes:
- S&P 500 prices and dividends (1871-present)
- Long-term bond yields
- Consumer Price Index (inflation)
- CAPE (Cyclically Adjusted Price-to-Earnings) ratio

You can:
- Use all historical data (1871-present)
- Restrict to specific date ranges (e.g., 1926+ when S&P 500 was created)
- Upload your own CSV data in the Shiller format

## Installation

### Web Interface

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### CLI Tool

```bash
# Install globally
npm install -g ficalc

# Or run locally
npm install
npm run cli -- --help
```

## CLI Usage

The CLI provides powerful command-line access to all calculator features.

### Basic Simulation

```bash
# Run a basic retirement simulation
ficalc simulate --portfolio 1000000 --withdrawal 40000 --years 30

# With custom allocation
ficalc simulate \
  --portfolio 1000000 \
  --withdrawal 40000 \
  --years 30 \
  --equities 60 \
  --bonds 30 \
  --cash 10

# Filter historical data
ficalc simulate \
  --portfolio 1000000 \
  --withdrawal 40000 \
  --start-year 1926 \
  --end-year 2024

# Get JSON output for scripting
ficalc simulate --portfolio 1000000 --withdrawal 40000 --json
```

### Calculate Required Portfolio

```bash
# How much portfolio do I need for $50k/year?
ficalc required-portfolio --withdrawal 50000 --years 30

# With 90% success rate
ficalc required-portfolio \
  --withdrawal 50000 \
  --years 30 \
  --success-rate 90

# With custom allocation
ficalc required-portfolio \
  --withdrawal 50000 \
  --years 30 \
  --equities 70 \
  --bonds 25 \
  --cash 5
```

### Calculate Maximum Withdrawal

```bash
# What's the max I can withdraw from $2M?
ficalc max-withdrawal --portfolio 2000000 --years 30

# With 95% success rate
ficalc max-withdrawal \
  --portfolio 2000000 \
  --years 30 \
  --success-rate 95

# Get detailed JSON output
ficalc max-withdrawal \
  --portfolio 2000000 \
  --years 30 \
  --json > results.json
```

### CLI Options

All commands support these common options:

- `-p, --portfolio <amount>` - Initial portfolio amount
- `-w, --withdrawal <amount>` - Annual withdrawal amount
- `-y, --years <number>` - Retirement length in years (default: 30)
- `-e, --equities <percent>` - Equities allocation % (default: 80)
- `-b, --bonds <percent>` - Bonds allocation % (default: 15)
- `-c, --cash <percent>` - Cash allocation % (default: 5)
- `-s, --strategy <strategy>` - Withdrawal strategy (default: constantDollar)
- `-d, --data <path>` - Path to historical data CSV (default: ./data/shiller-data.csv)
- `--start-year <year>` - Filter historical data start year
- `--end-year <year>` - Filter historical data end year
- `-r, --success-rate <percent>` - Target success rate % (default: 95)
- `--json` - Output results as JSON

## Testing

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage

# Run tests in watch mode
npm test -- --watch
```

## CI/CD

The project uses GitHub Actions for continuous integration and deployment:

### Workflows

1. **CI/CD Pipeline** (`.github/workflows/ci.yml`)
   - Runs on push to main and claude/* branches
   - Type checking with TypeScript
   - Unit tests with Vitest
   - Coverage reporting to Codecov
   - Builds web app and CLI
   - **Auto-retry logic**: 3 attempts for build failures with progressive cleanup
   - **Build verification**: Validates dist artifacts before deployment
   - **Deployment retry**: 3 attempts with exponential backoff (30s, 60s)
   - **Health checks**: Verifies site accessibility after deployment (3 attempts)
   - **Smoke tests**: Validates CSS, JavaScript, and response time
   - **Content verification**: Ensures critical page elements are present

2. **Test Iteration** (`.github/workflows/test-iteration.yml`)
   - Fast feedback for development branches
   - Quick test suite
   - CLI command testing
   - Multi-OS build verification (Ubuntu, Windows, macOS)
   - Multi-Node version testing (18, 20)

3. **Deployment Monitor** (`.github/workflows/monitor.yml`)
   - Runs every 15 minutes via cron schedule
   - Continuous health monitoring of live site
   - Response time tracking
   - Content integrity checks
   - **Auto-creates GitHub issue** if site is down
   - Manual trigger available via workflow_dispatch

4. **Rollback Workflow** (`.github/workflows/rollback.yml`)
   - Manual rollback to previous deployment
   - Specify commit SHA or rollback to HEAD~1
   - Builds and deploys previous version
   - Verifies rollback deployment
   - Triggered manually via GitHub Actions UI

### GitHub Pages Deployment

The web app is automatically deployed to GitHub Pages on every push to main:

1. Push changes to main branch
2. GitHub Actions builds the app
3. Deployed to: https://colindacity.github.io/ficalc/

To enable GitHub Pages for your fork:
1. Go to Settings > Pages
2. Set Source to "GitHub Actions"
3. Push to main branch

### Coverage Reporting

Test coverage is automatically uploaded to Codecov. View the coverage report at:
https://codecov.io/gh/colindacity/ficalc

### Deployment Monitoring & Reliability

The CI/CD pipeline includes comprehensive monitoring and auto-recovery:

**Auto-Retry Logic:**
- Build failures: 3 attempts with progressive cleanup
  1. Clean Vite cache and retry
  2. Full clean (dist + node_modules) and reinstall
  3. Final attempt with fresh dependencies
- Deployment failures: 3 attempts with exponential backoff
  1. Immediate retry
  2. Wait 30s, retry
  3. Wait 60s, final attempt

**Health Verification:**
- 60s wait for CDN propagation
- 3 health check attempts
- HTTP status code validation
- Content integrity verification
- Response time monitoring
- CSS/JavaScript resource validation

**Continuous Monitoring:**
- Automated health checks every 15 minutes
- Site availability monitoring
- Performance tracking
- Auto-creates GitHub issue if site goes down

**Rollback Capability:**
- Manual rollback workflow available
- Go to Actions → Rollback Deployment
- Choose commit or use previous version
- Automated build and deployment of rollback version

**Viewing Deployment Status:**
```bash
# Check latest deployment
curl -I https://colindacity.github.io/ficalc/

# View in GitHub
# Go to: Settings > Pages > View deployment history
```

## Usage

### Basic Retirement Simulation

1. **Configure Your Scenario**:
   - Set retirement length (e.g., 30 years)
   - Enter initial portfolio size
   - Choose asset allocation (e.g., 80% stocks, 15% bonds, 5% cash)
   - Select withdrawal strategy and amount

2. **Run Backtesting**:
   - Click "Calculate" to run simulations
   - The calculator will simulate your retirement starting from every possible historical year
   - View success rates and statistics

3. **Analyze Results**:
   - See overall success rate across all scenarios
   - View portfolio end values and withdrawal amounts
   - Click on any year to see detailed year-by-year breakdown

### Example: The 4% Rule

To test the famous 4% rule:
1. Set initial portfolio: $1,000,000
2. Set retirement length: 30 years
3. Choose "Constant Dollar" withdrawal: $40,000/year
4. Asset allocation: 80% equities, 15% bonds, 5% cash
5. Run calculation

The results will show you the historical success rate of this strategy and where it would have failed.

### Objective Functions

#### How much portfolio do I need for $X withdrawal?
1. Select objective: "Portfolio Needed for Withdrawal"
2. Enter target withdrawal amount
3. Configure withdrawal strategy and retirement length
4. Run calculation to find the required portfolio size

#### What's the maximum I can withdraw from $Y portfolio?
1. Select objective: "Max Withdrawal from Portfolio"
2. Enter initial portfolio size
3. Configure withdrawal strategy and retirement length
4. Run calculation to find sustainable withdrawal amounts at various confidence levels

## Technical Details

### Architecture
- **Frontend**: React + TypeScript
- **Build Tool**: Vite
- **Charts**: Recharts
- **Data Parsing**: PapaParse

### Project Structure
```
src/
├── engine/
│   ├── backtester.ts      # Main backtesting engine and objective solvers
│   └── simulator.ts        # Individual simulation runner
├── utils/
│   ├── dataParser.ts       # Shiller data parsing and conversion
│   ├── taxes.ts            # Tax calculations
│   └── withdrawalStrategies.ts  # Withdrawal strategy implementations
├── components/
│   ├── ConfigPanel.tsx     # Configuration UI
│   ├── ResultsPanel.tsx    # Results summary display
│   └── SimulationDetail.tsx # Individual simulation details
├── types.ts                # TypeScript type definitions
├── App.tsx                 # Main application component
└── main.tsx                # Application entry point

data/
└── shiller-data.csv        # Historical market data
```

### Data Format

The Shiller CSV follows this format:
```csv
Date,Price,Dividend,Earnings,CPI,Long_Rate,Real_Price,Real_Dividend,Real_Earnings,CAPE
1871.01,4.44,0.26,0.40,12.46,5.32,89.47,5.23,8.06,
1871.02,4.50,0.26,0.40,12.84,5.32,88.02,5.09,7.83,
...
```

### Calculations

**Inflation**: Calculated from CPI year-over-year changes
**Stock Returns**: Capital appreciation + dividend yield
**Bond Returns**: Approximated from long-term interest rates
**Real Dollars**: Nominal amounts adjusted by cumulative inflation factor

## Customization

### Adding Your Own Data

1. Prepare a CSV file in the Shiller format (see data/shiller-data.csv)
2. Use the "Upload Custom Data" button in the configuration panel
3. The calculator will parse and use your data for simulations

### Modifying Tax Rules

Edit `src/utils/taxes.ts` to:
- Add more states
- Update tax brackets
- Adjust capital gains rates
- Modify standard deductions

### Adding Withdrawal Strategies

Edit `src/utils/withdrawalStrategies.ts` to implement new strategies:
```typescript
export function calculateWithdrawal(
  config: WithdrawalConfig,
  portfolio: number,
  yearData: YearlyData,
  previousWithdrawal: number,
  yearsRemaining: number
): number {
  // Your strategy implementation
}
```

## Limitations

- Cash returns use a fixed rate (default 1.5%) rather than historical rates
- Tax calculations assume a 50/50 split between ordinary income and capital gains
- Accumulation phase calculations use simplified formulas
- Does not account for Social Security or pensions
- Washington state only for now (though it has no state income tax)

## Future Enhancements

- [ ] Add more states with state income tax
- [ ] Implement accumulation phase simulations
- [ ] Add Social Security modeling
- [ ] Support for Roth vs Traditional IRA tax treatment
- [ ] More sophisticated bond return calculations
- [ ] Historical cash rate data
- [ ] Export results to CSV/PDF
- [ ] Save/load scenarios
- [ ] Compare multiple scenarios side-by-side

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT

## Credits

- Historical data compiled by Robert Shiller (http://www.econ.yale.edu/~shiller/data.htm)
- Inspired by FI Calc and Personal Capital retirement calculators
- Built with React, TypeScript, and Vite

## References

- [The Shiller CAPE Ratio](http://www.econ.yale.edu/~shiller/data.htm)
- [The 4% Rule (Bengen)](https://www.retailinvestor.org/pdf/Bengen1.pdf)
- [The Trinity Study](https://www.onefpa.org/journal/Pages/Portfolio%20Success%20Rates%20Where%20to%20Draw%20the%20Line.aspx)
- [CAPE-Based Withdrawal Strategy](https://earlyretirementnow.com/2017/03/15/the-ultimate-guide-to-safe-withdrawal-rates-part-10-cape-based-withdrawal-rates/)
