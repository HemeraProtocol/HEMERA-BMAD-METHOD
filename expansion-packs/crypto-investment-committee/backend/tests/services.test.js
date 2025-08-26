const MockMarketDataService = require('../src/services/MockMarketDataService');
const MockMacroDataService = require('../src/services/MockMacroDataService');
const MockSentimentDataService = require('../src/services/MockSentimentDataService');
const ContextBuilder = require('../src/services/ContextBuilder');

describe('MockMarketDataService', () => {
  let service;

  beforeEach(() => {
    service = new MockMarketDataService();
  });

  describe('getPrice', () => {
    it('should return price data for known symbols', async () => {
      const btcPrice = await service.getPrice('BTC');
      expect(btcPrice).toHaveProperty('price');
      expect(btcPrice).toHaveProperty('change24h');
      expect(btcPrice).toHaveProperty('volume24h');
      expect(btcPrice).toHaveProperty('marketCap');
      expect(btcPrice.price).toBe(45000);
    });

    it('should generate random price for unknown symbols', async () => {
      const randomPrice = await service.getPrice('UNKNOWN');
      expect(randomPrice).toHaveProperty('price');
      expect(randomPrice).toHaveProperty('change24h');
      expect(randomPrice.price).toBeGreaterThan(0);
    });
  });

  describe('getPrices', () => {
    it('should return multiple prices', async () => {
      const prices = await service.getPrices(['BTC', 'ETH']);
      expect(prices).toHaveProperty('BTC');
      expect(prices).toHaveProperty('ETH');
      expect(prices.BTC.price).toBe(45000);
      expect(prices.ETH.price).toBe(2500);
    });
  });

  describe('getMarketOverview', () => {
    it('should return market overview', async () => {
      const overview = await service.getMarketOverview();
      expect(overview).toHaveProperty('totalMarketCap');
      expect(overview).toHaveProperty('totalVolume24h');
      expect(overview).toHaveProperty('btcDominance');
      expect(overview).toHaveProperty('averageChange24h');
      expect(overview).toHaveProperty('topGainers');
      expect(overview).toHaveProperty('topLosers');
      expect(overview.btcDominance).toBeGreaterThan(0);
      expect(overview.btcDominance).toBeLessThan(100);
    });
  });

  describe('getTechnicalIndicators', () => {
    it('should return technical indicators', async () => {
      const indicators = await service.getTechnicalIndicators('BTC');
      expect(indicators).toHaveProperty('rsi');
      expect(indicators).toHaveProperty('macd');
      expect(indicators).toHaveProperty('movingAverages');
      expect(indicators).toHaveProperty('bollinger');
      expect(indicators).toHaveProperty('volume');
      expect(indicators.rsi).toBeGreaterThanOrEqual(0);
      expect(indicators.rsi).toBeLessThanOrEqual(100);
    });
  });

  describe('getHistoricalData', () => {
    it('should return historical data', async () => {
      const history = await service.getHistoricalData('BTC', 7);
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(7);
      
      const day = history[0];
      expect(day).toHaveProperty('date');
      expect(day).toHaveProperty('open');
      expect(day).toHaveProperty('high');
      expect(day).toHaveProperty('low');
      expect(day).toHaveProperty('close');
      expect(day).toHaveProperty('volume');
    });
  });
});

describe('MockMacroDataService', () => {
  let service;

  beforeEach(() => {
    service = new MockMacroDataService();
  });

  describe('getInterestRates', () => {
    it('should return interest rates data', async () => {
      const rates = await service.getInterestRates();
      expect(rates).toHaveProperty('fed_funds_rate');
      expect(rates).toHaveProperty('us_10year');
      expect(rates).toHaveProperty('us_2year');
      expect(rates).toHaveProperty('real_yield');
      expect(rates.fed_funds_rate).toBeGreaterThan(0);
    });
  });

  describe('getInflationData', () => {
    it('should return inflation data', async () => {
      const inflation = await service.getInflationData();
      expect(inflation).toHaveProperty('cpi_yoy');
      expect(inflation).toHaveProperty('core_cpi_yoy');
      expect(inflation).toHaveProperty('pce_yoy');
      expect(inflation.cpi_yoy).toBeGreaterThan(0);
    });
  });

  describe('getRiskIndicators', () => {
    it('should return risk indicators', async () => {
      const risks = await service.getRiskIndicators();
      expect(risks).toHaveProperty('vix');
      expect(risks).toHaveProperty('term_spread');
      expect(risks).toHaveProperty('credit_spread');
      expect(risks).toHaveProperty('fear_greed');
      expect(risks.vix).toBeGreaterThan(0);
      expect(risks.fear_greed).toBeGreaterThanOrEqual(0);
      expect(risks.fear_greed).toBeLessThanOrEqual(100);
    });
  });

  describe('getMarketRegime', () => {
    it('should return market regime analysis', async () => {
      const regime = await service.getMarketRegime();
      expect(regime).toHaveProperty('regime');
      expect(regime).toHaveProperty('confidence');
      expect(regime).toHaveProperty('signals');
      expect(regime).toHaveProperty('recommendations');
      expect(['risk-on', 'risk-off', 'neutral']).toContain(regime.regime);
    });
  });
});

