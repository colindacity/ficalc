# FI Calc - Quick Start Guide

Get up and running with FI Calc in minutes!

## 🚀 Quick Start

### Web Interface (Recommended for Beginners)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the dev server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   Navigate to `http://localhost:5173`

4. **Try a simulation:**
   - Set initial portfolio: $1,000,000
   - Set annual withdrawal: $40,000
   - Set retirement length: 30 years
   - Click "Calculate"

### CLI (For Power Users & Automation)

1. **Basic simulation:**
   ```bash
   npm run cli -- simulate --portfolio 1000000 --withdrawal 40000 --years 30
   ```

2. **Find required portfolio:**
   ```bash
   npm run cli -- required-portfolio --withdrawal 50000 --years 30
   ```

3. **Find max withdrawal:**
   ```bash
   npm run cli -- max-withdrawal --portfolio 2000000 --years 30
   ```

## 📊 Example Scenarios

### The 4% Rule Test
Test the famous 4% rule with historical data:

```bash
npm run cli -- simulate \
  --portfolio 1000000 \
  --withdrawal 40000 \
  --years 30 \
  --equities 80 \
  --bonds 15 \
  --cash 5
```

**Expected Result:** ~95% success rate across historical scenarios

### Early Retirement (50 years)

```bash
npm run cli -- simulate \
  --portfolio 2000000 \
  --withdrawal 60000 \
  --years 50 \
  --equities 70 \
  --bonds 25 \
  --cash 5
```

### Conservative Portfolio

```bash
npm run cli -- max-withdrawal \
  --portfolio 1500000 \
  --years 30 \
  --equities 50 \
  --bonds 40 \
  --cash 10 \
  --success-rate 99
```

## 🧪 Running Tests

### All Tests
```bash
npm test
```

### With Coverage
```bash
npm run test:coverage
```

### Interactive UI
```bash
npm run test:ui
```

### Watch Mode (for development)
```bash
npm test -- --watch
```

## 🏗️ Building for Production

### Web App
```bash
npm run build
npm run preview  # Preview the build
```

### CLI Tool
```bash
npm run build:cli
node dist-cli/cli.js --help
```

## 🔄 CI/CD Workflow

The project automatically:

1. **On every push to claude/* branches:**
   - Runs type checking
   - Executes all tests
   - Generates coverage reports
   - Builds for multiple OS/Node versions

2. **On push to main branch:**
   - All of the above, plus:
   - Deploys to GitHub Pages
   - Updates coverage on Codecov

## 📈 Understanding Results

### Success Rate
- **>95%**: Very safe withdrawal rate
- **90-95%**: Safe for most scenarios
- **80-90%**: Moderate risk
- **<80%**: Higher risk of running out

### Portfolio Status
- **Success**: Portfolio lasted entire retirement
- **Nearly Failed**: Final value < 35% of initial
- **Failed**: Portfolio exhausted
- **Large End**: Final value > 300% of initial

### Real Dollars
All amounts are shown in "today's dollars" adjusted for actual historical inflation rates.

## 🎯 Common Use Cases

### 1. Am I ready to retire?
```bash
npm run cli -- simulate \
  --portfolio YOUR_PORTFOLIO \
  --withdrawal YOUR_PLANNED_SPENDING \
  --years EXPECTED_RETIREMENT_LENGTH
```

### 2. How much do I need to save?
```bash
npm run cli -- required-portfolio \
  --withdrawal YOUR_DESIRED_SPENDING \
  --years EXPECTED_RETIREMENT_LENGTH
```

### 3. How much can I safely spend?
```bash
npm run cli -- max-withdrawal \
  --portfolio YOUR_PORTFOLIO \
  --years EXPECTED_RETIREMENT_LENGTH \
  --success-rate 95
```

### 4. Compare different allocations
Run simulations with different equity/bond/cash ratios:

```bash
# Aggressive (80/15/5)
npm run cli -- simulate -p 1000000 -w 40000 -e 80 -b 15 -c 5

# Moderate (60/30/10)
npm run cli -- simulate -p 1000000 -w 40000 -e 60 -b 30 -c 10

# Conservative (40/50/10)
npm run cli -- simulate -p 1000000 -w 40000 -e 40 -b 50 -c 10
```

## 🛠️ Troubleshooting

### "Command not found: npm"
Install Node.js from https://nodejs.org/

### Tests failing
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm test
```

### Build errors
```bash
# Check TypeScript
npx tsc --noEmit

# Rebuild
npm run build
```

### CLI not working
```bash
# Make sure you have ts-node
npm install

# Try with explicit node
node --loader ts-node/esm src/cli.ts --help
```

## 📚 Next Steps

1. **Read the full README.md** for detailed documentation
2. **Check CONTRIBUTING.md** if you want to contribute
3. **Explore the code** in `src/` directory
4. **Try different scenarios** with the CLI
5. **View individual simulations** by clicking years in the web UI

## 💡 Tips

- Start with the web interface to understand how it works
- Use CLI for automation and batch processing
- Export results as JSON for further analysis: `--json > results.json`
- Use `--start-year` and `--end-year` to focus on specific historical periods
- Try different withdrawal strategies beyond constant dollar

## 🤝 Getting Help

- **Issues**: https://github.com/colindacity/ficalc/issues
- **Discussions**: https://github.com/colindacity/ficalc/discussions
- **Documentation**: Full README.md in the repository

Happy calculating! 🎉
