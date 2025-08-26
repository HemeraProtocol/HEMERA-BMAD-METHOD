# Task Execution Framework Documentation

## Overview

The Task Execution Framework is a sophisticated, event-driven system designed to orchestrate multi-phase, multi-agent workflows for the Investment Committee. Built with modularity, resilience, and performance in mind, it provides a robust foundation for complex decision-making processes.

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────┐
│                   TaskExecutorV2                     │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ TaskParser  │  │ ExecutionContext  │HistoryStore│ │
│  └─────────────┘  └──────────────┘  └────────────┘ │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │AgentManager │  │StepStrategies│  │TemplateEngine│
│  └─────────────┘  └──────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Module Descriptions

#### TaskExecutorV2
The main orchestrator that manages task execution lifecycle, phase dependencies, and parallel execution.

**Key Features:**
- Dependency graph resolution for phases
- Parallel phase execution with concurrency control
- Abort signal propagation
- Event-driven architecture
- Retry logic with exponential backoff

#### TaskParser
Parses markdown-based task definitions into executable task objects.

**Capabilities:**
- YAML metadata extraction
- Phase dependency validation
- Circular dependency detection
- Step type identification
- Time string parsing

#### ExecutionContext
Manages the state of a single task execution instance.

**Features:**
- Phase lifecycle management
- Checkpoint creation and restoration
- Abort controller integration
- Template context generation
- JSON serialization/deserialization

## Task Definition Format

Tasks are defined in markdown files with embedded YAML configuration:

```markdown
# Task Name

```yaml
name: Task Name
description: Task description
version: 1.0.0
maxExecutionTime: 5 minutes
retry:
  maxAttempts: 3
  backoffMs: 2000
requirements:
  field1: type
  field2: type
```

## Phase: Phase Name
dependsOn: [Previous Phase]
parallel: true/false

### Steps
- Step description
- agent: agent-id - Agent query step
- validation: condition - Validation step
- aggregate: type - Aggregation step

### Agents
- agent-id-1
- agent-id-2

### Outputs
- output-specification
```

## Usage Examples

### Basic Task Execution

```javascript
const TaskExecutorV2 = require('./task-executor-v2');

const executor = new TaskExecutorV2({
  tasksDir: './tasks',
  agentManager: agentManager,
  historyStore: historyStore,
  maxExecutionTime: 300000 // 5 minutes
});

// Execute investment committee meeting
const result = await executor.execute('investment-committee-meeting', {
  ticker: 'BTC',
  amount: 10000,
  timeHorizon: '30 days',
  riskTolerance: 'medium'
});

console.log(result.verdict);
```

### Event Handling

```javascript
executor.on('execution:start', (data) => {
  console.log(`Execution ${data.id} started`);
});

executor.on('phase:complete', (data) => {
  console.log(`Phase ${data.phase} completed in ${data.duration}ms`);
});

executor.on('execution:error', (data) => {
  console.error(`Execution failed: ${data.error}`);
});
```

### Custom Step Strategies

```javascript
// Register custom step handler
executor.registerStepStrategy('custom-analysis', async (step, phase, context) => {
  // Custom logic here
  const result = await performCustomAnalysis(step.parameters);
  return result;
});
```

### Pause and Resume

```javascript
// Start execution
const executionPromise = executor.execute('long-task', params);

// Pause execution
await executor.pauseExecution(executionId, 'User requested pause');

// Resume later
await executor.resumeExecution(executionId);

// Wait for completion
const result = await executionPromise;
```

## Task Examples

### Investment Committee Meeting

A comprehensive 7-phase workflow:
1. **Activation** - Initialize and validate inputs
2. **Analysis** - Parallel agent analysis
3. **Round Table** - Sequential stakeholder presentations
4. **Debate** - Red team challenges
5. **Validation** - Technical and compliance checks
6. **Consensus** - Build committee agreement
7. **Verdict** - Final decision and implementation plan

**Execution Time:** < 5 minutes
**Agents Involved:** 10-15 specialists
**Output:** Structured investment decision with risk analysis

### Daily Market Analysis

Rapid 4-phase analysis for daily questions:
1. **Question Classification** - Identify question type
2. **Contextual Agent Selection** - Dynamic agent activation
3. **Rapid Analysis** - Parallel quick analysis
4. **Answer Synthesis** - Generate actionable answer

**Execution Time:** < 30 seconds
**Agents Involved:** 3-5 specialists
**Output:** Concise, actionable market insights

## Performance Optimization

### Parallel Execution
- Phases with no dependencies execute concurrently
- Agent queries within a phase run in parallel
- Configurable concurrency limits prevent resource exhaustion

### Caching Strategy
- Task definitions cached after first parse
- Agent responses can be cached with TTL
- Checkpoint system enables fast recovery

### Resource Management
- Abort signals propagate to all active operations
- Timeout enforcement at task and phase levels
- Memory-efficient streaming for large outputs

