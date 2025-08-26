const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

// Import existing BMad infrastructure
const { extractYamlFromAgent } = require('../../../../../tools/lib/yaml-utils');

/**
 * AgentExecutor - Extends BMad's ConfigLoader pattern for committee agents
 */
class AgentExecutor {
  constructor() {
    this.basePath = path.join(__dirname, '../../..');
    this.agentsPath = path.join(this.basePath, 'agents');
    this.agentCache = new Map();
  }

  /**
   * Load an agent from markdown file
   * @param {string} agentId - Agent identifier (filename without .md)
   * @returns {Promise<Object>} Loaded agent configuration
   */
  async loadAgent(agentId) {
    // Check cache first
    if (this.agentCache.has(agentId)) {
      return this.agentCache.get(agentId);
    }

    try {
      const agentPath = path.join(this.agentsPath, `${agentId}.md`);
      const content = await fs.readFile(agentPath, 'utf8');
      
      // Extract YAML using BMad's utility
      const yamlContent = extractYamlFromAgent(content);
      if (!yamlContent) {
        throw new Error(`No YAML configuration found in agent ${agentId}`);
      }
      
      const config = yaml.load(yamlContent);
      
      const agent = {
        id: agentId,
        name: config.agent?.name || agentId,
        title: config.agent?.title || 'Committee Member',
        persona: config.persona,
        commands: config.commands,
        dependencies: config.dependencies,
        interactionProtocols: config.interaction_protocols,
        analyticalFramework: config.analytical_framework,
        qualityValidation: config.quality_validation
      };
      
      // Cache the loaded agent
      this.agentCache.set(agentId, agent);
      
      return agent;
    } catch (error) {
      throw new Error(`Failed to load agent ${agentId}: ${error.message}`);
    }
  }

  /**
   * Get all available agents in the committee
   * @returns {Promise<Array>} List of available agents
   */
  async getAvailableAgents() {
    try {
      const files = await fs.readdir(this.agentsPath);
      const agentFiles = files.filter(f => f.endsWith('.md'));
      
      const agents = [];
      for (const file of agentFiles) {
        const agentId = path.basename(file, '.md');
        try {
          const agent = await this.loadAgent(agentId);
          agents.push({
            id: agentId,
            name: agent.name,
            title: agent.title
          });
        } catch (err) {
          console.warn(`Skipping agent ${agentId}: ${err.message}`);
        }
      }
      
      return agents;
    } catch (error) {
      throw new Error(`Failed to get available agents: ${error.message}`);
    }
  }

  /**
   * Clear agent cache
   */
  clearCache() {
    this.agentCache.clear();
  }

  /**
   * Build prompt for agent based on persona
   * @param {Object} agent - Agent configuration
   * @param {string} query - User query
   * @param {Object} context - Additional context
   * @returns {string} Formatted prompt
   */
  buildAgentPrompt(agent, query, context = {}) {
    const persona = agent.persona;
    let prompt = `You are ${agent.name}, ${agent.title}.\n\n`;
    
    if (persona) {
      if (persona.identity) {
        prompt += `Identity: ${persona.identity}\n\n`;
      }
      if (persona.focus) {
        prompt += `Focus: ${persona.focus}\n\n`;
      }
      if (persona.core_principles) {
        prompt += 'Core Principles:\n';
        persona.core_principles.forEach(principle => {
          prompt += `- ${principle}\n`;
        });
        prompt += '\n';
      }
    }
    
    if (context.marketData) {
      prompt += `Current Market Context:\n${JSON.stringify(context.marketData, null, 2)}\n\n`;
    }
    
    if (context.phase) {
      prompt += `Current Phase: ${context.phase}\n\n`;
    }
    
    prompt += `Query: ${query}\n\n`;
    prompt += 'Provide your analysis based on your expertise and perspective.';
    
    return prompt;
  }
}

module.exports = AgentExecutor;