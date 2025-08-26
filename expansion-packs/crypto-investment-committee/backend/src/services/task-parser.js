const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const Joi = require('joi');

class TaskParser {
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.taskSchema = this.createTaskSchema();
  }

  createTaskSchema() {
    return Joi.object({
      id: Joi.string().required(),
      path: Joi.string().required(),
      metadata: Joi.object({
        name: Joi.string(),
        description: Joi.string(),
        version: Joi.string(),
        maxExecutionTime: Joi.alternatives().try(
          Joi.number(),
          Joi.string()
        ),
        retry: Joi.object({
          maxAttempts: Joi.number().default(3),
          backoffMs: Joi.number().default(1000)
        }),
        requirements: Joi.object().pattern(Joi.string(), Joi.any())
      }).default({}),
      phases: Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          dependsOn: Joi.array().items(Joi.string()).default([]),
          parallel: Joi.boolean().default(false),
          steps: Joi.array().items(Joi.string()).default([]),
          agents: Joi.array().items(Joi.string()).default([]),
          outputs: Joi.array().items(Joi.string()).default([]),
          timeout: Joi.number().optional()
        })
      ).min(1).required(),
      requirements: Joi.object().default({}),
      outputs: Joi.object().default({}),
      rawContent: Joi.string()
    });
  }

  async parseTaskFile(taskPath) {
    try {
      const content = await fs.readFile(taskPath, 'utf8');
      const taskName = path.basename(taskPath, '.md');
      
      const task = this.parseTaskContent(content);
      task.id = taskName;
      task.path = taskPath;
      
      // Validate the parsed task
      const { error, value } = this.taskSchema.validate(task);
      if (error) {
        throw new Error(`Task validation failed: ${error.message}`);
      }
      
      return value;
    } catch (error) {
      this.logger.error(`Failed to parse task file ${taskPath}:`, error);
      throw error;
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
    let inCodeBlock = false;
    let codeBlockDelimiter = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Handle code blocks (to avoid parsing ## inside code blocks)
      if (trimmedLine.startsWith('```') && !inYamlBlock) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockDelimiter = trimmedLine;
        } else if (trimmedLine === codeBlockDelimiter || trimmedLine === '```') {
          inCodeBlock = false;
          codeBlockDelimiter = '';
        }
        continue;
      }

      // Skip processing if we're inside a code block
      if (inCodeBlock && !inYamlBlock) {
        continue;
      }

      // Check for YAML block
      if (trimmedLine === '```yaml') {
        inYamlBlock = true;
        yamlBuffer = [];
        continue;
      }
      
      if (inYamlBlock) {
        if (trimmedLine === '```') {
          inYamlBlock = false;
          if (yamlBuffer.length > 0) {
            try {
              const yamlContent = yaml.load(yamlBuffer.join('\n'));
              this.mergeMetadata(task.metadata, yamlContent);
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
        currentPhase = this.createPhase(phaseName);
        task.phases.push(currentPhase);
        currentSection = 'phase';
      } else if (line.startsWith('## Requirements')) {
        currentSection = 'requirements';
      } else if (line.startsWith('## Output')) {
        currentSection = 'outputs';
      } else if (line.startsWith('### ') && currentPhase) {
        const subsection = line.replace('### ', '').trim().toLowerCase();
        currentSection = this.identifySubsection(subsection);
      } else if (trimmedLine.startsWith('- ') && currentSection) {
        this.parseListItem(trimmedLine.substring(2), currentSection, currentPhase, task);
      } else if (trimmedLine.startsWith('dependsOn:') && currentPhase) {
        const deps = trimmedLine.replace('dependsOn:', '').trim();
        currentPhase.dependsOn = deps.split(',').map(d => d.trim()).filter(d => d);
      } else if (trimmedLine.startsWith('parallel:') && currentPhase) {
        currentPhase.parallel = trimmedLine.includes('true');
      }
    }

    // Post-process metadata
    if (task.metadata.maxExecutionTime) {
      task.metadata.maxExecutionTime = this.parseTimeString(task.metadata.maxExecutionTime);
    }

    // Build phase dependency graph
    this.validatePhaseDependencies(task.phases);

    return task;
  }

  createPhase(name) {
    return {
      name,
      dependsOn: [],
      parallel: false,
      steps: [],
      agents: [],
      outputs: [],
      timeout: null
    };
  }

  identifySubsection(subsection) {
    if (subsection.includes('agent')) return 'agents';
    if (subsection.includes('step')) return 'steps';
    if (subsection.includes('output')) return 'phase_outputs';
    if (subsection.includes('depend')) return 'dependencies';
    return subsection;
  }

  parseListItem(item, section, currentPhase, task) {
    switch (section) {
      case 'steps':
        if (currentPhase) {
          currentPhase.steps.push(this.parseStep(item));
        }
        break;
      case 'agents':
        if (currentPhase) {
          currentPhase.agents.push(item);
        }
        break;
      case 'phase_outputs':
        if (currentPhase) {
          currentPhase.outputs.push(item);
        }
        break;
      case 'requirements':
        const [key, ...valueParts] = item.split(':');
        if (key) {
          task.requirements[key.trim()] = valueParts.join(':').trim();
        }
        break;
      case 'dependencies':
        if (currentPhase) {
          currentPhase.dependsOn.push(item);
        }
        break;
    }
  }

  parseStep(stepText) {
    // Parse step text to identify step type and parameters
    const step = { text: stepText };
    
    if (stepText.includes('agent:')) {
      step.type = 'agent_query';
      step.agent = stepText.split('agent:')[1].trim();
    } else if (stepText.includes('validate:')) {
      step.type = 'validation';
      step.validation = stepText.split('validate:')[1].trim();
    } else if (stepText.includes('aggregate:')) {
      step.type = 'aggregation';
      step.aggregation = stepText.split('aggregate:')[1].trim();
    } else if (stepText.includes('wait:')) {
      step.type = 'wait';
      step.duration = this.parseTimeString(stepText.split('wait:')[1].trim());
    } else {
      step.type = 'custom';
    }
    
    return step;
  }

  mergeMetadata(target, source) {
    for (const [key, value] of Object.entries(source)) {
      if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
        target[key] = target[key] || {};
        this.mergeMetadata(target[key], value);
      } else {
        target[key] = value;
      }
    }
  }

  parseTimeString(timeStr) {
    if (typeof timeStr === 'number') return timeStr;
    if (!timeStr) return 60000; // Default 1 minute
    
    const matches = timeStr.match(/(\d+)\s*(minutes?|mins?|seconds?|secs?|hours?|hrs?|h|m|s)/i);
    if (!matches) return 60000;
    
    const value = parseInt(matches[1]);
    const unit = matches[2].toLowerCase();
    
    if (unit.startsWith('hour') || unit === 'h') {
      return value * 3600000;
    } else if (unit.startsWith('min') || unit === 'm') {
      return value * 60000;
    } else if (unit.startsWith('sec') || unit === 's') {
      return value * 1000;
    }
    
    return value;
  }

  validatePhaseDependencies(phases) {
    const phaseNames = new Set(phases.map(p => p.name));
    
    for (const phase of phases) {
      for (const dep of phase.dependsOn) {
        if (!phaseNames.has(dep)) {
          throw new Error(`Phase '${phase.name}' depends on unknown phase '${dep}'`);
        }
      }
      
      // Check for circular dependencies
      this.checkCircularDependencies(phase.name, phases);
    }
  }

  checkCircularDependencies(phaseName, phases, visited = new Set()) {
    if (visited.has(phaseName)) {
      throw new Error(`Circular dependency detected involving phase '${phaseName}'`);
    }
    
    visited.add(phaseName);
    const phase = phases.find(p => p.name === phaseName);
    
    if (phase) {
      for (const dep of phase.dependsOn) {
        this.checkCircularDependencies(dep, phases, new Set(visited));
      }
    }
  }

  async validateTaskRequirements(task, context) {
    const errors = [];
    
    for (const [key, requirement] of Object.entries(task.requirements)) {
      if (!context[key]) {
        errors.push(`Missing required context field: ${key}`);
      } else if (requirement && requirement !== 'any') {
        // Simple type checking
        const actualType = typeof context[key];
        const expectedType = requirement.toLowerCase();
        
        if (expectedType !== 'any' && actualType !== expectedType) {
          errors.push(`Context field '${key}' must be of type ${expectedType}, got ${actualType}`);
        }
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`Task requirements not met:\n${errors.join('\n')}`);
    }
    
    return true;
  }
}

module.exports = TaskParser;