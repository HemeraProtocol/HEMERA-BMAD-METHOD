const { EventEmitter } = require('events');
const TaskParser = require('./task-parser');
const ExecutionContext = require('./execution-context');
const Handlebars = require('handlebars');

class TaskExecutorV2 extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Dependencies injection
    this.taskParser = options.taskParser || new TaskParser(options);
    this.agentManager = options.agentManager;
    this.historyStore = options.historyStore;
    this.logger = options.logger || console;
    
    // Configuration
    this.tasksDir = options.tasksDir;
    this.maxExecutionTime = options.maxExecutionTime || 300000; // 5 minutes
    this.maxConcurrentPhases = options.maxConcurrentPhases || 3;
    
    // Runtime state
    this.activeExecutions = new Map();
    this.stepStrategies = new Map();
    
    // Initialize step strategies
    this.initializeStepStrategies();
    
    // Template engine for dynamic content
    this.templateEngine = Handlebars.create();
    this.registerTemplateHelpers();
  }

  initializeStepStrategies() {
    // Register default step execution strategies
    this.registerStepStrategy('agent_query', this.executeAgentQuery.bind(this));
    this.registerStepStrategy('validation', this.executeValidation.bind(this));
    this.registerStepStrategy('aggregation', this.executeAggregation.bind(this));
    this.registerStepStrategy('wait', this.executeWait.bind(this));
    this.registerStepStrategy('custom', this.executeCustomStep.bind(this));
  }

  registerStepStrategy(type, handler) {
    this.stepStrategies.set(type, handler);
  }

  registerTemplateHelpers() {
    this.templateEngine.registerHelper('json', (context) => {
      return JSON.stringify(context, null, 2);
    });
    
    this.templateEngine.registerHelper('get', (obj, path) => {
      return path.split('.').reduce((acc, part) => acc?.[part], obj);
    });
    
    this.templateEngine.registerHelper('timestamp', () => {
      return new Date().toISOString();
    });
  }

  async execute(taskName, input = {}) {
    // Create execution context
    const context = new ExecutionContext({
      taskName,
      input,
      metadata: {
        executor: 'TaskExecutorV2',
        version: '2.0.0'
      }
    });

    // Register in active executions
    this.activeExecutions.set(context.id, context);
    
    try {
      // Start execution
      context.start();
      this.emit('execution:start', context.getSummary());
      
      // Load and validate task
      const taskPath = `${this.tasksDir}/${taskName}.md`;
      const task = await this.taskParser.parseTaskFile(taskPath);
      context.task = task;
      
      // Validate requirements
      await this.taskParser.validateTaskRequirements(task, input);
      
      // Set up timeout
      const timeoutMs = task.metadata.maxExecutionTime || this.maxExecutionTime;
      const timeout = setTimeout(() => {
        if (context.status === 'running') {
          context.timeout();
          this.handleTimeout(context);
        }
      }, timeoutMs);
      
      // Check for resumable execution
      if (this.historyStore) {
        const resumableExecution = await this.historyStore.findResumable(taskName);
        if (resumableExecution) {
          context.restoreCheckpoint(resumableExecution.lastCheckpoint);
          this.emit('execution:resumed', { 
            id: context.id, 
            fromCheckpoint: resumableExecution.lastCheckpoint 
          });
        }
      }
      
      // Execute phases with dependency resolution
      await this.executePhases(task.phases, context);
      
      // Clear timeout
      clearTimeout(timeout);
      
      // Complete execution
      context.complete();
      
      // Store in history
      if (this.historyStore) {
        await this.historyStore.save(context.toJSON());
      }
      
      // Generate final output
      const output = this.formatOutput(context);
      
      this.emit('execution:complete', output);
      
      return output;
      
    } catch (error) {
      context.fail(error);
      
      if (this.historyStore) {
        await this.historyStore.save(context.toJSON());
      }
      
      this.emit('execution:error', {
        id: context.id,
        error: error.message
      });
      
      throw error;
      
    } finally {
      this.activeExecutions.delete(context.id);
    }
  }

  async executePhases(phases, context) {
    const phaseQueue = [...phases];
    const executing = new Set();
    const completed = new Set();
    
    while (phaseQueue.length > 0 || executing.size > 0) {
      // Check for aborted execution
      if (context.isAborted()) {
        break;
      }
      
      // Find phases ready to execute
      const readyPhases = phaseQueue.filter(phase => 
        this.canExecutePhase(phase, completed) && 
        !executing.has(phase.name)
      );
      
      // Start execution of ready phases (up to concurrency limit)
      const toExecute = readyPhases.slice(0, this.maxConcurrentPhases - executing.size);
      
      if (toExecute.length === 0 && executing.size === 0) {
        // Deadlock detection
        throw new Error('Phase execution deadlock detected');
      }
      
      // Execute phases in parallel
      const promises = toExecute.map(async (phase) => {
        executing.add(phase.name);
        phaseQueue.splice(phaseQueue.indexOf(phase), 1);
        
        try {
          await this.executePhase(phase, context);
          completed.add(phase.name);
        } catch (error) {
          context.failPhase(phase.name, error);
          throw error;
        } finally {
          executing.delete(phase.name);
        }
      });
      
      // Wait for at least one phase to complete
      if (promises.length > 0) {
        await Promise.race(promises);
      } else if (executing.size > 0) {
        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  canExecutePhase(phase, completedPhases) {
    if (!phase.dependsOn || phase.dependsOn.length === 0) {
      return true;
    }
    return phase.dependsOn.every(dep => completedPhases.has(dep));
  }

  async executePhase(phase, context) {
    // Start phase
    context.startPhase(phase.name);
    
    try {
      // Create phase-specific abort signal
      const phaseAbortSignal = context.getAbortSignal();
      
      // Execute steps
      for (const step of phase.steps) {
        if (phaseAbortSignal.aborted) {
          throw new Error('Phase execution aborted');
        }
        
        const stepResult = await this.executeStep(step, phase, context);
        context.addStepResult(phase.name, step, stepResult);
      }
      
      // Collect agent responses
      if (phase.agents && phase.agents.length > 0) {
        const agentPromises = phase.agents.map(agentId => 
          this.getAgentResponse(agentId, phase, context)
        );
        
        const responses = await Promise.allSettled(agentPromises);
        
        responses.forEach((result, index) => {
          const agentId = phase.agents[index];
          if (result.status === 'fulfilled') {
            context.addAgentResponse(phase.name, agentId, result.value);
          } else {
            context.addAgentResponse(phase.name, agentId, {
              error: result.reason.message,
              status: 'failed'
            });
          }
        });
      }
      
      // Generate phase outputs
      const outputs = await this.generatePhaseOutputs(phase, context);
      
      // Complete phase
      context.completePhase(phase.name, outputs);
      
      // Create checkpoint after significant phases
      if (this.historyStore && phase.checkpoint) {
        const checkpoint = context.createCheckpoint(`After ${phase.name}`);
        await this.historyStore.saveCheckpoint(context.id, checkpoint);
      }
      
    } catch (error) {
      context.failPhase(phase.name, error);
      
      // Retry logic if configured
      if (phase.retry && phase.retry.maxAttempts > 1) {
        await this.retryPhase(phase, context, error);
      } else {
        throw error;
      }
    }
  }

  async executeStep(step, phase, context) {
    const strategy = this.stepStrategies.get(step.type) || this.stepStrategies.get('custom');
    
    if (!strategy) {
      throw new Error(`No execution strategy found for step type: ${step.type}`);
    }
    
    try {
      const result = await strategy(step, phase, context);
      return {
        type: step.type,
        status: 'completed',
        result,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        type: step.type,
        status: 'failed',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  async executeAgentQuery(step, phase, context) {
    if (!this.agentManager) {
      throw new Error('Agent manager not configured');
    }
    
    const agentId = step.agent;
    const prompt = this.renderTemplate(step.prompt || step.text, context);
    
    const response = await this.agentManager.queryAgent(agentId, prompt, {
      timeout: phase.timeout,
      signal: context.getAbortSignal()
    });
    
    return response;
  }

  async executeValidation(step, phase, context) {
    const validation = step.validation;
    const templateContext = context.getTemplateContext();
    
    // Simple validation implementation
    const expression = this.renderTemplate(validation, context);
    const result = eval(expression); // In production, use a safe expression evaluator
    
    if (!result) {
      throw new Error(`Validation failed: ${validation}`);
    }
    
    return { validated: true, expression: validation };
  }

  async executeAggregation(step, phase, context) {
    const aggregationType = step.aggregation;
    const phaseData = context.getPhase(phase.name);
    
    switch (aggregationType) {
      case 'responses':
        return this.aggregateResponses(phaseData.agentResponses);
      case 'consensus':
        return this.buildConsensus(phaseData.agentResponses);
      case 'summary':
        return this.generateSummary(phaseData);
      default:
        return { type: aggregationType, data: phaseData };
    }
  }

  async executeWait(step, phase, context) {
    const duration = step.duration || 1000;
    await new Promise(resolve => setTimeout(resolve, duration));
    return { waited: duration };
  }

  async executeCustomStep(step, phase, context) {
    // Custom step execution - can be extended
    this.logger.info(`Executing custom step: ${step.text}`);
    return { custom: true, step: step.text };
  }

  async getAgentResponse(agentId, phase, context) {
    if (!this.agentManager) {
      return {
        agentId,
        response: 'Agent manager not configured',
        status: 'skipped'
      };
    }

    const maxRetries = context.task.metadata.retry?.maxAttempts || 3;
    const backoffMs = context.task.metadata.retry?.backoffMs || 1000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const prompt = this.buildAgentPrompt(agentId, phase, context);
        const response = await this.agentManager.queryAgent(agentId, prompt, {
          timeout: phase.timeout,
          signal: context.getAbortSignal()
        });
        
        return {
          agentId,
          prompt,
          response,
          status: 'completed',
          attempts: attempt,
          timestamp: Date.now()
        };
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        const delay = backoffMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  buildAgentPrompt(agentId, phase, context) {
    const templateContext = context.getTemplateContext();
    
    // Build contextual prompt
    const basePrompt = `
Phase: ${phase.name}
Task: ${context.taskName}
Input: {{json input}}

Previous Phases:
{{#each phases}}
  - {{@key}}: {{this.status}}
{{/each}}

Please provide your analysis for this phase.
`;
    
    return this.renderTemplate(basePrompt, templateContext);
  }

  renderTemplate(template, context) {
    if (!template) return '';
    
    const templateContext = context.getTemplateContext ? 
      context.getTemplateContext() : context;
    
    try {
      const compiled = this.templateEngine.compile(template);
      return compiled(templateContext);
    } catch (error) {
      this.logger.warn(`Template rendering failed: ${error.message}`);
      return template;
    }
  }

  async generatePhaseOutputs(phase, context) {
    const outputs = {};
    const phaseData = context.getPhase(phase.name);
    
    for (const outputSpec of phase.outputs) {
      if (typeof outputSpec === 'string') {
        // Simple output - aggregate all responses
        outputs[outputSpec] = {
          agentResponses: phaseData.agentResponses,
          steps: phaseData.steps
        };
      } else if (typeof outputSpec === 'object') {
        // Complex output with transformation
        outputs[outputSpec.name] = await this.transformOutput(
          outputSpec,
          phaseData,
          context
        );
      }
    }
    
    return outputs;
  }

  async transformOutput(spec, phaseData, context) {
    // Output transformation logic
    switch (spec.type) {
      case 'consensus':
        return this.buildConsensus(phaseData.agentResponses);
      case 'summary':
        return this.generateSummary(phaseData);
      case 'aggregate':
        return this.aggregateResponses(phaseData.agentResponses);
      default:
        return phaseData;
    }
  }

  aggregateResponses(responses) {
    const aggregated = {
      responses: [],
      consensus: null,
      divergence: []
    };
    
    for (const [agentId, response] of Object.entries(responses)) {
      if (response.status === 'completed') {
        aggregated.responses.push({
          agent: agentId,
          response: response.response
        });
      }
    }
    
    return aggregated;
  }

  buildConsensus(responses) {
    // Simple consensus building
    const opinions = Object.values(responses)
      .filter(r => r.status === 'completed')
      .map(r => r.response);
    
    return {
      totalAgents: Object.keys(responses).length,
      responded: opinions.length,
      consensus: opinions.length > 0 ? 'Partial consensus reached' : 'No consensus',
      opinions
    };
  }

  generateSummary(phaseData) {
    return {
      phase: phaseData.name,
      status: phaseData.status,
      duration: phaseData.duration,
      stepsCompleted: phaseData.steps.filter(s => s.status === 'completed').length,
      totalSteps: phaseData.steps.length,
      agentsResponded: Object.keys(phaseData.agentResponses).length
    };
  }

  async retryPhase(phase, context, error) {
    const maxAttempts = phase.retry.maxAttempts || 3;
    const backoffMs = phase.retry.backoffMs || 1000;
    
    for (let attempt = 2; attempt <= maxAttempts; attempt++) {
      this.logger.info(`Retrying phase ${phase.name}, attempt ${attempt}/${maxAttempts}`);
      
      // Exponential backoff
      const delay = backoffMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      try {
        // Reset phase status
        const phaseData = context.getPhase(phase.name);
        phaseData.status = 'retrying';
        phaseData.errors = [];
        
        // Retry execution
        await this.executePhase(phase, context);
        return; // Success
      } catch (retryError) {
        if (attempt === maxAttempts) {
          throw retryError;
        }
      }
    }
  }

  handleTimeout(context) {
    // Clean up resources
    for (const phase of context.phases) {
      if (phase.status === 'running') {
        context.failPhase(phase.name, new Error('Execution timeout'));
      }
    }
    
    // Save state if history store is available
    if (this.historyStore) {
      this.historyStore.save(context.toJSON()).catch(err => {
        this.logger.error('Failed to save timeout state:', err);
      });
    }
  }

  formatOutput(context) {
    return {
      executionId: context.id,
      taskName: context.taskName,
      status: context.status,
      duration: context.getDuration(),
      input: context.input,
      phases: context.getAllOutputs(),
      results: context.results,
      summary: context.getSummary()
    };
  }

  async pauseExecution(executionId, reason) {
    const context = this.activeExecutions.get(executionId);
    if (context) {
      context.pause(reason);
      
      if (this.historyStore) {
        await this.historyStore.save(context.toJSON());
      }
      
      return true;
    }
    return false;
  }

  async resumeExecution(executionId) {
    const context = this.activeExecutions.get(executionId);
    if (context) {
      context.resume();
      return true;
    }
    
    // Try to load from history
    if (this.historyStore) {
      const saved = await this.historyStore.load(executionId);
      if (saved) {
        const context = ExecutionContext.fromJSON(saved);
        context.resume();
        
        // Re-execute from last checkpoint
        this.activeExecutions.set(executionId, context);
        await this.executePhases(context.task.phases, context);
        return true;
      }
    }
    
    return false;
  }

  async abortExecution(executionId, reason) {
    const context = this.activeExecutions.get(executionId);
    if (context) {
      context.abort(reason);
      
      if (this.historyStore) {
        await this.historyStore.save(context.toJSON());
      }
      
      return true;
    }
    return false;
  }

  getActiveExecutions() {
    return Array.from(this.activeExecutions.values()).map(ctx => ctx.getSummary());
  }

  async getExecutionHistory(limit = 10) {
    if (this.historyStore) {
      return await this.historyStore.list(limit);
    }
    return [];
  }
}

module.exports = TaskExecutorV2;