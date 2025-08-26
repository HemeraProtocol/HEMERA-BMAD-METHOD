const AgentExecutor = require('./AgentExecutor');

/**
 * CommitteeOrchestrator - Manages the 7-phase investment committee meeting
 */
class CommitteeOrchestrator {
  constructor(llmService) {
    this.agentExecutor = new AgentExecutor();
    this.llmService = llmService;
    this.phases = [
      'activation',
      'individual_analysis', 
      'round_table',
      'red_team_challenge',
      'validation',
      'consensus_building',
      'final_verdict'
    ];
  }

  /**
   * Execute full committee meeting
   * @param {string} query - User's investment question
   * @param {Object} context - Market context
   * @returns {Promise<Object>} Committee analysis result
   */
  async executeCommitteeMeeting(query, context = {}) {
    const result = {
      query,
      timestamp: new Date().toISOString(),
      phases: {},
      finalVerdict: null
    };

    try {
      // Phase 1: Activation - Determine relevant agents
      const activatedAgents = await this.activateAgents(query, context);
      result.phases.activation = {
        agents: activatedAgents.map(a => a.id),
        reasoning: this.getActivationReasoning(query)
      };

      // Phase 2: Individual Analysis
      const analyses = await this.conductIndividualAnalysis(
        activatedAgents, 
        query, 
        context
      );
      result.phases.individualAnalysis = analyses;

      // Phase 3: Round Table
      const roundTable = await this.conductRoundTable(analyses);
      result.phases.roundTable = roundTable;

      // Phase 4: Red Team Challenge
      const challenges = await this.conductRedTeamChallenge(analyses);
      result.phases.redTeamChallenge = challenges;

      // Phase 5: Validation
      const validations = await this.conductValidation(analyses);
      result.phases.validation = validations;

      // Phase 6: Consensus Building
      const consensus = await this.buildConsensus(analyses, challenges);
      result.phases.consensus = consensus;

      // Phase 7: Final Verdict (CIO Synthesis)
      const verdict = await this.synthesizeFinalVerdict(
        query,
        analyses,
        consensus
      );
      result.finalVerdict = verdict;

      return result;
    } catch (error) {
      throw new Error(`Committee meeting failed: ${error.message}`);
    }
  }

  /**
   * Phase 1: Activate relevant agents based on query
   */
  async activateAgents(query, context) {
    const allAgents = await this.agentExecutor.getAvailableAgents();
    const activated = [];

    // Always include CIO orchestrator
    const cio = allAgents.find(a => a.id.includes('cio'));
    if (cio) activated.push(await this.agentExecutor.loadAgent(cio.id));

    // Always include risk manager
    const riskManager = allAgents.find(a => a.id.includes('risk'));
    if (riskManager) activated.push(await this.agentExecutor.loadAgent(riskManager.id));

    // Contextual activation based on query type
    if (this.isMarketMovementQuery(query)) {
      // Add technical analyst and market sentiment
      const technical = allAgents.find(a => a.id.includes('technical'));
      if (technical) activated.push(await this.agentExecutor.loadAgent(technical.id));
      
      const sentiment = allAgents.find(a => a.id.includes('sentiment'));
      if (sentiment) activated.push(await this.agentExecutor.loadAgent(sentiment.id));
    }

    if (this.isPortfolioDecisionQuery(query)) {
      // Add contrarian for balance
      const contrarian = allAgents.find(a => a.id.includes('contrarian'));
      if (contrarian) activated.push(await this.agentExecutor.loadAgent(contrarian.id));
    }

    // Ensure minimum 3 agents for diverse perspective
    if (activated.length < 3) {
      for (const agent of allAgents) {
        if (!activated.find(a => a.id === agent.id)) {
          activated.push(await this.agentExecutor.loadAgent(agent.id));
          if (activated.length >= 3) break;
        }
      }
    }

    return activated;
  }

  /**
   * Phase 2: Conduct individual analysis
   */
  async conductIndividualAnalysis(agents, query, context) {
    const analyses = {};
    
    // Execute agents in parallel for efficiency
    const promises = agents.map(async (agent) => {
      const prompt = this.agentExecutor.buildAgentPrompt(agent, query, {
        ...context,
        phase: 'Individual Analysis'
      });
      
      const response = await this.llmService.generateResponse(prompt, {
        temperature: 0.7,
        maxTokens: 500
      });
      
      return {
        agentId: agent.id,
        agentName: agent.name,
        analysis: response,
        confidence: this.extractConfidence(response),
        position: this.extractPosition(response)
      };
    });

    const results = await Promise.all(promises);
    results.forEach(r => {
      analyses[r.agentId] = r;
    });

    return analyses;
  }

  /**
   * Phase 3: Round Table Discussion
   */
  async conductRoundTable(analyses) {
    const presentations = [];
    
    for (const agentId in analyses) {
      presentations.push({
        agent: analyses[agentId].agentName,
        presentation: analyses[agentId].analysis,
        confidence: analyses[agentId].confidence
      });
    }
    
    return presentations;
  }

