const TaskExecutorV2 = require('../src/services/task-executor-v2');
const TaskParser = require('../src/services/task-parser');
const ExecutionContext = require('../src/services/execution-context');
const path = require('path');
const fs = require('fs').promises;

describe('TaskExecutorV2', () => {
  let executor;
  let mockAgentManager;
  let mockHistoryStore;

  beforeEach(() => {
    mockAgentManager = {
      queryAgent: jest.fn().mockResolvedValue({
        response: 'Agent response',
        confidence: 0.85
      })
    };

    mockHistoryStore = {
      save: jest.fn().mockResolvedValue(true),
      load: jest.fn().mockResolvedValue(null),
      findResumable: jest.fn().mockResolvedValue(null),
      saveCheckpoint: jest.fn().mockResolvedValue(true),
      list: jest.fn().mockResolvedValue([])
    };

    executor = new TaskExecutorV2({
      tasksDir: path.join(__dirname, '../../tasks'),
      agentManager: mockAgentManager,
      historyStore: mockHistoryStore,
      maxExecutionTime: 10000
    });
  });

  describe('Task Execution', () => {
    test('should execute a simple task successfully', async () => {
      const result = await executor.execute('investment-committee-meeting', {
        ticker: 'BTC',
        amount: 10000,
        timeHorizon: '30 days',
        riskTolerance: 'medium'
      });

      expect(result).toHaveProperty('executionId');
      expect(result).toHaveProperty('status', 'completed');
      expect(result).toHaveProperty('taskName', 'investment-committee-meeting');
      expect(result).toHaveProperty('phases');
    });

    test('should validate task requirements', async () => {
      await expect(
        executor.execute('investment-committee-meeting', {
          // Missing required fields
          ticker: 'BTC'
        })
      ).rejects.toThrow(/requirements not met/i);
    });

    test('should handle task timeout', async () => {
      executor.maxExecutionTime = 100; // Very short timeout

      const promise = executor.execute('investment-committee-meeting', {
        ticker: 'BTC',
        amount: 10000,
        timeHorizon: '30 days',
        riskTolerance: 'medium'
      });

      await expect(promise).rejects.toThrow();
    }, 10000);

    test('should execute phases with dependencies in correct order', async () => {
      const phaseOrder = [];
      
      executor.on('phase:started', (data) => {
        phaseOrder.push(data.phase);
      });

      await executor.execute('investment-committee-meeting', {
        ticker: 'BTC',
        amount: 10000,
        timeHorizon: '30 days',
        riskTolerance: 'medium'
      });

      // Check that Activation comes before Analysis
      const activationIndex = phaseOrder.indexOf('Activation');
      const analysisIndex = phaseOrder.indexOf('Analysis');
      expect(activationIndex).toBeLessThan(analysisIndex);

      // Check that Analysis comes before Round Table
      const roundTableIndex = phaseOrder.indexOf('Round Table');
      expect(analysisIndex).toBeLessThan(roundTableIndex);
    });

    test('should retry failed phases with exponential backoff', async () => {
      let attemptCount = 0;
      mockAgentManager.queryAgent.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 2) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({ response: 'Success', confidence: 0.9 });
      });

      const result = await executor.execute('investment-committee-meeting', {
        ticker: 'ETH',
        amount: 5000,
        timeHorizon: '7 days',
        riskTolerance: 'low'
      });

      expect(result.status).toBe('completed');
      expect(attemptCount).toBeGreaterThan(1);
    });
  });

  describe('Agent Integration', () => {
    test('should query multiple agents in parallel', async () => {
      const result = await executor.execute('investment-committee-meeting', {
        ticker: 'BTC',
        amount: 10000,
        timeHorizon: '30 days',
        riskTolerance: 'medium'
      });

      // Should have queried multiple agents
      expect(mockAgentManager.queryAgent).toHaveBeenCalledTimes(
        expect.any(Number)
      );
      
      // Check that different agents were queried
      const agentCalls = mockAgentManager.queryAgent.mock.calls;
      const uniqueAgents = new Set(agentCalls.map(call => call[0]));
      expect(uniqueAgents.size).toBeGreaterThan(1);
    });

    test('should handle agent failures gracefully', async () => {
      mockAgentManager.queryAgent.mockRejectedValueOnce(
        new Error('Agent unavailable')
      );

      const result = await executor.execute('investment-committee-meeting', {
        ticker: 'BTC',
        amount: 10000,
        timeHorizon: '30 days',
        riskTolerance: 'medium'
      });

      // Should still complete even with some agent failures
      expect(result.status).toBe('completed');
    });
  });

  describe('State Management', () => {
    test('should save execution history', async () => {
      await executor.execute('investment-committee-meeting', {
        ticker: 'BTC',
        amount: 10000,
        timeHorizon: '30 days',
        riskTolerance: 'medium'
      });

      expect(mockHistoryStore.save).toHaveBeenCalled();
      const savedData = mockHistoryStore.save.mock.calls[0][0];
      expect(savedData).toHaveProperty('id');
      expect(savedData).toHaveProperty('taskName');
      expect(savedData).toHaveProperty('status');
    });

    test('should resume from checkpoint', async () => {
      const checkpoint = {
        id: 'exec_123',
        taskName: 'investment-committee-meeting',
        status: 'paused',
        phases: [
          { name: 'Activation', status: 'completed' }
        ],
        lastCheckpoint: 'checkpoint_1'
      };

      mockHistoryStore.findResumable.mockResolvedValueOnce(checkpoint);

      const result = await executor.execute('investment-committee-meeting', {
        ticker: 'BTC',
        amount: 10000,
        timeHorizon: '30 days',
        riskTolerance: 'medium'
      });

      expect(result.status).toBe('completed');
    });

    test('should handle pause and resume', async () => {
      const executionPromise = executor.execute('investment-committee-meeting', {
        ticker: 'BTC',
        amount: 10000,
        timeHorizon: '30 days',
        riskTolerance: 'medium'
      });

      // Get execution ID from active executions
      const activeExecs = executor.getActiveExecutions();
      expect(activeExecs.length).toBeGreaterThan(0);
      const execId = activeExecs[0].id;

      // Pause execution
      const paused = await executor.pauseExecution(execId, 'User requested');
      expect(paused).toBe(true);

      // Resume execution
      const resumed = await executor.resumeExecution(execId);
      expect(resumed).toBe(true);

      const result = await executionPromise;
      expect(result).toBeDefined();
    });
  });

  describe('Daily Analysis Task', () => {
    test('should execute daily analysis in under 30 seconds', async () => {
      const startTime = Date.now();
      
      const result = await executor.execute('daily-market-analysis', {
        question: 'Why is BTC up?',
        ticker: 'BTC',
        priceChange: 5.2,
        volume: 1000000000,
        marketContext: {
          regime: 'bull',
          volatility: 'medium'
        }
      });

      const executionTime = Date.now() - startTime;
      
      expect(result.status).toBe('completed');
      expect(executionTime).toBeLessThan(30000);
      expect(result).toHaveProperty('phases');
    });

    test('should activate different agents based on question type', async () => {
      // Price movement question
      await executor.execute('daily-market-analysis', {
        question: 'Why is ETH down?',
        ticker: 'ETH',
        priceChange: -8.5,
        volume: 500000000,
        marketContext: { regime: 'bear' }
      });

      const priceAgentCalls = mockAgentManager.queryAgent.mock.calls
        .filter(call => call[0].includes('market-analyst'));
      expect(priceAgentCalls.length).toBeGreaterThan(0);

      // Clear mock
      mockAgentManager.queryAgent.mockClear();

      // Action recommendation question
      await executor.execute('daily-market-analysis', {
        question: 'Should I sell BTC?',
        ticker: 'BTC',
        priceChange: -2.1,
        volume: 800000000,
        marketContext: { regime: 'volatile' }
      });

      const riskAgentCalls = mockAgentManager.queryAgent.mock.calls
        .filter(call => call[0].includes('risk-manager'));
      expect(riskAgentCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing task file', async () => {
      await expect(
        executor.execute('non-existent-task', {})
      ).rejects.toThrow(/not found/i);
    });

    test('should handle malformed task file', async () => {
      // Create a malformed task file for testing
      const malformedTaskPath = path.join(
        __dirname,
        '../../tasks',
        'malformed-test.md'
      );
      
      await fs.writeFile(malformedTaskPath, 'This is not a valid task format', 'utf8');

      await expect(
        executor.execute('malformed-test', {})
      ).rejects.toThrow();

      // Clean up
      await fs.unlink(malformedTaskPath);
    });

    test('should emit error events', async () => {
      const errorHandler = jest.fn();
      executor.on('execution:error', errorHandler);

      await expect(
        executor.execute('non-existent-task', {})
      ).rejects.toThrow();

      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('Template Rendering', () => {
    test('should render templates with context', () => {
      const context = {
        getTemplateContext: () => ({
          input: { ticker: 'BTC', amount: 10000 },
          phases: {
            Activation: { status: 'completed', outputs: { data: 'test' } }
          }
        })
      };

      const template = 'Analyzing {{input.ticker}} for {{input.amount}}';
      const rendered = executor.renderTemplate(template, context);
      
      expect(rendered).toBe('Analyzing BTC for 10000');
    });

    test('should handle template errors gracefully', () => {
      const context = { input: {} };
      const badTemplate = '{{#each undefined}}{{/each}}';
      
      const rendered = executor.renderTemplate(badTemplate, context);
      expect(rendered).toBe(badTemplate); // Should return original on error
    });
  });

  describe('Parallel Phase Execution', () => {
    test('should execute independent phases in parallel', async () => {
      const executionTimes = [];
      
      executor.on('phase:started', (data) => {
        executionTimes.push({ phase: data.phase, time: Date.now() });
      });

      await executor.execute('investment-committee-meeting', {
        ticker: 'BTC',
        amount: 10000,
        timeHorizon: '30 days',
        riskTolerance: 'medium'
      });

      // Check if any phases started at approximately the same time
      // (within 100ms of each other indicates parallel execution)
      const parallelPhases = executionTimes.filter((et1, i) => {
        return executionTimes.some((et2, j) => {
          if (i === j) return false;
          return Math.abs(et1.time - et2.time) < 100;
        });
      });

      // Should have some parallel execution
      expect(parallelPhases.length).toBeGreaterThan(0);
    });

    test('should respect dependency order', async () => {
      const phaseCompletions = [];
      
      executor.on('phase:completed', (data) => {
        phaseCompletions.push(data.phase);
      });

      await executor.execute('investment-committee-meeting', {
        ticker: 'BTC',
        amount: 10000,
        timeHorizon: '30 days',
        riskTolerance: 'medium'
      });

      // Consensus should complete before Verdict
      const consensusIndex = phaseCompletions.indexOf('Consensus');
      const verdictIndex = phaseCompletions.indexOf('Verdict');
      
      expect(consensusIndex).toBeLessThan(verdictIndex);
    });
  });
});

describe('TaskParser', () => {
  let parser;
  const tasksDir = path.join(__dirname, '../../tasks');

  beforeEach(() => {
    parser = new TaskParser();
  });

  test('should parse task file correctly', async () => {
    const taskPath = path.join(tasksDir, 'investment-committee-meeting.md');
    const task = await parser.parseTaskFile(taskPath);

    expect(task).toHaveProperty('id', 'investment-committee-meeting');
    expect(task).toHaveProperty('phases');
    expect(task.phases.length).toBeGreaterThan(0);
    expect(task).toHaveProperty('metadata');
  });

  test('should parse phase dependencies', async () => {
    const taskPath = path.join(tasksDir, 'investment-committee-meeting.md');
    const task = await parser.parseTaskFile(taskPath);

    const analysisPhase = task.phases.find(p => p.name === 'Analysis');
    expect(analysisPhase).toBeDefined();
    expect(analysisPhase.dependsOn).toContain('Activation');
  });

  test('should validate phase dependencies', () => {
    const phases = [
      { name: 'A', dependsOn: [] },
      { name: 'B', dependsOn: ['A'] },
      { name: 'C', dependsOn: ['B', 'D'] },
      { name: 'D', dependsOn: ['A'] }
    ];

    expect(() => parser.validatePhaseDependencies(phases)).not.toThrow();
  });

  test('should detect circular dependencies', () => {
    const phases = [
      { name: 'A', dependsOn: ['C'] },
      { name: 'B', dependsOn: ['A'] },
      { name: 'C', dependsOn: ['B'] }
    ];

    expect(() => parser.validatePhaseDependencies(phases)).toThrow(/circular/i);
  });

  test('should parse time strings correctly', () => {
    expect(parser.parseTimeString('5 minutes')).toBe(300000);
    expect(parser.parseTimeString('30 seconds')).toBe(30000);
    expect(parser.parseTimeString('2 hours')).toBe(7200000);
    expect(parser.parseTimeString('1m')).toBe(60000);
    expect(parser.parseTimeString(5000)).toBe(5000);
  });
});

describe('ExecutionContext', () => {
  let context;

  beforeEach(() => {
    context = new ExecutionContext({
      taskName: 'test-task',
      input: { ticker: 'BTC' }
    });
  });

  test('should manage execution lifecycle', () => {
    expect(context.status).toBe('pending');
    
    context.start();
    expect(context.status).toBe('running');
    expect(context.startTime).toBeDefined();
    
    context.complete();
    expect(context.status).toBe('completed');
    expect(context.endTime).toBeDefined();
  });

  test('should manage phases', () => {
    context.start();
    
    const phase = context.startPhase('TestPhase');
    expect(phase.status).toBe('running');
    
    context.addStepResult('TestPhase', 'step1', { result: 'ok' });
    context.addAgentResponse('TestPhase', 'agent1', { response: 'test' });
    
    context.completePhase('TestPhase', { output: 'data' });
    expect(phase.status).toBe('completed');
    expect(phase.outputs).toEqual({ output: 'data' });
  });

  test('should create and restore checkpoints', () => {
    context.start();
    context.startPhase('Phase1');
    context.completePhase('Phase1', { data: 'test' });
    
    const checkpoint = context.createCheckpoint('After Phase1');
    expect(checkpoint.id).toBeDefined();
    
    // Modify context
    context.startPhase('Phase2');
    context.fail(new Error('Test error'));
    
    // Restore checkpoint
    const restored = context.restoreCheckpoint(checkpoint.id);
    expect(restored).toBe(true);
    expect(context.status).toBe('running'); // Back to checkpoint state
  });

  test('should handle abort signal', () => {
    const signal = context.getAbortSignal();
    expect(signal.aborted).toBe(false);
    
    context.abort('Test abort');
    expect(signal.aborted).toBe(true);
    expect(context.status).toBe('aborted');
  });

  test('should serialize and deserialize', () => {
    context.start();
    context.startPhase('Phase1');
    context.setResult('key', 'value');
    
    const json = context.toJSON();
    expect(json).toHaveProperty('id');
    expect(json).toHaveProperty('taskName', 'test-task');
    
    const restored = ExecutionContext.fromJSON(json);
    expect(restored.id).toBe(context.id);
    expect(restored.getResult('key')).toBe('value');
  });

  test('should provide template context', () => {
    context.start();
    context.startPhase('Phase1');
    context.completePhase('Phase1', { output: 'data1' });
    context.setResult('finalResult', 'completed');
    
    const templateContext = context.getTemplateContext();
    expect(templateContext).toHaveProperty('input.ticker', 'BTC');
    expect(templateContext).toHaveProperty('phases.Phase1.outputs.output', 'data1');
    expect(templateContext).toHaveProperty('results.finalResult', 'completed');
  });
});