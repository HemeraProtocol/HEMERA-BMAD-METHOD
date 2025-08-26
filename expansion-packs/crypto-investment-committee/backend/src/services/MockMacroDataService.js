class MockMacroDataService {
  constructor() {
    this.macroData = {
      interestRates: {
        fed: 5.25,
        ecb: 4.0,
        boj: -0.1,
        boe: 5.0
      },
      inflation: {
        us: 3.2,
        eu: 2.9,
        uk: 4.0,
        japan: 2.8
      },
      gdpGrowth: {
        us: 2.1,
        eu: 0.5,
        uk: 0.3,
        japan: 1.2,
        china: 5.2
      },
      unemployment: {
        us: 3.7,
        eu: 6.5,
        uk: 4.2,
        japan: 2.5
      },
      commodities: {
        gold: 2050,
        silver: 24.5,
        oil_wti: 78.5,
        oil_brent: 82.3,
        copper: 3.85,
        wheat: 580
      },
      currencies: {
        'EUR/USD': 1.0875,
        'GBP/USD': 1.2650,
        'USD/JPY': 148.50,
        'USD/CNY': 7.2850,
        'DXY': 103.45
      },
      stockIndices: {
        'SP500': 4550,
        'NASDAQ': 14250,
        'DOW': 35800,
        'DAX': 16200,
        'FTSE': 7600,
        'NIKKEI': 32500
      }
    };
  }

  async getInterestRates() {
    return {
      fed_funds_rate: this.macroData.interestRates.fed,
      us_10year: 4.25,
      us_2year: 4.70,
      real_yield: 1.85,
      ...this.macroData.interestRates,
      lastUpdate: new Date().toISOString(),
      trend: this.calculateTrend('rates')
    };
  }

  async getInflationData() {
    return {
      cpi_yoy: 3.1,
      core_cpi_yoy: 3.8,
      pce_yoy: 2.9,
      ...this.macroData.inflation,
      lastUpdate: new Date().toISOString(),
      trend: this.calculateTrend('inflation')
    };
  }

  async getGDPData() {
    return {
      ...this.macroData.gdpGrowth,
      global: 3.0,
      emerging: 4.2,
      developed: 1.8,
      lastUpdate: new Date().toISOString()
    };
  }

  async getCommodityPrices() {
    return {
      ...this.macroData.commodities,
      lastUpdate: new Date().toISOString(),
      correlations: {
        gold_btc: 0.42,
        oil_inflation: 0.65,
        dxy_gold: -0.58
      }
    };
  }

  async getCurrencyRates() {
    return {
      ...this.macroData.currencies,
      lastUpdate: new Date().toISOString(),
      volatility: {
        'EUR/USD': 8.5,
        'GBP/USD': 9.2,
        'USD/JPY': 11.3
      }
    };
  }

  async getStockIndices() {
    return {
      ...this.macroData.stockIndices,
      lastUpdate: new Date().toISOString(),
      correlations: {
        sp500_btc: 0.55,
        nasdaq_eth: 0.62,
        vix: 18.5
      }
    };
  }

  async getEconomicCalendar() {
    const events = [
      {
        date: new Date().toISOString(),
        event: 'FOMC Meeting Minutes',
        importance: 'HIGH',
        forecast: 'Hawkish',
        previous: 'Neutral'
      },
      {
        date: new Date(Date.now() + 86400000).toISOString(),
        event: 'US CPI Data',
        importance: 'HIGH',
        forecast: '3.2%',
        previous: '3.1%'
      },
      {
        date: new Date(Date.now() + 172800000).toISOString(),
        event: 'ECB Rate Decision',
        importance: 'HIGH',
        forecast: '4.0%',
        previous: '4.0%'
      },
      {
        date: new Date(Date.now() + 259200000).toISOString(),
        event: 'US Non-Farm Payrolls',
        importance: 'HIGH',
        forecast: '180K',
        previous: '175K'
      }
    ];
    
    return events;
  }

  async getRiskIndicators() {
    return {
      vix: 18.5,
      move: 95.2,
      credit_spread: 420,  // Adding single value for compatibility
      credit_spreads: {
        ig: 120,
        hy: 420
      },
      term_spread: {
        '2y10y': -0.45,
        '3m10y': -1.25
      },
      fear_greed: 42,
      dxy_strength: 'moderate',
      geopolitical_risk: 'elevated',
      lastUpdate: new Date().toISOString()
    };
  }

  async getMarketRegime() {
    const vix = 18.5;
    const termSpread = -0.45;
    const fearGreed = 42;
    
    let regime = 'neutral';
    let confidence = 'medium';
    
    if (vix > 25) {
      regime = 'risk-off';
      confidence = 'high';
    } else if (vix < 15 && fearGreed > 60) {
      regime = 'risk-on';
      confidence = 'high';
    } else if (termSpread < -1) {
      regime = 'recession-watch';
      confidence = 'medium';
    }
    
    return {
      regime,
      confidence,
      signals: {
        bullish: regime === 'risk-on' ? ['Low volatility', 'Strong momentum'] : [],
        bearish: regime === 'risk-off' ? ['High volatility', 'Risk aversion'] : [],
        neutral: regime === 'neutral' ? ['Mixed signals', 'Consolidation'] : []
      },
      indicators: {
        volatility: vix > 20 ? 'elevated' : 'normal',
        liquidity: 'adequate',
        momentum: 'mixed',
        sentiment: fearGreed < 30 ? 'fearful' : fearGreed > 70 ? 'greedy' : 'neutral'
      },
      recommendations: this.getRegimeRecommendations(regime)
    };
  }

  calculateTrend(type) {
    const trends = ['rising', 'stable', 'falling', 'volatile'];
    return trends[Math.floor(Math.random() * trends.length)];
  }

  getRegimeRecommendations(regime) {
    const recommendations = {
      'risk-on': [
        'Increase exposure to growth assets',
        'Consider higher beta cryptocurrencies',
        'Reduce hedges'
      ],
      'risk-off': [
        'Increase cash allocation',
        'Focus on blue-chip cryptocurrencies',
        'Consider defensive positions'
      ],
      'recession-watch': [
        'Maintain balanced portfolio',
        'Focus on quality over growth',
        'Keep some dry powder'
      ],
      'neutral': [
        'Stick to strategic allocation',
        'Regular rebalancing',
        'Monitor for regime changes'
      ]
    };
    
    return recommendations[regime] || recommendations.neutral;
  }
}

module.exports = MockMacroDataService;