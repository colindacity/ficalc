# Contributing to FI Calc

Thank you for your interest in contributing to FI Calc! This document provides guidelines and instructions for contributing.

## Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ficalc.git
   cd ficalc
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running Tests

Always run tests before submitting a PR:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm run test:coverage
```

### Code Quality

1. **Type Safety**: Ensure all TypeScript types are correct
   ```bash
   npx tsc --noEmit
   ```

2. **Test Coverage**: Add tests for new features
   - Aim for >80% coverage on new code
   - All utility functions should have tests
   - Core engine functions must have tests

3. **Code Style**: Follow existing code patterns
   - Use TypeScript strict mode
   - Prefer functional programming patterns
   - Add JSDoc comments for complex functions

### Testing Strategy

- **Unit Tests**: Test individual functions and utilities
- **Integration Tests**: Test component interactions
- **End-to-End**: Manual testing of full workflows

Test files should be colocated with the code they test:
```
src/
├── utils/
│   ├── taxes.ts
│   └── taxes.test.ts
```

## Pull Request Process

1. **Update Documentation**: Add/update README if needed
2. **Add Tests**: Ensure new features have tests
3. **Run CI Checks**: All tests must pass
   ```bash
   npm test -- --run
   npx tsc --noEmit
   npm run build
   ```
4. **Write Clear Commit Messages**:
   ```
   feat: Add CAPE-based withdrawal strategy

   - Implement CAPE formula calculation
   - Add tests for edge cases
   - Update documentation
   ```
5. **Submit PR**: Provide clear description of changes

## CI/CD Pipeline

The project uses GitHub Actions for CI/CD:

### On Every Push
- Type checking
- Unit tests
- Build verification
- Coverage reporting

### On Main Branch
- Deploy to GitHub Pages
- Update coverage reports

## Adding New Features

### Adding a Withdrawal Strategy

1. Add strategy type to `src/types.ts`:
   ```typescript
   export type WithdrawalStrategy =
     | 'constantDollar'
     | 'yourNewStrategy';
   ```

2. Implement in `src/utils/withdrawalStrategies.ts`:
   ```typescript
   function calculateYourStrategy(...) {
     // Implementation
   }
   ```

3. Add tests in `src/utils/withdrawalStrategies.test.ts`

4. Update UI in `src/components/ConfigPanel.tsx`

### Adding Tax Support for New State

1. Add tax brackets to `src/utils/taxes.ts`:
   ```typescript
   const NY_STATE_BRACKETS: TaxBracket[] = [
     { min: 0, max: 8500, rate: 0.04 },
     // ... more brackets
   ];
   ```

2. Update `getTaxConfig()` function

3. Add tests for new state

4. Update documentation

## Project Structure

```
ficalc/
├── .github/
│   └── workflows/        # CI/CD workflows
├── data/
│   └── shiller-data.csv  # Historical market data
├── src/
│   ├── components/       # React components
│   ├── engine/          # Backtesting engine
│   ├── utils/           # Utility functions
│   ├── types.ts         # TypeScript types
│   ├── cli.ts           # CLI interface
│   └── App.tsx          # Main app component
├── tests/               # Additional test files
└── docs/                # Documentation

```

## Code Review Guidelines

When reviewing PRs, check for:

- ✅ Tests added for new features
- ✅ TypeScript types are correct
- ✅ Code follows existing patterns
- ✅ Documentation is updated
- ✅ No console.log statements (use proper logging)
- ✅ Error handling is appropriate
- ✅ Performance considerations for large datasets

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create git tag: `git tag v1.x.x`
4. Push tag: `git push origin v1.x.x`
5. GitHub Actions will build and publish

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
