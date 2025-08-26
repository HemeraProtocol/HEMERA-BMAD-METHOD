# Daily Market Analysis Task

Automated analysis of three daily questions with contextual agent activation.

```yaml
name: Daily Market Analysis
description: Analyzes daily market movements and provides actionable insights
version: 1.0.0
maxExecutionTime: 30 seconds
retry:
  maxAttempts: 2
  backoffMs: 1000
requirements:
  question: string
  ticker: string
  priceChange: number
  volume: number
  marketContext: object
```

## Process

### 1. **Market Context Gathering**
   - Fetch current BTC/ETH prices and 24h changes
   - Identify significant market events (>5% moves)
   - Check for major news or regulatory updates
   - Note any protocol-specific events
   - Determine market regime (bull/bear/crab)

### 2. **Question 1: Why is BTC/ETH up/down today?**
   
   **Agent Activation Logic**:
   ```
   IF price_change > 5%:
       activate: [market-sentiment, technical-analyst, relevant-macro, contrarian]
   ELIF technical_breakout:
       activate: [technical-analyst, market-sentiment, risk-manager]
   ELIF macro_event:
       activate: [relevant-macro-strategist, market-sentiment]
   ELSE:
       activate: [market-sentiment, technical-analyst]
   ```
   
   **Analysis Framework**:
   - Market Sentiment: Identify primary narrative driving movement
   - Technical Analyst: Confirm with chart patterns and indicators
   - Macro Strategist: Connect to broader economic events
   - Contrarian: Challenge the obvious explanation
   
   **Output Format**:
   ```
   "Market Movement Analysis:
   BTC: [+/-X%] driven primarily by [key factor]
   ETH: [+/-Y%] influenced by [key factor]
   
   Key Drivers:
   1. [Primary driver with evidence]
   2. [Secondary factor]
   3. [Supporting context]
   
   Committee Consensus: [Agreed explanation]
   Alternative View: [Contrarian perspective if relevant]"
   ```

### 3. **Question 2: Should I keep/buy/sell my portfolio?**
   
   **Agent Activation**:
   - Always: [risk-manager, technical-analyst, market-sentiment]
   - Conditional: [relevant domain expert based on holdings]
   
   **Decision Framework**:
   ```
   Risk Manager Assessment:
   - Current risk level: [1-10]
   - Portfolio exposure check
   - Volatility forecast
   
   Technical Analysis:
   - Trend status: [bullish/bearish/neutral]
   - Support/resistance levels
   - Entry/exit signals
   
   Market Sentiment:
   - Crowd positioning
   - Fear/greed index
   - Institutional flows
   ```
   
   **Output Format**:
   ```
   "Portfolio Recommendation:
   
   Action: [HOLD/ACCUMULATE/REDUCE/EXIT]
   Confidence: [X%]
   
   Rationale:
   - [Key reason 1]
   - [Key reason 2]
   - [Risk consideration]
   
   If BUYING:
   - Position size: [X% of portfolio]
   - Entry zone: [$X - $Y]
   - Stop loss: [$Z]
   
   If SELLING:
   - Reduce by: [X%]
   - Target: [$X]
   - Reasoning: [specific trigger]
   
   Risk Warning: [Key risk to monitor]"
   ```

### 4. **Question 3: Any new assets showing strong potential?**
   
   **Agent Activation**:
   - Always: [market-sentiment, risk-manager]
   - Based on findings: [eth-specialist, contrarian]
   
   **Opportunity Scan Framework**:
   ```
   Market Sentiment: 
   - Scan for emerging narratives
   - Volume/price divergences
   - Social sentiment shifts
   
   Risk Manager:
   - Evaluate risk/reward
   - Check correlation to existing portfolio
   - Assess liquidity and maturity
   
   Domain Experts:
   - Deep dive on specific opportunities
   - Technical evaluation
   - Team and fundamentals check
   ```
   
   **Output Format**:
   ```
   "Emerging Opportunities:
   
   Top Pick: [Asset/Narrative]
   - Why interesting: [Brief explanation]
   - Risk Level: [1-10]
   - Potential: [Conservative/Base/Optimistic scenarios]
   - Timeframe: [Short/Medium/Long term]
   
   Also Watching:
   1. [Asset 2] - [One line reason]
   2. [Asset 3] - [One line reason]
   
   Committee Note: [Any disagreements or cautions]"
   ```

### 5. **Final Daily Summary**
   
   **CIO Synthesis**:
   - Compile three question answers
   - Add market regime context
   - Highlight key action items
   - Set alerts for tomorrow
   
   **Output Format**:
   ```json
   {
     "date": "YYYY-MM-DD",
     "market_regime": "bull/bear/crab",
     "summary": {
       "market_movement": {
         "btc_change": "+X%",
         "eth_change": "+Y%",
         "primary_driver": "...",
         "confidence": 85
       },
       "portfolio_action": {
         "recommendation": "HOLD/BUY/SELL",
         "specific_actions": [...],
         "risk_level": 5,
         "confidence": 75
       },
       "opportunities": {
         "top_pick": {...},
         "watch_list": [...],
         "confidence": 70
       }
     },
     "action_items": [
       "Monitor X level on BTC",
       "Set alert for Y news",
       "Research Z opportunity"
     ],
     "next_update": "YYYY-MM-DD HH:MM UTC"
   }
   ```

## Required Inputs
- Current market prices (BTC, ETH, major alts)
- 24h price changes and volumes
- Recent news headlines
- Market sentiment indicators
- User portfolio context (if provided)

## Expected Outputs
- Clear answer to each daily question
- Actionable recommendations
- Risk assessments
- Confidence scores
- Structured JSON for frontend consumption

## Quality Validation
- All three questions answered completely
- At least 3 agents contributed per question
- Data sources are current (<1 hour old)
- Recommendations are specific and actionable
- Risk warnings are included
- Confidence scores are justified

## Performance Targets
- Total execution time: <30 seconds
- Cache validity: 1 hour for stable markets, 15 minutes for volatile
- Parallel agent execution where possible
- Pre-computation at market open (UTC 00:00)
- Updates triggered by significant events (>5% moves)

## Contextual Adaptations

### Market Conditions
**High Volatility (>10% daily moves)**:
- Activate all macro strategists
- Increase risk manager weight
- Shorten recommendation timeframes
- Add volatility warnings

**Quiet Markets (<2% moves)**:
- Focus on technical analysis
- Look for accumulation/distribution
- Scan for emerging opportunities
- Extend analysis timeframe

### User Portfolio Context
**If Heavy BTC/ETH**:
- Focus on major market movements
- Macro factors weighted higher
- Correlation analysis important

**If Heavy Alts**:
- Emphasize ETH specialist insights
- Check ALT/BTC ratios
- Narrative analysis crucial
- Higher risk warnings

**If Mostly Stables**:
- Focus on re-entry opportunities
- Risk-off sentiment analysis
- Yield opportunities
- Market timing signals

## Schedule
- **Primary Run**: UTC 00:00 (market day open)
- **Updates**: Every 4 hours (04:00, 08:00, 12:00, 16:00, 20:00 UTC)
- **Emergency Updates**: Triggered by >5% moves in 1 hour
- **Weekend Schedule**: Reduced to 2x daily (00:00, 12:00 UTC)