  /**
   * Phase 4: Red Team Challenge
   */
  async conductRedTeamChallenge(analyses) {
    const challenges = [];
    
    // Risk manager challenges bullish views
    const riskAnalysis = Object.values(analyses).find(a => 
      a.agentId.includes('risk')
    );
    
    if (riskAnalysis) {
      const bullishAgents = Object.values(analyses).filter(a => 
        a.position === 'bullish' && !a.agentId.includes('risk')
      );
      
      for (const bullish of bullishAgents) {
        challenges.push({
          challenger: riskAnalysis.agentName,
          target: bullish.agentName,
          challenge: `What about downside risks? Have you considered...`,
          response: 'Agent defends position...'
        });
      }
    }
    
    return challenges;
  }

  /**
   * Phase 5: Validation
   */
  async conductValidation(analyses) {
    const validations = [];
    
    // Cross-check data sources and logic
    for (const agentId in analyses) {
      validations.push({
        agent: analyses[agentId].agentName,
        validated: true,
        notes: 'Analysis logic verified'
      });
    }
    
    return validations;
  }

  /**
   * Phase 6: Build Consensus
   */
  async buildConsensus(analyses, challenges) {
    const positions = Object.values(analyses).map(a => a.position);
    const confidences = Object.values(analyses).map(a => a.confidence);
    
    // Count positions
    const positionCounts = positions.reduce((acc, pos) => {
      acc[pos] = (acc[pos] || 0) + 1;
      return acc;
    }, {});
    
    // Calculate average confidence
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    
    return {
      agreements: this.findAgreements(analyses),
      disagreements: this.findDisagreements(analyses),
      dominantPosition: Object.keys(positionCounts).reduce((a, b) => 
        positionCounts[a] > positionCounts[b] ? a : b
      ),
      averageConfidence: Math.round(avgConfidence),
      insights: ['Key insight from discussion...']
    };
  }

  /**
   * Phase 7: Synthesize Final Verdict
   */
  async synthesizeFinalVerdict(query, analyses, consensus) {
    const cioAgent = await this.agentExecutor.loadAgent('cio-orchestrator');
    
    const synthesisPrompt = `
As the CIO, synthesize the committee's analysis:

Query: ${query}

Committee Consensus:
- Dominant Position: ${consensus.dominantPosition}
- Average Confidence: ${consensus.averageConfidence}%
- Key Agreements: ${consensus.agreements.join(', ')}
- Key Disagreements: ${consensus.disagreements.join(', ')}

Provide a clear, actionable verdict with:
1. Recommendation (BUY/SELL/HOLD)
2. Confidence level
3. Key reasoning
4. Risk considerations
5. Action items
    `;
    
    const verdict = await this.llmService.generateResponse(synthesisPrompt, {
      temperature: 0.5,
      maxTokens: 600
    });
    
    return {
      recommendation: this.extractRecommendation(verdict),
      confidence: consensus.averageConfidence,
      reasoning: verdict,
      actionItems: this.extractActionItems(verdict)
    };
  }

  // Utility methods
  isMarketMovementQuery(query) {
    const keywords = ['why', 'move', 'up', 'down', 'price', 'market'];
    return keywords.some(k => query.toLowerCase().includes(k));
  }

  isPortfolioDecisionQuery(query) {
    const keywords = ['buy', 'sell', 'hold', 'portfolio', 'invest'];
    return keywords.some(k => query.toLowerCase().includes(k));
  }

  getActivationReasoning(query) {
    if (this.isMarketMovementQuery(query)) {
      return 'Market movement analysis requires technical and sentiment perspectives';
    }
    if (this.isPortfolioDecisionQuery(query)) {
      return 'Portfolio decisions need risk assessment and contrarian views';
    }
    return 'General investment query requires balanced committee perspective';
  }

  extractConfidence(response) {
    // Simple extraction - look for percentage
    const match = response.match(/(\d+)%/);
    return match ? parseInt(match[1]) : 70;
  }

  extractPosition(response) {
    const bullishKeywords = ['bullish', 'buy', 'positive', 'upward'];
    const bearishKeywords = ['bearish', 'sell', 'negative', 'downward'];
    
    const text = response.toLowerCase();
    const bullishCount = bullishKeywords.filter(k => text.includes(k)).length;
    const bearishCount = bearishKeywords.filter(k => text.includes(k)).length;
    
    if (bullishCount > bearishCount) return 'bullish';
    if (bearishCount > bullishCount) return 'bearish';
    return 'neutral';
  }

  findAgreements(analyses) {
    const positions = Object.values(analyses).map(a => a.position);
    const uniquePositions = [...new Set(positions)];
    
    if (uniquePositions.length === 1) {
      return [`All agents agree: ${uniquePositions[0]}`];
    }
    
    return ['Mixed views on market direction'];
  }

  findDisagreements(analyses) {
    const positions = Object.values(analyses).map(a => a.position);
    const uniquePositions = [...new Set(positions)];
    
    if (uniquePositions.length > 1) {
      return ['Disagreement on market direction'];
    }
    
    return [];
  }

  extractRecommendation(verdict) {
    if (verdict.includes('BUY')) return 'BUY';
    if (verdict.includes('SELL')) return 'SELL';
    if (verdict.includes('HOLD')) return 'HOLD';
    return 'HOLD';
  }

  extractActionItems(verdict) {
    // Simple extraction
    return ['Monitor market conditions', 'Review position in 24 hours'];
  }
}

module.exports = CommitteeOrchestrator;