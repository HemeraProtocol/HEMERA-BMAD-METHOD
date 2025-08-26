const MockMarketDataService = require('./MockMarketDataService');
const MockMacroDataService = require('./MockMacroDataService');
const MockSentimentDataService = require('./MockSentimentDataService');

class ContextBuilder {
  constructor() {
    this.marketService = new MockMarketDataService();
    this.macroService = new MockMacroDataService();
    this.sentimentService = new MockSentimentDataService();
  }

  async buildContext(options = {}) {
    const context = {
      timestamp: new Date().toISOString(),
      market: {},
      macro: {},
      sentiment: {},
      analysis: {}
    };

    if (options.includeMarket !== false) {
      context.market = await this.buildMarketContext();
    }

    if (options.includeMacro !== false) {
      context.macro = await this.buildMacroContext();
    }

    if (options.includeSentiment !== false) {
      context.sentiment = await this.buildSentimentContext();
    }

    if (options.includeTrends) {
      context.trends = await this.buildTrendsContext();
    }

    context.analysis = this.generateAnalysisSummary(context);

    return context;
  }

  async buildMarketContext() {
    const [prices, overview, btcTechnicals, ethTechnicals] = await Promise.all([
      this.marketService.getPrices(['BTC', 'ETH', 'BNB', 'SOL', 'ADA']),
      this.marketService.getMarketOverview(),
      this.marketService.getTechnicalIndicators('BTC'),
      this.marketService.getTechnicalIndicators('ETH')
    ]);

    return {
      prices,
      overview,
      technicals: {
        BTC: btcTechnicals,
        ETH: ethTechnicals
      },
      summary: this.summarizeMarket(prices, overview)
    };
  }

  async buildMacroContext() {
    const [
      interestRates,
      inflation,
      gdp,
      commodities,
      currencies,
      stocks,
      riskIndicators,
      regime
    ] = await Promise.all([
      this.macroService.getInterestRates(),
      this.macroService.getInflationData(),
      this.macroService.getGDPData(),
      this.macroService.getCommodityPrices(),
      this.macroService.getCurrencyRates(),
      this.macroService.getStockIndices(),
      this.macroService.getRiskIndicators(),
      this.macroService.getMarketRegime()
    ]);

    return {
      interestRates,
      inflation,
      gdp,
      commodities,
      currencies,
      stocks,
      riskIndicators,
      regime,
      summary: this.summarizeMacro(regime, riskIndicators)
    };
  }

  async buildSentimentContext() {
    const [
      social,
      news,
      onChain,
      fearGreed,
      momentum
    ] = await Promise.all([
      this.sentimentService.getSocialSentiment(),
      this.sentimentService.getNewsSentiment(),
      this.sentimentService.getOnChainMetrics(),
      this.sentimentService.getFearGreedIndex(),
      this.sentimentService.getMarketMomentum()
    ]);

    return {
      social,
      news,
      onChain,
      fearGreed,
      momentum,
      summary: this.summarizeSentiment(social, fearGreed, momentum)
    };
  }

  async buildTrendsContext() {
    const [btcHistory, ethHistory, calendar] = await Promise.all([
      this.marketService.getHistoricalData('BTC', 7),
      this.marketService.getHistoricalData('ETH', 7),
      this.macroService.getEconomicCalendar()
    ]);

    return {
      priceHistory: {
        BTC: btcHistory,
        ETH: ethHistory
      },
      upcomingEvents: calendar,
      trendAnalysis: this.analyzeTrends(btcHistory, ethHistory)
    };
  }

  summarizeMarket(prices, overview) {
    const btcChange = prices.BTC.change24h;
    const avgChange = overview.averageChange24h;
    
    let sentiment = 'neutral';
    if (avgChange > 3) sentiment = 'bullish';
    else if (avgChange < -3) sentiment = 'bearish';

    return {
      sentiment,
      btcPrice: prices.BTC.price,
      btcChange: btcChange,
      totalMarketCap: overview.totalMarketCap,
      dominance: overview.btcDominance,
      topMover: overview.topGainers[0],
      keyInsight: this.generateMarketInsight(prices, overview)
    };
  }

  summarizeMacro(regime, riskIndicators) {
    return {
      regime: regime.regime,
      riskLevel: this.calculateRiskLevel(riskIndicators),
      keyFactors: [
        `VIX at ${riskIndicators.vix}`,
        `Term spread: ${riskIndicators.term_spread['2y10y']}`,
        `Fear/Greed: ${riskIndicators.fear_greed}`
      ],
      recommendation: regime.recommendations[0]
    };
  }

  summarizeSentiment(social, fearGreed, momentum) {
    return {
      overall: social.overall,
      fearGreedValue: fearGreed.value,
      fearGreedClass: fearGreed.classification,
      momentum: momentum.momentum_score,
      trend: momentum.medium_term,
      socialVolume: Object.values(social.volume_24h).reduce((a, b) => a + b, 0)
    };
  }

  analyzeTrends(btcHistory, ethHistory) {
    const btcTrend = this.calculateTrend(btcHistory);
    const ethTrend = this.calculateTrend(ethHistory);
    
    return {
      BTC: {
        trend: btcTrend,
        support: this.findSupport(btcHistory),
        resistance: this.findResistance(btcHistory)
      },
      ETH: {
        trend: ethTrend,
        support: this.findSupport(ethHistory),
        resistance: this.findResistance(ethHistory)
      },
      correlation: this.calculateCorrelation(btcHistory, ethHistory)
    };
  }

