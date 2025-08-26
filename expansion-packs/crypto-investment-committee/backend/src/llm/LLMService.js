const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const { BufferMemory } = require('langchain/memory');

class LLMService {
  constructor(config = {}) {
    this.model = config.model || process.env.OPENAI_MODEL || 'gpt-4';
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 1000;
    
    if (!this.apiKey) {
      console.warn('Warning: OPENAI_API_KEY not set. LLM features will be limited.');
    }
    
    this.llm = null;
    this.memories = new Map();
  }

  getLLM() {
    if (!this.llm && this.apiKey) {
      this.llm = new ChatOpenAI({
        openAIApiKey: this.apiKey,
        modelName: this.model,
        temperature: this.temperature,
        maxTokens: this.maxTokens
      });
    }
    return this.llm;
  }

  async generateResponse(prompt, options = {}) {
    try {
      const llm = this.getLLM();
      if (!llm) {
        return this.generateMockResponse(prompt);
      }
      
      const config = {
        temperature: options.temperature || this.temperature,
        maxTokens: options.maxTokens || this.maxTokens
      };
      
      const messages = [];
      
      if (options.systemMessage) {
        messages.push(new SystemMessage(options.systemMessage));
      }
      
      if (options.sessionId && this.memories.has(options.sessionId)) {
        const memory = this.memories.get(options.sessionId);
        const previousMessages = await memory.chatHistory.getMessages();
        messages.push(...previousMessages);
      }
      
      messages.push(new HumanMessage(prompt));
      
      const response = await llm.invoke(messages, config);
      
      if (options.sessionId) {
        const memory = this.getOrCreateMemory(options.sessionId);
        await memory.chatHistory.addUserMessage(prompt);
        await memory.chatHistory.addAIMessage(response.content);
      }
      
      return response.content;
    } catch (error) {
      console.error('LLM generation error:', error);
      return this.generateMockResponse(prompt);
    }
  }

  getOrCreateMemory(sessionId) {
    if (!this.memories.has(sessionId)) {
      this.memories.set(sessionId, new BufferMemory({
        returnMessages: true,
        memoryKey: 'history'
      }));
    }
    return this.memories.get(sessionId);
  }

  clearMemory(sessionId) {
    if (this.memories.has(sessionId)) {
      this.memories.delete(sessionId);
    }
  }

  generateMockResponse(prompt) {
    const promptLower = prompt.toLowerCase();
    
    if (promptLower.includes('bitcoin') || promptLower.includes('btc')) {
      return this.generateBitcoinAnalysis();
    }
    
    if (promptLower.includes('ethereum') || promptLower.includes('eth')) {
      return this.generateEthereumAnalysis();
    }
    
    if (promptLower.includes('risk')) {
      return this.generateRiskAnalysis();
    }
    
    if (promptLower.includes('portfolio')) {
      return this.generatePortfolioRecommendation();
    }
    
    return this.generateGenericAnalysis();
  }

  generateBitcoinAnalysis() {
    return `Bitcoin Analysis:

Current Price: $45,234 (Mock Data)
24h Change: -2.5%

Technical Indicators:
- RSI: 58 (Neutral)
- MACD: Bearish crossover
- Support: $44,000
- Resistance: $47,000

Market Sentiment: Mixed
- Institutional interest remains strong
- Regulatory clarity improving
- Network fundamentals solid

Recommendation: HOLD
- Wait for clearer directional signals
- Consider accumulation below $44,000
- Set stop-loss at $42,000

Confidence: Medium (65%)`;
  }

  generateEthereumAnalysis() {
    return `Ethereum Analysis:

Current Price: $2,456 (Mock Data)
24h Change: -3.2%

Technical Indicators:
- RSI: 45 (Oversold territory)
- Moving Averages: Below 50-day MA
- Support: $2,300
- Resistance: $2,600

Fundamental Factors:
- Network activity increasing
- DeFi TVL stable
- Layer 2 adoption growing

Recommendation: BUY (Small Position)
- Good entry point near support
- Dollar-cost average recommended
- Target: $2,800

Confidence: Medium-High (70%)`;
  }

  generateRiskAnalysis() {
    return `Risk Assessment:

Market Risks:
1. Volatility: HIGH - Expect 5-10% daily swings
2. Liquidity: MEDIUM - Major pairs have good depth
3. Regulatory: MEDIUM - Ongoing policy developments

Portfolio Risks:
- Concentration: Avoid >30% in single asset
- Correlation: BTC/ETH correlation at 0.85
- Leverage: Not recommended in current conditions

Mitigation Strategies:
- Diversify across 5-7 assets
- Keep 20-30% in stablecoins
- Use stop-losses on all positions
- Regular rebalancing (monthly)

Overall Risk Level: MEDIUM-HIGH`;
  }

  generatePortfolioRecommendation() {
    return `Portfolio Recommendation:

Suggested Allocation:
- Bitcoin (BTC): 35%
- Ethereum (ETH): 25%
- Stablecoins (USDC/USDT): 20%
- Large-cap Alts: 15%
- Small-cap/New Projects: 5%

Rebalancing Strategy:
- Review weekly
- Rebalance if any position >10% off target
- Take profits on >20% gains

Entry Strategy:
- Dollar-cost average over 4 weeks
- Buy dips on technical support levels
- Avoid FOMO buying on pumps

Exit Strategy:
- Set profit targets: +50% for alts, +30% for BTC/ETH
- Stop-losses: -15% for all positions
- Trail stops on winning positions

Expected Returns: 15-25% over 6 months
Risk Level: Medium`;
  }

  generateGenericAnalysis() {
    return `Market Analysis:

Current Market Conditions:
- Overall trend: Sideways consolidation
- Market cap: $1.65T (Mock Data)
- Dominance: BTC 48%, ETH 19%

Key Observations:
- Institutional adoption continuing
- Regulatory environment evolving
- Technology improvements ongoing

Short-term Outlook:
- Expect continued volatility
- Watch key support/resistance levels
- Monitor macro economic factors

Recommendation:
- Maintain balanced approach
- Focus on quality projects
- Keep some dry powder for opportunities

This is a mock response for demonstration purposes.`;
  }

  async createAgentChain(agent, systemPrompt) {
    const llm = this.getLLM();
    if (!llm) {
      return {
        invoke: async (messages) => ({
          content: this.generateMockResponse(messages[messages.length - 1].content)
        })
      };
    }
    
    return {
      invoke: async (messages) => {
        const fullMessages = [
          new SystemMessage(systemPrompt),
          ...messages
        ];
        return await llm.invoke(fullMessages);
      }
    };
  }
}

module.exports = LLMService;