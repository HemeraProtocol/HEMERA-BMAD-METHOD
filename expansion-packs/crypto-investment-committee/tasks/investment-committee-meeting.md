# Investment Committee Meeting Task

A structured 7-phase workflow for comprehensive multi-perspective investment analysis.

```yaml
name: Investment Committee Meeting  
description: Conducts a full investment committee analysis with multiple expert perspectives
version: 1.0.0
maxExecutionTime: 5 minutes
retry:
  maxAttempts: 3
  backoffMs: 2000
requirements:
  ticker: string
  amount: number
  timeHorizon: string
  riskTolerance: string
```

## Phase: Activation
Initialize the committee meeting and prepare context for all agents.

### Steps
- Validate input parameters (ticker, amount, timeHorizon, riskTolerance)
- Load market data for the specified ticker
- Prepare base context for all committee members
- Initialize meeting transcript

### Outputs
- Meeting context initialized
- Market data loaded
- Base analysis parameters set

## Phase: Analysis
dependsOn: Activation
Each committee member performs their specialized analysis independently.

### Agents
- quant-analyst
- risk-manager
- market-analyst
- fundamental-analyst
- sentiment-analyst

### Steps
- agent: quant-analyst - Perform quantitative analysis on {{input.ticker}}
- agent: risk-manager - Evaluate risk metrics for {{input.amount}} investment
- agent: market-analyst - Analyze market conditions and trends
- agent: fundamental-analyst - Review fundamental indicators
- agent: sentiment-analyst - Assess market sentiment and social signals

### Outputs
- Individual analysis reports from each agent
- Key metrics and indicators identified
- Initial recommendations from each perspective

## Phase: Round Table
dependsOn: Analysis
parallel: false
Each stakeholder presents their findings in a structured format.

### Agents
- portfolio-manager
- compliance-officer
- macro-strategist

### Steps
- agent: portfolio-manager - Review analyses and provide portfolio perspective
- agent: compliance-officer - Ensure regulatory compliance and risk limits
- agent: macro-strategist - Contextualize within macro economic environment
- aggregate: responses - Compile all stakeholder presentations

### Outputs
- Stakeholder perspectives documented
- Portfolio impact assessment
- Compliance checklist completed
- Macro context established

## Phase: Debate
dependsOn: Round Table
Red team challenges and devil's advocate perspectives.

### Agents
- contrarian-investor
- risk-manager

### Steps
- agent: contrarian-investor - Challenge bullish assumptions and identify weaknesses
- agent: risk-manager - Stress test investment thesis under adverse scenarios
- validation: Ensure all major risks have been addressed
- aggregate: consensus - Identify areas of agreement and disagreement

### Outputs
- Challenged assumptions documented
- Stress test results
- Risk mitigation strategies
- Areas of consensus and divergence

## Phase: Validation
dependsOn: Debate
Technical and regulatory validation of the investment proposal.

### Agents
- technical-validator
- compliance-officer

### Steps
- agent: technical-validator - Verify all calculations and data sources
- agent: compliance-officer - Final compliance check
- validation: All technical metrics are within acceptable ranges
- validation: Regulatory requirements are met

### Outputs
- Technical validation report
- Compliance certification
- Data quality assessment
- Final risk scores

## Phase: Consensus
dependsOn: Validation
parallel: false
Build committee consensus and final recommendation.

### Agents
- committee-chair
- quant-analyst
- risk-manager
- portfolio-manager

### Steps
- agent: committee-chair - Synthesize all perspectives into preliminary recommendation
- agent: quant-analyst - Provide final quantitative assessment
- agent: risk-manager - Approve risk parameters
- agent: portfolio-manager - Confirm portfolio fit
- aggregate: consensus - Build final committee consensus

### Outputs
- Preliminary recommendation
- Risk-adjusted position sizing
- Implementation timeline
- Dissenting opinions (if any)

## Phase: Verdict
dependsOn: Consensus
Final investment decision and implementation plan.

### Agents
- committee-chair

### Steps
- agent: committee-chair - Deliver final investment verdict
- Generate implementation instructions
- Create monitoring plan
- Document decision rationale

### Outputs
- Final verdict (BUY/HOLD/SELL/PASS)
- Position size and entry strategy
- Stop loss and take profit levels
- Monitoring KPIs
- Complete meeting transcript

## Required Inputs
- User query/question
- Current market context
- Portfolio context (if provided)
- Risk tolerance (if specified)

## Expected Outputs
```json
{
  "question": "User's original question",
  "committee_composition": ["agent1", "agent2", ...],
  "individual_analyses": {
    "agent_name": {
      "position": "Bullish/Bearish/Neutral",
      "key_points": ["point1", "point2"],
      "confidence": 85,
      "sources": ["source1", "source2"]
    }
  },
  "discussion_highlights": {
    "agreements": ["point1", "point2"],
    "disagreements": [
      {
        "topic": "topic1",
        "positions": {
          "agent1": "position",
          "agent2": "different position"
        }
      }
    ],
    "key_challenges": ["challenge1", "challenge2"],
    "emergent_insights": ["insight1"]
  },
  "final_verdict": {
    "recommendation": "Clear actionable recommendation",
    "confidence": 75,
    "reasoning": "Synthesis of key points",
    "action_items": ["action1", "action2"],
    "risks": ["risk1", "risk2"],
    "exit_conditions": ["condition1", "condition2"]
  }
}
```

## Quality Validation
- All activated agents contributed meaningfully
- Data sources are recent and credible
- Logical consistency across analyses
- Clear disagreements are documented
- Final verdict is actionable
- Risk considerations are explicit
- Confidence score is justified

## Time Allocation
- Total time: 5-8 minutes for full analysis
- Phase 1: 30 seconds (activation)
- Phase 2: 2-3 minutes (parallel analysis)
- Phase 3: 2-3 minutes (round table)
- Phase 4: 1 minute (challenges)
- Phase 5: 30 seconds (validation)
- Phase 6: 30 seconds (consensus)
- Phase 7: 1 minute (final verdict)

## Contextual Adaptations

### For Daily Questions
**"Why is BTC/ETH up/down?"**
- Emphasize market sentiment and technical analysis
- Include relevant macro strategist based on trigger
- Keep analysis concise and focused on key driver

**"Should I keep/buy/sell?"**
- Risk Manager takes prominent role
- Include position sizing recommendations
- Define clear exit conditions

**"What new opportunities exist?"**
- Market Sentiment leads discovery
- Risk Manager validates opportunities
- Include risk/reward analysis

### For Quick Analysis
- Limit to 3-4 most relevant agents
- Skip validation phase
- Reduce debate to key challenges only
- Target 2-3 minute total time

### For Deep Dive
- Include all relevant specialists
- Extended debate phase
- Multiple scenario analysis
- Detailed risk assessment
- Target 8-10 minute analysis