## Error Handling

### Retry Mechanism
```yaml
retry:
  maxAttempts: 3
  backoffMs: 2000  # Exponential backoff
```

### Failure Modes
1. **Agent Failure** - Individual agent failures don't stop execution
2. **Phase Failure** - Retries with exponential backoff
3. **Task Timeout** - Graceful shutdown with partial results
4. **Validation Failure** - Early termination with clear error

### Recovery
- Automatic checkpoint creation after critical phases
- Resume from last successful checkpoint
- Persistent history for audit trail

## Monitoring and Debugging

### Event Stream
The framework emits detailed events for monitoring:
- `execution:start` - Task execution begins
- `phase:start` - Phase execution begins
- `phase:complete` - Phase completes successfully
- `phase:failed` - Phase encounters error
- `execution:complete` - Task completes
- `execution:error` - Task fails
- `execution:timeout` - Task exceeds time limit

### Execution History
```javascript
// Get recent executions
const history = await executor.getExecutionHistory(10);

// Get active executions
const active = executor.getActiveExecutions();
```

### Debug Mode
Enable detailed logging:
```javascript
const executor = new TaskExecutorV2({
  logger: {
    debug: console.log,
    info: console.log,
    warn: console.warn,
    error: console.error
  }
});
```

## Best Practices

### Task Design
1. **Keep phases focused** - Single responsibility per phase
2. **Declare dependencies explicitly** - Enables parallelization
3. **Set realistic timeouts** - Prevent hanging executions
4. **Include validation steps** - Fail fast on bad data
5. **Design for idempotency** - Support safe retries

### Agent Integration
1. **Handle agent unavailability** - Graceful degradation
2. **Specify agent timeouts** - Prevent blocking
3. **Validate agent responses** - Ensure data quality
4. **Use agent pools** - Load distribution

### Production Deployment
1. **Configure history store** - Use persistent storage
2. **Set up monitoring** - Track execution metrics
3. **Implement alerting** - Notify on failures
4. **Plan capacity** - Size for concurrent executions
5. **Regular backups** - Preserve execution history

## API Reference

### TaskExecutorV2

#### Constructor Options
```javascript
{
  tasksDir: string,           // Directory containing task files
  agentManager: object,       // Agent communication interface
  historyStore: object,       // Execution history storage
  logger: object,            // Logging interface
  maxExecutionTime: number,  // Global timeout (ms)
  maxConcurrentPhases: number // Parallel phase limit
}
```

#### Methods
- `execute(taskName, input)` - Execute a task
- `pauseExecution(executionId, reason)` - Pause running execution
- `resumeExecution(executionId)` - Resume paused execution
- `abortExecution(executionId, reason)` - Abort execution
- `getActiveExecutions()` - List active executions
- `getExecutionHistory(limit)` - Get execution history
- `registerStepStrategy(type, handler)` - Add custom step handler

### ExecutionContext

#### Methods
- `start()` - Begin execution
- `complete()` - Mark as completed
- `fail(error)` - Mark as failed
- `abort(reason)` - Abort execution
- `timeout()` - Handle timeout
- `pause(reason)` - Pause execution
- `resume()` - Resume from pause
- `startPhase(name)` - Begin phase
- `completePhase(name, outputs)` - Complete phase
- `createCheckpoint(label)` - Create checkpoint
- `restoreCheckpoint(id)` - Restore from checkpoint
- `getAbortSignal()` - Get abort signal
- `toJSON()` - Serialize to JSON
- `fromJSON(json)` - Deserialize from JSON

### TaskParser

#### Methods
- `parseTaskFile(path)` - Parse task from file
- `parseTaskContent(content)` - Parse task from string
- `validateTaskRequirements(task, context)` - Validate inputs
- `parseTimeString(str)` - Parse time duration

## Testing

The framework includes comprehensive test coverage:

```bash
npm test

# Run specific test suite
npm test -- task-executor.test.js

# With coverage
npm test -- --coverage
```

### Test Categories
- **Unit Tests** - Individual component testing
- **Integration Tests** - Multi-component workflows
- **Performance Tests** - Execution time validation
- **Error Scenarios** - Failure handling
- **Concurrency Tests** - Parallel execution

## Future Enhancements

### Planned Features
1. **Distributed Execution** - Multi-node task distribution
2. **Web UI Dashboard** - Visual execution monitoring
3. **Task Versioning** - Support multiple task versions
4. **Dynamic Task Composition** - Runtime task assembly
5. **Machine Learning Integration** - Predictive phase timing

### Performance Improvements
1. **Worker Thread Pool** - CPU-intensive step execution
2. **Redis Cache Layer** - Distributed caching
3. **GraphQL API** - Efficient data fetching
4. **WebSocket Updates** - Real-time execution status

## Support

For issues, feature requests, or questions:
- GitHub Issues: [Project Repository]
- Documentation: This file
- Examples: `/tasks` directory
- Tests: `/tests` directory