const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const { EventEmitter } = require('events');

class TaskExecutor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.rootDir = options.rootDir || process.cwd();
    this.tasksDir = options.tasksDir || path.join(this.rootDir, 'tasks');
    this.agentManager = options.agentManager;
    this.logger = options.logger || console;
    this.cache = new Map();
    this.executionHistory = [];
    this.maxExecutionTime = options.maxExecutionTime || 300000; // 5 minutes default
  }

  async loadTask(taskName) {
    const cacheKey = `task:${taskName}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const taskPath = path.join(this.tasksDir, `${taskName}.md`);
      const content = await fs.readFile(taskPath, 'utf8');
      
      const task = this.parseTaskContent(content);
      task.id = taskName;
      task.path = taskPath;
      
      this.cache.set(cacheKey, task);
      return task;
    } catch (error) {
      this.logger.error(`Failed to load task ${taskName}:`, error);
      throw new Error(`Task '${taskName}' not found or invalid`);
    }
  }

  parseTaskContent(content) {
    const lines = content.split('\n');
    const task = {
      metadata: {},
      phases: [],
      requirements: {},
      outputs: {},
      rawContent: content
    };

    let currentSection = null;
    let currentPhase = null;
    let yamlBuffer = [];
    let inYamlBlock = false;

    for (const line of lines) {
      // Check for YAML block
      if (line.trim() === '```yaml') {
        inYamlBlock = true;
        yamlBuffer = [];
        continue;
      }
      if (inYamlBlock) {
        if (line.trim() === '```') {
          inYamlBlock = false;
          if (yamlBuffer.length > 0) {
            try {
              const yamlContent = yaml.load(yamlBuffer.join('\n'));
              Object.assign(task.metadata, yamlContent);
            } catch (e) {
              this.logger.warn('Failed to parse YAML block:', e);
            }
          }
          continue;
        }
        yamlBuffer.push(line);
        continue;
      }

      // Parse sections
      if (line.startsWith('## Phase:') || line.startsWith('## Phase ')) {
        const phaseName = line.replace(/^## Phase:?/, '').trim();
        currentPhase = {
          name: phaseName,
          steps: [],
          agents: [],
          outputs: []
        };
        task.phases.push(currentPhase);
        currentSection = 'phase';
      } else if (line.startsWith('## Requirements')) {
        currentSection = 'requirements';
      } else if (line.startsWith('## Output')) {
        currentSection = 'outputs';
      } else if (line.startsWith('### ') && currentPhase) {
        const subsection = line.replace('### ', '').trim().toLowerCase();
        if (subsection.includes('agent')) {
          currentSection = 'agents';
        } else if (subsection.includes('step')) {
          currentSection = 'steps';
        } else if (subsection.includes('output')) {
          currentSection = 'phase_outputs';
        }
      } else if (line.trim().startsWith('- ') && currentSection) {
        const item = line.trim().substring(2);
        
        if (currentSection === 'steps' && currentPhase) {
          currentPhase.steps.push(item);
        } else if (currentSection === 'agents' && currentPhase) {
          currentPhase.agents.push(item);
        } else if (currentSection === 'phase_outputs' && currentPhase) {
          currentPhase.outputs.push(item);
        } else if (currentSection === 'requirements') {
          const [key, value] = item.split(':').map(s => s.trim());
          if (key && value) {
            task.requirements[key] = value;
          }
        }
      }
    }

    // Extract timing requirements
    if (task.metadata.maxExecutionTime) {
      task.maxExecutionTime = this.parseTimeString(task.metadata.maxExecutionTime);
    }

    return task;
  }

  parseTimeString(timeStr) {
    if (typeof timeStr === 'number') return timeStr;
    
    const matches = timeStr.match(/(\d+)\s*(minutes?|mins?|seconds?|secs?|s)/i);
    if (!matches) return 60000; // Default 1 minute
    
    const value = parseInt(matches[1]);
    const unit = matches[2].toLowerCase();
    
    if (unit.startsWith('min')) {
      return value * 60000;
    } else if (unit.startsWith('sec') || unit === 's') {
      return value * 1000;
    }
    
    return value;
  }

  async execute(taskName, context = {}) {
    const startTime = Date.now();
    const executionId = `${taskName}_${startTime}`;
    
    this.emit('execution:start', { executionId, taskName, context });
    
    try {
      // Load and validate task
      const task = await this.loadTask(taskName);
      await this.validateTask(task);
      
      // Initialize execution context
      const executionContext = {
        id: executionId,
        taskName,
        task,
        input: context,
        phases: [],
        results: {},
        startTime,
        status: 'running'
      };

      // Set execution timeout
      const timeoutMs = task.maxExecutionTime || this.maxExecutionTime;
      const timeout = setTimeout(() => {
        executionContext.status = 'timeout';
        this.emit('execution:timeout', executionContext);
      }, timeoutMs);

      // Execute phases sequentially
      for (const phase of task.phases) {
        if (executionContext.status !== 'running') break;
        
        const phaseResult = await this.executePhase(phase, executionContext);
        executionContext.phases.push(phaseResult);
        
        this.emit('phase:complete', { 
          executionId, 
          phase: phase.name, 
          result: phaseResult 
        });
      }

      clearTimeout(timeout);
      
      // Finalize execution
      executionContext.endTime = Date.now();
      executionContext.duration = executionContext.endTime - startTime;
      executionContext.status = 'completed';
      
      // Store in history
      this.executionHistory.push(executionContext);
      
      // Format final output
      const output = await this.formatOutput(executionContext);
      
      this.emit('execution:complete', { executionId, output });
      
      return output;
      
    } catch (error) {
      this.logger.error(`Task execution failed for ${taskName}:`, error);
      
      this.emit('execution:error', { 
        executionId, 
        taskName, 
        error: error.message 
      });
      
      throw error;
    }
  }

  async executePhase(phase, context) {
    const phaseStartTime = Date.now();
    
    this.emit('phase:start', { 
      executionId: context.id, 
      phase: phase.name 
    });
    
    const phaseResult = {
      name: phase.name,
      startTime: phaseStartTime,
      steps: [],
      agentResponses: {},
      outputs: {}
    };

    try {
      // Execute each step in the phase
      for (const step of phase.steps) {
        const stepResult = await this.executeStep(step, phase, context);
        phaseResult.steps.push(stepResult);
      }

      // Collect agent responses if agents are specified
      if (phase.agents && phase.agents.length > 0 && this.agentManager) {
        for (const agentId of phase.agents) {
          const response = await this.getAgentResponse(agentId, phase, context);
          phaseResult.agentResponses[agentId] = response;
        }
      }

      // Generate phase outputs
      for (const outputSpec of phase.outputs) {
        const outputValue = await this.generateOutput(outputSpec, phaseResult, context);
        phaseResult.outputs[outputSpec] = outputValue;
      }

      phaseResult.endTime = Date.now();
      phaseResult.duration = phaseResult.endTime - phaseStartTime;
      phaseResult.status = 'completed';
      
    } catch (error) {
      phaseResult.error = error.message;
      phaseResult.status = 'failed';
      this.logger.error(`Phase ${phase.name} failed:`, error);
    }

    return phaseResult;
  }

  async executeStep(step, phase, context) {
    // This is a placeholder for step execution logic
    // In real implementation, this would parse and execute the step
    return {
      step,
      status: 'completed',
      timestamp: Date.now()
    };
  }

  async getAgentResponse(agentId, phase, context) {
    if (!this.agentManager) {
      return { 
        agentId, 
        response: 'Agent manager not configured',
        status: 'skipped'
      };
    }

    try {
      // Get agent response based on phase context
      const prompt = this.buildAgentPrompt(agentId, phase, context);
      const response = await this.agentManager.queryAgent(agentId, prompt);
      
      return {
        agentId,
        prompt,
        response,
        status: 'completed',
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        agentId,
        error: error.message,
        status: 'failed',
        timestamp: Date.now()
      };
    }
  }

  buildAgentPrompt(agentId, phase, context) {
    // Build contextual prompt for agent based on phase requirements
    const prompt = `
Phase: ${phase.name}
Task: ${context.taskName}
Context: ${JSON.stringify(context.input, null, 2)}

Previous Phases: ${context.phases.map(p => p.name).join(', ')}

Please provide your analysis for this phase.
`;
    return prompt;
  }

  async generateOutput(outputSpec, phaseResult, context) {
    // Generate output based on specification
    // This could involve aggregating agent responses, formatting data, etc.
    return {
      spec: outputSpec,
      phase: phaseResult.name,
      data: phaseResult.agentResponses,
      generated: Date.now()
    };
  }

  async validateTask(task) {
    const errors = [];
    
    if (!task.phases || task.phases.length === 0) {
      errors.push('Task must have at least one phase');
    }
    
    for (const phase of task.phases) {
      if (!phase.name) {
        errors.push('Each phase must have a name');
      }
      if (!phase.steps || phase.steps.length === 0) {
        errors.push(`Phase '${phase.name}' must have at least one step`);
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`Task validation failed:\n${errors.join('\n')}`);
    }
    
    return true;
  }

  async formatOutput(context) {
    const output = {
      taskName: context.taskName,
      executionId: context.id,
      status: context.status,
      duration: context.duration,
      input: context.input,
      phases: {}
    };

    for (const phase of context.phases) {
      output.phases[phase.name] = {
        status: phase.status,
        duration: phase.duration,
        outputs: phase.outputs,
        agentResponses: phase.agentResponses
      };
    }

    return output;
  }

  async listAvailableTasks() {
    try {
      const files = await fs.readdir(this.tasksDir);
      return files
        .filter(f => f.endsWith('.md'))
        .map(f => f.replace('.md', ''));
    } catch (error) {
      this.logger.error('Failed to list tasks:', error);
      return [];
    }
  }

  clearCache() {
    this.cache.clear();
  }

  getExecutionHistory(limit = 10) {
    return this.executionHistory.slice(-limit);
  }
}

module.exports = TaskExecutor;