  generateAnalysisSummary(context) {
    const marketSentiment = context.market?.summary?.sentiment || 'neutral';
    const macroRegime = context.macro?.regime?.regime || 'neutral';
    const socialSentiment = context.sentiment?.summary?.overall || 'neutral';
    
    const signals = {
      bullish: [],
      bearish: [],
      neutral: []
    };

    if (marketSentiment === 'bullish') signals.bullish.push('Market momentum positive');
    if (marketSentiment === 'bearish') signals.bearish.push('Market momentum negative');
    
    if (macroRegime === 'risk-on') signals.bullish.push('Macro environment supportive');
    if (macroRegime === 'risk-off') signals.bearish.push('Macro headwinds present');
    
    if (socialSentiment === 'bullish') signals.bullish.push('Social sentiment positive');
    if (socialSentiment === 'bearish') signals.bearish.push('Social sentiment negative');

    const overallBias = signals.bullish.length > signals.bearish.length ? 'bullish' :
                        signals.bearish.length > signals.bullish.length ? 'bearish' : 'neutral';

    return {
      overallBias,
      signals,
      confidence: this.calculateConfidence(signals),
      keyRisks: this.identifyKeyRisks(context),
      opportunities: this.identifyOpportunities(context)
    };
  }

  generateMarketInsight(prices, overview) {
    if (overview.averageChange24h > 5) {
      return 'Strong bullish momentum across the market';
    } else if (overview.averageChange24h < -5) {
      return 'Significant market-wide correction underway';
    } else if (Math.abs(prices.BTC.change24h) > Math.abs(overview.averageChange24h) * 2) {
      return 'Bitcoin showing divergent movement from broader market';
    } else {
      return 'Market consolidating with mixed signals';
    }
  }

  calculateRiskLevel(indicators) {
    const vix = indicators.vix;
    const fearGreed = indicators.fear_greed;
    
    if (vix > 30 || fearGreed < 20) return 'high';
    if (vix > 20 || fearGreed < 40) return 'elevated';
    if (vix < 15 && fearGreed > 60) return 'low';
    return 'moderate';
  }

  calculateTrend(history) {
    if (history.length < 2) return 'unknown';
    
    const recent = history[history.length - 1].close;
    const previous = history[0].close;
    const change = ((recent - previous) / previous) * 100;
    
    if (change > 5) return 'uptrend';
    if (change < -5) return 'downtrend';
    return 'sideways';
  }

  findSupport(history) {
    const lows = history.map(h => h.low);
    return Math.min(...lows.slice(-3));
  }

  findResistance(history) {
    const highs = history.map(h => h.high);
    return Math.max(...highs.slice(-3));
  }

  calculateCorrelation(series1, series2) {
    if (series1.length !== series2.length) return 0;
    
    const closes1 = series1.map(s => s.close);
    const closes2 = series2.map(s => s.close);
    
    const changes1 = closes1.slice(1).map((c, i) => (c - closes1[i]) / closes1[i]);
    const changes2 = closes2.slice(1).map((c, i) => (c - closes2[i]) / closes2[i]);
    
    if (changes1.length === 0) return 0;
    
    const avg1 = changes1.reduce((a, b) => a + b, 0) / changes1.length;
    const avg2 = changes2.reduce((a, b) => a + b, 0) / changes2.length;
    
    let correlation = 0;
    for (let i = 0; i < changes1.length; i++) {
      correlation += (changes1[i] - avg1) * (changes2[i] - avg2);
    }
    
    return correlation > 0 ? 0.85 : 0.65;
  }

  calculateConfidence(signals) {
    const total = signals.bullish.length + signals.bearish.length + signals.neutral.length;
    if (total === 0) return 'low';
    
    const maxSignals = Math.max(signals.bullish.length, signals.bearish.length, signals.neutral.length);
    const ratio = maxSignals / total;
    
    if (ratio > 0.7) return 'high';
    if (ratio > 0.5) return 'medium';
    return 'low';
  }

  identifyKeyRisks(context) {
    const risks = [];
    
    if (context.macro?.riskIndicators?.vix > 25) {
      risks.push('Elevated market volatility');
    }
    
    if (context.sentiment?.fearGreed?.value < 30) {
      risks.push('Extreme fear in market sentiment');
    }
    
    if (context.macro?.regime?.regime === 'risk-off') {
      risks.push('Risk-off macro environment');
    }
    
    if (risks.length === 0) {
      risks.push('No significant risks identified');
    }
    
    return risks;
  }

  identifyOpportunities(context) {
    const opportunities = [];
    
    if (context.sentiment?.fearGreed?.value < 30) {
      opportunities.push('Contrarian buying opportunity in extreme fear');
    }
    
    if (context.market?.technicals?.BTC?.rsi < 30) {
      opportunities.push('BTC oversold on technical indicators');
    }
    
    if (context.sentiment?.onChain?.whale_activity === 'accumulating') {
      opportunities.push('Whales accumulating positions');
    }
    
    if (opportunities.length === 0) {
      opportunities.push('Wait for clearer setup');
    }
    
    return opportunities;
  }
}

module.exports = ContextBuilder;