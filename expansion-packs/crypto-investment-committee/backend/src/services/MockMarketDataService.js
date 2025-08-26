class MockMarketDataService {
  constructor() {
    this.mockPrices = {
      'BTC': { 
        price: 45000, 
        change24h: -2.5,
        volume24h: 28500000000,
        marketCap: 880000000000,
        high24h: 46500,
        low24h: 44200
      },
      'ETH': { 
        price: 2500, 
        change24h: -3.2,
        volume24h: 15200000000,
        marketCap: 300000000000,
        high24h: 2650,
        low24h: 2420
      },
      'BNB': {
        price: 320,
        change24h: 1.5,
        volume24h: 890000000,
        marketCap: 49000000000,
        high24h: 328,
        low24h: 315
      },
      'SOL': {
        price: 95,
        change24h: -5.2,
        volume24h: 2100000000,
        marketCap: 40000000000,
        high24h: 102,
        low24h: 93
      },
      'ADA': {
        price: 0.58,
        change24h: -1.8,
        volume24h: 450000000,
        marketCap: 20000000000,
        high24h: 0.61,
        low24h: 0.57
      }
    };
    
    this.historicalData = this.generateHistoricalData();
  }

  async getPrice(symbol) {
    return this.mockPrices[symbol] || this.generateRandomPrice(symbol);
  }

  async getPrices(symbols) {
    const prices = {};
    for (const symbol of symbols) {
      prices[symbol] = await this.getPrice(symbol);
    }
    return prices;
  }

  async getMarketOverview() {
    const totalMarketCap = Object.values(this.mockPrices)
      .reduce((sum, coin) => sum + coin.marketCap, 0);
    
    const totalVolume = Object.values(this.mockPrices)
      .reduce((sum, coin) => sum + coin.volume24h, 0);
    
    const avgChange = Object.values(this.mockPrices)
      .reduce((sum, coin) => sum + coin.change24h, 0) / Object.keys(this.mockPrices).length;
    
    return {
      totalMarketCap,
      totalVolume24h: totalVolume,
      btcDominance: (this.mockPrices.BTC.marketCap / totalMarketCap) * 100,
      averageChange24h: avgChange,
      topGainers: this.getTopMovers('gainers'),
      topLosers: this.getTopMovers('losers'),
      timestamp: new Date().toISOString()
    };
  }

  async getHistoricalData(symbol, days = 7) {
    if (!this.historicalData[symbol]) {
      this.historicalData[symbol] = this.generateHistoricalDataForSymbol(symbol, days);
    }
    return this.historicalData[symbol].slice(-days);
  }

  async getTechnicalIndicators(symbol) {
    const basePrice = this.mockPrices[symbol]?.price || 100;
    
    return {
      rsi: this.calculateMockRSI(),
      macd: {
        value: (Math.random() - 0.5) * 10,
        signal: (Math.random() - 0.5) * 8,
        histogram: (Math.random() - 0.5) * 2
      },
      movingAverages: {
        sma20: basePrice * (1 + (Math.random() - 0.5) * 0.05),
        sma50: basePrice * (1 + (Math.random() - 0.5) * 0.08),
        sma200: basePrice * (1 + (Math.random() - 0.5) * 0.15)
      },
      bollinger: {
        upper: basePrice * 1.05,
        middle: basePrice,
        lower: basePrice * 0.95
      },
      volume: {
        current: this.mockPrices[symbol]?.volume24h || Math.random() * 1000000000,
        average: (this.mockPrices[symbol]?.volume24h || 1000000000) * 0.9
      }
    };
  }

  generateRandomPrice(symbol) {
    const basePrice = Math.random() * 100 + 1;
    return {
      price: basePrice,
      change24h: (Math.random() - 0.5) * 20,
      volume24h: Math.random() * 100000000,
      marketCap: basePrice * Math.random() * 1000000000,
      high24h: basePrice * 1.1,
      low24h: basePrice * 0.9
    };
  }

  generateHistoricalData() {
    const data = {};
    for (const symbol in this.mockPrices) {
      data[symbol] = this.generateHistoricalDataForSymbol(symbol, 30);
    }
    return data;
  }

  generateHistoricalDataForSymbol(symbol, days) {
    const basePrice = this.mockPrices[symbol]?.price || 100;
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const variance = (Math.random() - 0.5) * 0.1;
      const price = basePrice * (1 + variance);
      
      data.push({
        date: date.toISOString().split('T')[0],
        open: price * (1 + (Math.random() - 0.5) * 0.02),
        high: price * (1 + Math.random() * 0.03),
        low: price * (1 - Math.random() * 0.03),
        close: price,
        volume: Math.random() * 1000000000
      });
    }
    
    return data;
  }

  getTopMovers(type) {
    const sorted = Object.entries(this.mockPrices)
      .sort((a, b) => {
        if (type === 'gainers') {
          return b[1].change24h - a[1].change24h;
        }
        return a[1].change24h - b[1].change24h;
      })
      .slice(0, 3);
    
    return sorted.map(([symbol, data]) => ({
      symbol,
      price: data.price,
      change24h: data.change24h
    }));
  }

  calculateMockRSI() {
    const rsi = Math.random() * 100;
    if (rsi < 30) return Math.floor(rsi) + 20;
    if (rsi > 70) return Math.floor(rsi) - 20;
    return Math.floor(rsi);
  }
}

module.exports = MockMarketDataService;