class MockSentimentDataService {
  constructor() {
    this.sentimentData = {
      social: {
        twitter: 65,
        reddit: 58,
        telegram: 62
      },
      news: {
        overall: 'mixed',
        bullish_count: 45,
        bearish_count: 35,
        neutral_count: 20
      },
      onChain: {
        exchange_flows: 'neutral',
        whale_activity: 'accumulating',
        retail_activity: 'moderate'
      }
    };
  }

  async getSocialSentiment() {
    const sentiment = {
      ...this.sentimentData.social,
      overall: this.calculateOverallSentiment(),
      bitcoin: 'bullish',
      ethereum: 'neutral',
      trending_topics: await this.getTrendingTopics(),
      influencer_sentiment: await this.getInfluencerSentiment(),
      volume_24h: {
        twitter: Math.floor(Math.random() * 100000) + 50000,
        reddit: Math.floor(Math.random() * 50000) + 20000,
        telegram: Math.floor(Math.random() * 30000) + 10000
      },
      lastUpdate: new Date().toISOString()
    };
    
    return sentiment;
  }

  async getNewsSentiment() {
    return {
      ...this.sentimentData.news,
      headlines: await this.getTopHeadlines(),
      sentiment_score: this.calculateNewsSentimentScore(),
      key_narratives: [
        'Institutional adoption continues',
        'Regulatory clarity improving',
        'Macro headwinds persist',
        'Technology improvements accelerating'
      ],
      lastUpdate: new Date().toISOString()
    };
  }

  async getOnChainMetrics() {
    return {
      network_hash_rate: '450 EH/s',
      active_addresses: 950000,
      exchange_inflow: 12500,
      exchange_outflow: 17734,
      whale_activity: this.sentimentData.onChain.whale_activity,
      ...this.sentimentData.onChain,
      metrics: {
        btc_exchange_balance: '2.35M BTC',
        btc_exchange_netflow: '-5,234 BTC',
        eth_exchange_balance: '18.2M ETH',
        eth_exchange_netflow: '-12,456 ETH',
        large_transactions: 1234,
        active_addresses: 950000,
        nvt_ratio: 65,
        mvrv_ratio: 1.85
      },
      whale_transactions: await this.getWhaleTransactions(),
      lastUpdate: new Date().toISOString()
    };
  }

  async getFearGreedIndex() {
    const components = {
      volatility: 25,
      momentum: 60,
      social_media: 55,
      surveys: 45,
      dominance: 50,
      trends: 58
    };
    
    const overall = Math.floor(
      Object.values(components).reduce((a, b) => a + b, 0) / Object.keys(components).length
    );
    
    return {
      value: overall,
      classification: this.classifyFearGreed(overall),
      components,
      history: [
        { date: new Date(Date.now() - 86400000).toISOString(), value: overall - 5 },
        { date: new Date(Date.now() - 172800000).toISOString(), value: overall - 8 },
        { date: new Date(Date.now() - 259200000).toISOString(), value: overall - 3 }
      ],
      historical: {
        yesterday: overall - 5,
        last_week: overall - 8,
        last_month: overall + 12
      },
      lastUpdate: new Date().toISOString()
    };
  }

  async getTrendingTopics() {
    return [
      { topic: 'Bitcoin ETF', sentiment: 'bullish', mentions: 15234 },
      { topic: 'Ethereum 2.0', sentiment: 'neutral', mentions: 8932 },
      { topic: 'DeFi yields', sentiment: 'mixed', mentions: 6521 },
      { topic: 'Layer 2 scaling', sentiment: 'bullish', mentions: 5234 },
      { topic: 'Regulation', sentiment: 'bearish', mentions: 4821 }
    ];
  }

  async getInfluencerSentiment() {
    return {
      bullish: ['@analyst1', '@trader2', '@investor3'],
      bearish: ['@skeptic1', '@macro2'],
      neutral: ['@researcher1', '@academic2'],
      summary: 'Majority of influencers remain cautiously optimistic'
    };
  }

  async getTopHeadlines() {
    return [
      {
        headline: 'Major Bank Announces Crypto Trading Desk',
        sentiment: 'bullish',
        impact: 'high',
        source: 'Reuters'
      },
      {
        headline: 'Regulatory Framework Progress in EU',
        sentiment: 'neutral',
        impact: 'medium',
        source: 'Bloomberg'
      },
      {
        headline: 'DeFi Protocol Hack Raises Security Concerns',
        sentiment: 'bearish',
        impact: 'medium',
        source: 'CoinDesk'
      },
      {
        headline: 'Institutional Inflows Continue Despite Volatility',
        sentiment: 'bullish',
        impact: 'high',
        source: 'WSJ'
      }
    ];
  }

  async getWhaleTransactions() {
    return [
      {
        asset: 'BTC',
        amount: 1000,
        type: 'accumulation',
        from: 'Exchange',
        to: 'Cold Wallet',
        time: new Date(Date.now() - 3600000).toISOString()
      },
      {
        asset: 'ETH',
        amount: 5000,
        type: 'distribution',
        from: 'Whale Wallet',
        to: 'Exchange',
        time: new Date(Date.now() - 7200000).toISOString()
      },
      {
        asset: 'BTC',
        amount: 500,
        type: 'accumulation',
        from: 'Exchange',
        to: 'Unknown Wallet',
        time: new Date(Date.now() - 10800000).toISOString()
      }
    ];
  }

  async getMarketMomentum() {
    return {
      short_term: 'neutral',
      medium_term: 'bullish',
      long_term: 'bullish',
      momentum_score: 62,
      trend_strength: 'moderate',
      support_levels: {
        btc: [42000, 44000, 45500],
        eth: [2200, 2350, 2450]
      },
      resistance_levels: {
        btc: [47000, 48500, 50000],
        eth: [2600, 2750, 2900]
      },
      breakout_probability: 0.45,
      lastUpdate: new Date().toISOString()
    };
  }

  calculateOverallSentiment() {
    const avg = Object.values(this.sentimentData.social)
      .reduce((a, b) => a + b, 0) / Object.keys(this.sentimentData.social).length;
    
    if (avg > 70) return 'very bullish';
    if (avg > 55) return 'bullish';
    if (avg > 45) return 'neutral';
    if (avg > 30) return 'bearish';
    return 'very bearish';
  }

  calculateNewsSentimentScore() {
    const { bullish_count, bearish_count, neutral_count } = this.sentimentData.news;
    const total = bullish_count + bearish_count + neutral_count;
    
    if (total === 0) return 50;
    
    const score = ((bullish_count - bearish_count) / total) * 50 + 50;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  classifyFearGreed(value) {
    if (value < 20) return 'Extreme Fear';
    if (value < 40) return 'Fear';
    if (value < 60) return 'Neutral';
    if (value < 80) return 'Greed';
    return 'Extreme Greed';
  }
}

module.exports = MockSentimentDataService;