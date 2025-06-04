# TradeRisk Pro - Margin Trading Calculator

A comprehensive swing trading application with advanced margin calculations, risk analysis, and interactive charts. Built specifically for traders using Robinhood Gold's margin trading features.

## Features

### 🔍 Stock Search & Analysis
- Real-time stock search with autocomplete
- Comprehensive stock information display
- Yahoo Finance integration for market data
- Key metrics: P/E ratio, market cap, volume, 52-week range, beta, and more

### 📊 Interactive Charts
- Historical price charts with multiple timeframes (1M, 3M, 6M, 1Y)
- Visual entry/exit strategy overlay
- Stop loss and take profit reference lines
- Interactive tooltips with detailed price and volume data

### 💰 Advanced Margin Calculator
- Real-time Robinhood Gold margin interest calculations
- Position sizing with margin ratio control
- Entry/exit price optimization
- Trade duration and interest cost analysis
- Margin call risk assessment
- ROI calculations (gross and net)

### ⚡ Risk Analysis
- Comprehensive profit/loss scenario modeling
- Interactive risk tolerance controls
- Visual P&L charts across price ranges
- Margin call indicators
- Risk/reward ratio calculations
- Maximum loss and gain projections

### 🛡️ Safety Features
- Margin call warnings
- Risk tolerance guidelines
- Educational content about margin trading
- Best practices and safety tips

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **API**: Next.js API routes with mock data (easily replaceable with real APIs)

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd trade-risk
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Search for a Stock**: Use the search bar to find stocks by symbol or company name
2. **Review Stock Information**: Analyze key metrics and current market data
3. **Set Trading Parameters**: Configure your investment amount, margin ratio, entry/exit prices
4. **Analyze Risk**: Review profit/loss scenarios and margin call risks
5. **Optimize Strategy**: Adjust parameters based on risk analysis

## Key Calculations

### Margin Interest
```
Daily Interest = (Margin Amount × Annual Rate) / 365
Total Interest = Daily Interest × Trade Duration (days)
```

### ROI Calculation
```
Gross P&L = (Exit Price - Entry Price) × Shares
Net P&L = Gross P&L - Margin Interest
ROI = (Net P&L / Own Cash) × 100
```

### Margin Call
```
Portfolio Value = Stock Price × Shares
Equity = Portfolio Value - Margin Used
Margin Call Triggered if: Equity < (Portfolio Value × 25%)
```

## Robinhood Gold Integration

The app is designed to work with Robinhood Gold's margin trading features:

- **Interest Rates**: 2.5% - 7.5% annual (based on account balance)
- **Maintenance Margin**: 25% requirement
- **Instant Deposits**: Up to $50,000
- **Real-time Data**: Level II market data support

## Data Sources

**Real-time data integration:**

- **Yahoo Finance API** for real-time stock quotes and search
- **Yahoo Finance Historical API** for price charts and historical data
- **Robinhood Gold margin rates** built into calculations (7.5% annual)

## File Structure

```
trade-risk/
├── app/
│   ├── api/stock/          # Stock data API routes
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main application page
├── components/
│   ├── MarginCalculator.tsx    # Margin trading calculator
│   ├── RiskAnalysis.tsx        # Risk analysis and scenarios
│   ├── StockChart.tsx          # Interactive price charts
│   ├── StockInfo.tsx           # Stock information display
│   └── StockSearch.tsx         # Stock search component
├── lib/
│   └── stockApi.ts         # API utilities and calculations
├── types/
│   └── stock.ts            # TypeScript type definitions
└── public/                 # Static assets
```

## Customization

### Real-time API Integration

The app now uses real Yahoo Finance APIs for all data:

```typescript
// Real Yahoo Finance integration already implemented
import yahooFinance from 'yahoo-finance2';

// Get real-time quotes
const quote = await yahooFinance.quote(symbol);

// Search stocks
const searchResults = await yahooFinance.search(query);

// Get historical data
const historical = await yahooFinance.historical(symbol, options);
```

### Updating Margin Rates

Modify the margin rate in `lib/stockApi.ts`:

```typescript
private static readonly ROBINHOOD_MARGIN_RATE = 0.075; // Update as needed
```

### Styling Customization

The app uses Tailwind CSS. Modify styles in:
- `tailwind.config.js` for theme configuration
- Component files for specific styling
- `app/globals.css` for global styles

## Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy to Vercel
```

### Other Platforms
```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Important Disclaimers

⚠️ **Risk Warning**: This application is for educational purposes only. Margin trading involves substantial risk and may not be suitable for all investors. You can lose more than your initial investment.

⚠️ **Not Financial Advice**: This tool does not constitute financial advice. Always consult with a qualified financial advisor before making investment decisions.

⚠️ **Data Accuracy**: Ensure all calculations and data sources are verified for accuracy before making trading decisions.

## License

MIT License - See LICENSE file for details

## Support

For questions or issues:
1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed information

---

**Disclaimer**: This project is not affiliated with Robinhood Financial LLC. All trademarks and company names are property of their respective owners. 