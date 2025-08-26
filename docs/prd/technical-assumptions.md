# Technical Assumptions

## Repository Structure: BMad Expansion Pack
Structured as a BMad expansion pack under `expansion-packs/crypto-investment-committee/` with agent definitions, tasks, templates, and data files. This follows the proven BMad framework pattern for modularity and maintainability.

## Service Architecture
**CRITICAL DECISION - JavaScript-Native BMad Architecture:** 
- **Agent-as-a-Module**: Each agent is a markdown definition file, not code
- **Task-Driven Workflows**: Committee meetings are executable tasks
- **Template-Based Outputs**: All responses follow predefined templates
- **Dynamic Agent Loading**: Agents loaded from markdown at runtime using existing tools
- **JavaScript Core**: Extends existing BMad infrastructure (config-loader, task-executor, agent-orchestrator)
- **API Server**: Express.js for REST endpoints
- **No Frontend**: Pure API service for integration flexibility
- **PostgreSQL**: Conversation history and user profiles
- **Redis**: Session state and response caching
- **LangChain.js**: LLM orchestration and agent memory

## Testing Requirements
**CRITICAL DECISION - JavaScript Testing Strategy:**
- Jest unit tests for agent executor and orchestrator (90% coverage)
- Agent definition validation (proper YAML structure)
- Task workflow testing (phase execution order)
- Template rendering tests (output format compliance)
- Express API endpoint tests with supertest
- Integration tests for complete committee meetings
- Benchmark tests against single LLM providers
- Performance tests ensuring <30 second for daily questions

## Additional Technical Assumptions and Requests

**Leverage Existing BMad Infrastructure:**
- **YAML Extraction**: Use `tools/lib/yaml-utils.js` extractYamlFromAgent()
- **Config Loading**: Adapt `tools/installer/lib/config-loader.js` for expansion pack
- **Dependency Resolution**: Use `tools/lib/dependency-resolver.js` for all dependencies
- **File Operations**: Leverage `tools/installer/lib/file-manager.js`
- **Resource Location**: Use `tools/installer/lib/resource-locator.js` with caching
- **Module Management**: Apply `tools/installer/lib/module-manager.js` patterns

**Core Implementation Architecture:**
- **File-Based Configuration**: All agent behavior defined in markdown, not code
- **Task-Driven Logic**: Business logic in task files, not application code
- **Agent Loading System**: Parse markdown → Extract YAML → Initialize Agent (using existing config-loader.js)
- **Committee Meeting Phases**: 7-phase structured workflow
- **Contextual Agent Activation**: Dynamic selection based on query type

**JavaScript Backend Integration:**
```javascript
// Extends existing BMad infrastructure
const { ConfigLoader } = require('../../tools/installer/lib/config-loader');
const { extractYamlFromAgent } = require('../../tools/lib/yaml-utils');
const { DependencyResolver } = require('../../tools/lib/dependency-resolver');

class CommitteeOrchestrator {
    constructor() {
        this.configLoader = new ConfigLoader();
        this.agents = new Map();
    }
    
    async loadAgent(agentId) {
        // Directly use existing BMad infrastructure
        return await this.configLoader.getAgent(agentId);
    }
}
```

**REST API Endpoints**:
- POST /api/chat - Execute committee meeting for query
- GET /api/daily - Pre-computed three daily questions
- POST /api/session - Create conversation session
- GET /api/session/:id - Retrieve history

**Key Benefits of Reusing Tools:**
- **Proven Code**: Battle-tested in BMad production
- **Consistent Patterns**: Same loading/parsing across system
- **Reduced Development**: ~40% less code to write
- **Maintenance**: Updates to tools benefit all components
