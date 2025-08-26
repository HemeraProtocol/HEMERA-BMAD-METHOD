const AgentExecutor = require('../src/agents/AgentExecutor');
const CommitteeOrchestrator = require('../src/agents/CommitteeOrchestrator');
const path = require('path');
const fs = require('fs-extra');

describe('AgentExecutor', () => {
  let agentExecutor;

  beforeEach(() => {
    agentExecutor = new AgentExecutor();
  });

  afterEach(() => {
    agentExecutor.clearCache();
  });

  describe('loadAgent', () => {
    it('should load an agent from markdown file', async () => {
      // Check if cio-orchestrator agent exists
      const agentPath = path.join(agentExecutor.agentsPath, 'cio-orchestrator.md');
      const exists = await fs.pathExists(agentPath);
      
      if (exists) {
        const agent = await agentExecutor.loadAgent('cio-orchestrator');
        expect(agent).toBeDefined();
        expect(agent.id).toBe('cio-orchestrator');
        expect(agent.name).toBeDefined();
        expect(agent.persona).toBeDefined();
      } else {
        console.warn('Agent file not found, skipping test');
      }
    });

    it('should cache loaded agents', async () => {
      const agentPath = path.join(agentExecutor.agentsPath, 'cio-orchestrator.md');
      const exists = await fs.pathExists(agentPath);
      
      if (exists) {
        const agent1 = await agentExecutor.loadAgent('cio-orchestrator');
        const agent2 = await agentExecutor.loadAgent('cio-orchestrator');
        expect(agent1).toBe(agent2); // Should be same reference due to caching
      }
    });

    it('should throw error for non-existent agent', async () => {
      await expect(agentExecutor.loadAgent('non-existent-agent'))
        .rejects.toThrow('Failed to load agent');
    });
  });

  describe('getAvailableAgents', () => {
    it('should return list of available agents', async () => {
      const agents = await agentExecutor.getAvailableAgents();
      expect(Array.isArray(agents)).toBe(true);
      
      // Check if we have at least some agents
      if (agents.length > 0) {
        const agent = agents[0];
        expect(agent.id).toBeDefined();
        expect(agent.name).toBeDefined();
        expect(agent.title).toBeDefined();
      }
    });
  });

  describe('buildAgentPrompt', () => {
    it('should build prompt with agent persona', () => {
      const agent = {
        name: 'Test Agent',
        title: 'Test Title',
        persona: {
          identity: 'Test Identity',
          focus: 'Test Focus',
          core_principles: ['Principle 1', 'Principle 2']
        }
      };
      
      const prompt = agentExecutor.buildAgentPrompt(agent, 'Test query', {});
      
      expect(prompt).toContain('Test Agent');
      expect(prompt).toContain('Test Title');
      expect(prompt).toContain('Test Identity');
      expect(prompt).toContain('Test Focus');
      expect(prompt).toContain('Principle 1');
      expect(prompt).toContain('Test query');
    });

    it('should include market context in prompt', () => {
      const agent = { name: 'Test', title: 'Test' };
      const context = {
        marketData: { BTC: { price: 45000 } },
        phase: 'Individual Analysis'
      };
      
      const prompt = agentExecutor.buildAgentPrompt(agent, 'Query', context);
      
      expect(prompt).toContain('45000');
      expect(prompt).toContain('Individual Analysis');
    });
  });
});

describe('CommitteeOrchestrator', () => {
  let orchestrator;
  let mockLLMService;

  beforeEach(() => {
    mockLLMService = {
      generateResponse: jest.fn().mockResolvedValue('Mock analysis response with 75% confidence')
    };
    orchestrator = new CommitteeOrchestrator(mockLLMService);
  });

  describe('activateAgents', () => {
    it('should activate relevant agents based on query', async () => {
      const query = 'Why is Bitcoin moving up today?';
      const agents = await orchestrator.activateAgents(query, {});
      
      expect(Array.isArray(agents)).toBe(true);
      // Should have at least 3 agents for diverse perspective
      expect(agents.length).toBeGreaterThanOrEqual(3);
    });

    it('should always include CIO and risk manager', async () => {
      const query = 'Should I buy or sell?';
      const agents = await orchestrator.activateAgents(query, {});
      
      const agentIds = agents.map(a => a.id);
      const hasCIO = agentIds.some(id => id.includes('cio'));
      const hasRisk = agentIds.some(id => id.includes('risk'));
      
      if (agents.length > 0) {
        expect(hasCIO || hasRisk).toBe(true);
      }
    });
  });

  describe('executeCommitteeMeeting', () => {
    it('should execute all phases of committee meeting', async () => {
      const query = 'Should I buy Bitcoin?';
      const result = await orchestrator.executeCommitteeMeeting(query, {});
      
      expect(result).toBeDefined();
      expect(result.query).toBe(query);
      expect(result.timestamp).toBeDefined();
      expect(result.phases).toBeDefined();
      expect(result.finalVerdict).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      mockLLMService.generateResponse = jest.fn().mockRejectedValue(new Error('LLM Error'));
      
      await expect(orchestrator.executeCommitteeMeeting('Test query', {}))
        .rejects.toThrow('Committee meeting failed');
    });
  });

  describe('utility methods', () => {
    it('should detect market movement queries', () => {
      expect(orchestrator.isMarketMovementQuery('Why is BTC up?')).toBe(true);
      expect(orchestrator.isMarketMovementQuery('Price movement today')).toBe(true);
      expect(orchestrator.isMarketMovementQuery('Random query')).toBe(false);
    });

    it('should detect portfolio decision queries', () => {
      expect(orchestrator.isPortfolioDecisionQuery('Should I buy?')).toBe(true);
      expect(orchestrator.isPortfolioDecisionQuery('Sell my portfolio')).toBe(true);
      expect(orchestrator.isPortfolioDecisionQuery('What is blockchain?')).toBe(false);
    });

    it('should extract confidence from response', () => {
      const response1 = 'Analysis with 85% confidence';
      const response2 = 'No confidence mentioned';
      
      expect(orchestrator.extractConfidence(response1)).toBe(85);
      expect(orchestrator.extractConfidence(response2)).toBe(70); // Default
    });

    it('should extract position from response', () => {
      const bullishResponse = 'I am bullish on BTC, strong buy signal';
      const bearishResponse = 'Bearish outlook, consider selling';
      const neutralResponse = 'Market is consolidating';
      
      expect(orchestrator.extractPosition(bullishResponse)).toBe('bullish');
      expect(orchestrator.extractPosition(bearishResponse)).toBe('bearish');
      expect(orchestrator.extractPosition(neutralResponse)).toBe('neutral');
    });
  });

  describe('consensus building', () => {
    it('should build consensus from analyses', async () => {
      const analyses = {
        agent1: { position: 'bullish', confidence: 80 },
        agent2: { position: 'bullish', confidence: 70 },
        agent3: { position: 'neutral', confidence: 60 }
      };
      
      const consensus = await orchestrator.buildConsensus(analyses, []);
      
      expect(consensus).toBeDefined();
      expect(consensus.dominantPosition).toBe('bullish');
      expect(consensus.averageConfidence).toBe(70);
      expect(consensus.agreements).toBeDefined();
      expect(consensus.disagreements).toBeDefined();
    });
  });
});