describe('MockSentimentDataService', () => {
  let service;

  beforeEach(() => {
    service = new MockSentimentDataService();
  });

  describe('getSocialSentiment', () => {
    it('should return social sentiment data', async () => {
      const sentiment = await service.getSocialSentiment();
      expect(sentiment).toHaveProperty('overall');
      expect(sentiment).toHaveProperty('bitcoin');
      expect(sentiment).toHaveProperty('ethereum');
      expect(sentiment).toHaveProperty('volume_24h');
      expect(['bullish', 'bearish', 'neutral']).toContain(sentiment.overall);
    });
  });

  describe('getFearGreedIndex', () => {
    it('should return fear and greed index', async () => {
      const index = await service.getFearGreedIndex();
      expect(index).toHaveProperty('value');
      expect(index).toHaveProperty('classification');
      expect(index).toHaveProperty('history');
      expect(index.value).toBeGreaterThanOrEqual(0);
      expect(index.value).toBeLessThanOrEqual(100);
    });
  });

  describe('getOnChainMetrics', () => {
    it('should return on-chain metrics', async () => {
      const metrics = await service.getOnChainMetrics();
      expect(metrics).toHaveProperty('network_hash_rate');
      expect(metrics).toHaveProperty('active_addresses');
      expect(metrics).toHaveProperty('exchange_inflow');
      expect(metrics).toHaveProperty('exchange_outflow');
      expect(metrics).toHaveProperty('whale_activity');
    });
  });

  describe('getMarketMomentum', () => {
    it('should return market momentum', async () => {
      const momentum = await service.getMarketMomentum();
      expect(momentum).toHaveProperty('momentum_score');
      expect(momentum).toHaveProperty('short_term');
      expect(momentum).toHaveProperty('medium_term');
      expect(momentum).toHaveProperty('long_term');
      expect(momentum.momentum_score).toBeGreaterThanOrEqual(-100);
      expect(momentum.momentum_score).toBeLessThanOrEqual(100);
    });
  });
});

describe('ContextBuilder', () => {
  let builder;

  beforeEach(() => {
    builder = new ContextBuilder();
  });

  describe('buildContext', () => {
    it('should build complete context', async () => {
      const context = await builder.buildContext();
      expect(context).toHaveProperty('timestamp');
      expect(context).toHaveProperty('market');
      expect(context).toHaveProperty('macro');
      expect(context).toHaveProperty('sentiment');
      expect(context).toHaveProperty('analysis');
    });

    it('should allow selective context building', async () => {
      const context = await builder.buildContext({
        includeMarket: true,
        includeMacro: false,
        includeSentiment: false
      });
      
      expect(context.market).toBeDefined();
      expect(Object.keys(context.market).length).toBeGreaterThan(0);
      expect(Object.keys(context.macro).length).toBe(0);
      expect(Object.keys(context.sentiment).length).toBe(0);
    });

    it('should include trends when requested', async () => {
      const context = await builder.buildContext({ includeTrends: true });
      expect(context).toHaveProperty('trends');
      expect(context.trends).toHaveProperty('priceHistory');
      expect(context.trends).toHaveProperty('upcomingEvents');
      expect(context.trends).toHaveProperty('trendAnalysis');
    });
  });

  describe('analysis summary', () => {
    it('should generate analysis summary', async () => {
      const context = await builder.buildContext();
      expect(context.analysis).toHaveProperty('overallBias');
      expect(context.analysis).toHaveProperty('signals');
      expect(context.analysis).toHaveProperty('confidence');
      expect(context.analysis).toHaveProperty('keyRisks');
      expect(context.analysis).toHaveProperty('opportunities');
    });

    it('should identify key risks', async () => {
      const context = await builder.buildContext();
      const risks = context.analysis.keyRisks;
      expect(Array.isArray(risks)).toBe(true);
      expect(risks.length).toBeGreaterThan(0);
    });

    it('should identify opportunities', async () => {
      const context = await builder.buildContext();
      const opportunities = context.analysis.opportunities;
      expect(Array.isArray(opportunities)).toBe(true);
      expect(opportunities.length).toBeGreaterThan(0);
    });
  });

  describe('utility methods', () => {
    it('should calculate trend correctly', () => {
      const uptrend = [
        { close: 100 },
        { close: 105 },
        { close: 110 }
      ];
      
      const trend = builder.calculateTrend(uptrend);
      expect(trend).toBe('uptrend');
    });

    it('should find support and resistance', () => {
      const history = [
        { high: 110, low: 90 },
        { high: 105, low: 95 },
        { high: 108, low: 92 }
      ];
      
      const support = builder.findSupport(history);
      const resistance = builder.findResistance(history);
      
      expect(support).toBeLessThan(resistance);
    });
  });
});