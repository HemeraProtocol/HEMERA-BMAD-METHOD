# Market Indicators Reference

## Overview
Real-time market indicators and metrics used by the investment committee for analysis and decision-making.

## Price Action Indicators

### Trend Indicators
- **Moving Averages**
  - 20-day MA: Short-term trend
  - 50-day MA: Medium-term trend  
  - 200-day MA: Long-term trend (bull/bear line)
  - Golden Cross: 50-day crosses above 200-day (bullish)
  - Death Cross: 50-day crosses below 200-day (bearish)

- **MACD (Moving Average Convergence Divergence)**
  - Signal Line Crossovers
  - Histogram momentum
  - Divergences with price

### Momentum Indicators
- **RSI (Relative Strength Index)**
  - Oversold: < 30
  - Neutral: 30-70
  - Overbought: > 70
  - Divergences signal reversals

- **Stochastic Oscillator**
  - %K and %D lines
  - Overbought > 80
  - Oversold < 20

### Volume Indicators
- **OBV (On-Balance Volume)**
  - Confirms price trends
  - Divergences signal weakness

- **Volume Profile**
  - Point of Control (POC)
  - Value Area High/Low
  - High Volume Nodes (HVN)

## On-Chain Indicators

### Bitcoin Specific
- **Hash Rate**
  - Network security measure
  - Miner confidence indicator
  - Capitulation/recovery signals

- **Network Difficulty**
  - Auto-adjusts every 2016 blocks
  - Indicates mining competition

- **MVRV (Market Value to Realized Value)**
  - < 1: Undervalued
  - > 3.5: Overvalued
  - Historical tops/bottoms

- **NUPL (Net Unrealized Profit/Loss)**
  - < 0: Capitulation
  - 0-0.25: Hope/Fear
  - 0.25-0.5: Optimism/Anxiety
  - 0.5-0.75: Belief/Denial
  - > 0.75: Euphoria/Greed

### Ethereum Specific
- **Gas Fees**
  - Network demand indicator
  - DeFi activity proxy
  - Bot activity levels

- **ETH 2.0 Staking**
  - Total ETH staked
  - Staking APY
  - Validator queue length

- **DeFi TVL**
  - Total Value Locked trends
  - Protocol distribution
  - Chain comparison

### Exchange Metrics
- **Exchange Reserves**
  - BTC/ETH on exchanges
  - Declining = bullish (hodling)
  - Rising = bearish (selling pressure)

- **Stablecoin Metrics**
  - USDT/USDC supply
  - Exchange stablecoin ratios
  - Stablecoin dominance

## Sentiment Indicators

### Fear & Greed Index Components
- **Volatility** (25%)
  - 30-day vs 90-day average
  
- **Market Momentum** (25%)
  - Current price vs moving averages
  
- **Social Media** (15%)
  - Twitter sentiment analysis
  - Reddit activity
  
- **Surveys** (15%)
  - Investor polls
  
- **Dominance** (10%)
  - Bitcoin dominance trends
  
- **Trends** (10%)
  - Google search trends

### Funding Rates
- **Perpetual Futures Funding**
  - Positive: Longs pay shorts (bullish bias)
  - Negative: Shorts pay longs (bearish bias)
  - Extreme rates signal reversals

### Options Market
- **Put/Call Ratio**
  - > 1: Bearish sentiment
  - < 0.7: Bullish sentiment
  
- **Implied Volatility**
  - Options pricing expectations
  - Volatility smile/skew
  
- **Max Pain**
  - Price where most options expire worthless
  - Potential magnet for price

## Macro Indicators

### Traditional Finance
- **DXY (Dollar Index)**
  - Inverse correlation with crypto
  - Strong dollar = crypto pressure
  
- **10-Year Treasury Yield**
  - Risk-free rate benchmark
  - Rising yields = risk-off
  
- **VIX (Volatility Index)**
  - "Fear gauge" for stocks
  - High VIX often = crypto selloff

- **S&P 500 / NASDAQ**
  - Risk asset correlation
  - Tech stock performance

### Commodities
- **Gold**
  - Store of value competitor
  - Inflation hedge comparison
  
- **Oil**
  - Economic growth indicator
  - Inflation expectations

### Economic Data
- **CPI/Inflation**
  - Fed policy driver
  - Real yield calculations
  
- **Employment Data**
  - Economic strength
  - Fed decision influence
  
- **GDP Growth**
  - Recession risks
  - Risk appetite driver

## Technical Patterns

### Chart Patterns
- **Support/Resistance**
  - Historical price levels
  - Psychological numbers ($10k, $50k)
  - Previous ATH levels

- **Trend Lines**
  - Ascending/Descending channels
  - Triangle patterns
  - Wedge formations

- **Fibonacci Levels**
  - 0.236, 0.382, 0.5, 0.618, 0.786
  - Extension levels: 1.272, 1.618, 2.618

## Risk Indicators

### Volatility Metrics
- **Historical Volatility**
  - 30-day, 60-day, 90-day
  - Annualized calculations
  
- **ATR (Average True Range)**
  - Daily range expectations
  - Position sizing tool

- **Bollinger Bands**
  - 2 standard deviations
  - Squeeze patterns
  - Band walks

### Correlation Metrics
- **BTC Correlation Matrix**
  - ETH correlation: Usually 0.7-0.9
  - Alt correlations: Variable
  - Traditional assets: Increasing

- **Rolling Correlations**
  - 30-day windows
  - Regime changes
  - Decoupling events

## Alert Thresholds

### Critical Levels
- **RSI**: < 30 or > 70
- **MVRV**: < 1 or > 3.5
- **Fear & Greed**: < 20 or > 80
- **Funding Rates**: > 0.1% or < -0.05%
- **Exchange Reserves**: 20% change in 7 days
- **Hash Rate**: 20% drop in 7 days

### Warning Signals
- Volume divergence from price
- Multiple timeframe divergences
- Extreme sentiment readings
- Unusual options activity
- Whale wallet movements
- Exchange anomalies

## Data Sources

### Primary Sources
- **Price/Volume**: Binance, Coinbase, Kraken
- **On-Chain**: Glassnode, CryptoQuant, Santiment
- **DeFi**: DeFiLlama, Dune Analytics
- **Sentiment**: Alternative.me, Santiment
- **Options**: Deribit, LedgerX, CME

### Update Frequencies
- Price/Volume: Real-time
- On-Chain: Hourly
- Sentiment: Daily
- Macro: As released
- Options: Every 15 minutes