const { EventEmitter } = require('events');

class ExecutionContext extends EventEmitter {
  constructor(options = {}) {
    super();
    this.id = options.id || `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.taskName = options.taskName;
    this.task = options.task;
    this.input = options.input || {};
    this.status = 'pending';
    this.phases = [];
    this.currentPhase = null;
    this.results = {};
    this.errors = [];
    this.startTime = null;
    this.endTime = null;
    this.abortController = new AbortController();
    this.checkpoints = [];
    this.metadata = options.metadata || {};
  }

  start() {
    this.status = 'running';
    this.startTime = Date.now();
    this.emit('started', { id: this.id, taskName: this.taskName });
    return this;
  }

  complete() {
    this.status = 'completed';
    this.endTime = Date.now();
    this.emit('completed', this.getSummary());
    return this;
  }

  fail(error) {
    this.status = 'failed';
    this.endTime = Date.now();
    this.errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      phase: this.currentPhase
    });
    this.emit('failed', { id: this.id, error: error.message });
    return this;
  }

  abort(reason = 'User requested abort') {
    this.status = 'aborted';
    this.endTime = Date.now();
    this.abortController.abort(reason);
    this.emit('aborted', { id: this.id, reason });
    return this;
  }

  timeout() {
    this.status = 'timeout';
    this.endTime = Date.now();
    this.abort('Execution timeout exceeded');
    this.emit('timeout', { id: this.id, duration: this.getDuration() });
    return this;
  }

  pause(reason = 'Paused for manual intervention') {
    this.status = 'paused';
    this.emit('paused', { id: this.id, reason });
    return this;
  }

  resume() {
    if (this.status === 'paused') {
      this.status = 'running';
      this.emit('resumed', { id: this.id });
    }
    return this;
  }

  startPhase(phaseName) {
    const phase = {
      name: phaseName,
      status: 'running',
      startTime: Date.now(),
      endTime: null,
      duration: null,
      steps: [],
      agentResponses: {},
      outputs: {},
      errors: []
    };
    
    this.currentPhase = phaseName;
    this.phases.push(phase);
    this.emit('phase:started', { id: this.id, phase: phaseName });
    
    return phase;
  }

  completePhase(phaseName, outputs = {}) {
    const phase = this.getPhase(phaseName);
    if (phase) {
      phase.status = 'completed';
      phase.endTime = Date.now();
      phase.duration = phase.endTime - phase.startTime;
      phase.outputs = outputs;
      this.emit('phase:completed', { 
        id: this.id, 
        phase: phaseName, 
        duration: phase.duration 
      });
    }
    return phase;
  }

  failPhase(phaseName, error) {
    const phase = this.getPhase(phaseName);
    if (phase) {
      phase.status = 'failed';
      phase.endTime = Date.now();
      phase.duration = phase.endTime - phase.startTime;
      phase.errors.push({
        message: error.message,
        stack: error.stack,
        timestamp: Date.now()
      });
      this.emit('phase:failed', { 
        id: this.id, 
        phase: phaseName, 
        error: error.message 
      });
    }
    return phase;
  }

  addStepResult(phaseName, step, result) {
    const phase = this.getPhase(phaseName);
    if (phase) {
      phase.steps.push({
        step,
        result,
        timestamp: Date.now()
      });
    }
  }

  addAgentResponse(phaseName, agentId, response) {
    const phase = this.getPhase(phaseName);
    if (phase) {
      phase.agentResponses[agentId] = {
        ...response,
        timestamp: Date.now()
      };
    }
  }

  setPhaseOutput(phaseName, key, value) {
    const phase = this.getPhase(phaseName);
    if (phase) {
      phase.outputs[key] = value;
    }
  }

  getPhase(phaseName) {
    return this.phases.find(p => p.name === phaseName);
  }

  getCompletedPhases() {
    return this.phases.filter(p => p.status === 'completed');
  }

  getPendingPhases(allPhases) {
    const completedNames = new Set(this.phases.map(p => p.name));
    return allPhases.filter(p => !completedNames.has(p.name));
  }

  canExecutePhase(phase) {
    if (!phase.dependsOn || phase.dependsOn.length === 0) {
      return true;
    }
    
    const completedPhases = new Set(
      this.phases
        .filter(p => p.status === 'completed')
        .map(p => p.name)
    );
    
    return phase.dependsOn.every(dep => completedPhases.has(dep));
  }

  createCheckpoint(label = '') {
    const checkpoint = {
      id: `checkpoint_${this.checkpoints.length + 1}`,
      label,
      timestamp: Date.now(),
      status: this.status,
      phases: JSON.parse(JSON.stringify(this.phases)),
      results: JSON.parse(JSON.stringify(this.results))
    };
    
    this.checkpoints.push(checkpoint);
    this.emit('checkpoint:created', { id: this.id, checkpoint: checkpoint.id });
    
    return checkpoint;
  }

  restoreCheckpoint(checkpointId) {
    const checkpoint = this.checkpoints.find(cp => cp.id === checkpointId);
    if (checkpoint) {
      this.status = checkpoint.status;
      this.phases = JSON.parse(JSON.stringify(checkpoint.phases));
      this.results = JSON.parse(JSON.stringify(checkpoint.results));
      this.emit('checkpoint:restored', { id: this.id, checkpoint: checkpointId });
      return true;
    }
    return false;
  }

  getDuration() {
    if (!this.startTime) return 0;
    const endTime = this.endTime || Date.now();
    return endTime - this.startTime;
  }

  getSummary() {
    return {
      id: this.id,
      taskName: this.taskName,
      status: this.status,
      duration: this.getDuration(),
      startTime: this.startTime,
      endTime: this.endTime,
      input: this.input,
      phases: this.phases.map(p => ({
        name: p.name,
        status: p.status,
        duration: p.duration,
        outputs: p.outputs,
        errorCount: p.errors.length
      })),
      results: this.results,
      errorCount: this.errors.length,
      metadata: this.metadata
    };
  }

  toJSON() {
    return {
      id: this.id,
      taskName: this.taskName,
      status: this.status,
      startTime: this.startTime,
      endTime: this.endTime,
      input: this.input,
      phases: this.phases,
      results: this.results,
      errors: this.errors,
      checkpoints: this.checkpoints.map(cp => ({
        id: cp.id,
        label: cp.label,
        timestamp: cp.timestamp
      })),
      metadata: this.metadata
    };
  }

  static fromJSON(json) {
    const context = new ExecutionContext({
      id: json.id,
      taskName: json.taskName,
      input: json.input,
      metadata: json.metadata
    });
    
    context.status = json.status;
    context.startTime = json.startTime;
    context.endTime = json.endTime;
    context.phases = json.phases;
    context.results = json.results;
    context.errors = json.errors;
    context.checkpoints = json.checkpoints || [];
    
    return context;
  }

  getAbortSignal() {
    return this.abortController.signal;
  }

  isAborted() {
    return this.abortController.signal.aborted;
  }

  setResult(key, value) {
    this.results[key] = value;
  }

  getResult(key) {
    return this.results[key];
  }

  getPhaseOutputs(phaseName) {
    const phase = this.getPhase(phaseName);
    return phase ? phase.outputs : {};
  }

  getAllOutputs() {
    const outputs = {};
    for (const phase of this.phases) {
      if (phase.outputs && Object.keys(phase.outputs).length > 0) {
        outputs[phase.name] = phase.outputs;
      }
    }
    return outputs;
  }

  getTemplateContext() {
    // Provides context for template rendering
    return {
      id: this.id,
      taskName: this.taskName,
      input: this.input,
      phases: this.phases.reduce((acc, phase) => {
        acc[phase.name] = {
          status: phase.status,
          outputs: phase.outputs,
          agentResponses: phase.agentResponses
        };
        return acc;
      }, {}),
      results: this.results,
      metadata: this.metadata
    };
  }
}

module.exports = ExecutionContext;