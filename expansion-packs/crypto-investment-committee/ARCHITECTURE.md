# Crypto Investment Committee - Technical Architecture & Implementation Plan

## Overview
This document outlines the BMad-framework-based architecture for implementing the Crypto Investment Committee as a modular, task-driven system rather than a monolithic application.

## Core Architecture Principles

### 1. Agent-as-a-Module
- Each agent is a self-contained markdown definition file
- Agents are loaded dynamically based on query context
- No hardcoded agent logic in the orchestration layer
- Agents can be added/removed/modified without code changes

### 2. Task-Driven Interactions
- Committee meetings are executable tasks, not code
- Interaction patterns defined in task files
- Workflow flexibility through task composition
- Easy to test and modify behavior

### 3. Template-Based Outputs
- All outputs follow predefined templates
- Consistent structure across different analysis types
- Frontend-agnostic JSON/markdown output
- Easy to adapt for different platforms

## Technical Stack (BMad-Optimized)

### Core Framework
```python
# Simple Python structure leveraging BMad patterns
project/
├── agent_loader.py       # Loads agent definitions from markdown
├── task_executor.py      # Executes task workflows
├── template_renderer.py  # Renders output templates
├── orchestrator.py       # CIO orchestration logic
└── api.py               # FastAPI endpoints
```

### Key Technologies
- **Python 3.11+**: Core runtime
- **FastAPI**: REST/WebSocket API
- **LangChain**: LLM orchestration and agent tools
- **YAML**: Agent and configuration parsing
- **Jinja2**: Template rendering
- **Redis**: Session state and caching
- **PostgreSQL**: Conversation history

### Agent Loading System
```python
class AgentLoader:
    def load_agent(self, agent_id: str) -> Agent:
        # Parse markdown file
        # Extract YAML configuration
        # Initialize agent with persona, commands, dependencies
        # Return configured agent instance
        
class Agent:
    def __init__(self, config: dict):
        self.persona = config['persona']
        self.commands = config['commands']
        self.dependencies = config['dependencies']
        self.analytical_framework = config.get('analytical_framework')
    
    def analyze(self, query: str, context: dict) -> dict:
        # Apply analytical framework
        # Use LLM with persona prompt
        # Return structured analysis
```

## Implementation Epics (BMad Framework)

### Epic 1: Foundation & Agent Definition Layer
**Goal**: Create all agent definitions and core loading system

**Stories**:

**Story 1.1: Create Agent Definition Files**
As a system, I want to load agent personalities from markdown files,
so that agents can be modified without code changes.

*Acceptance Criteria*:
1. All 9 agent markdown files created with complete definitions
2. Agent loader can parse markdown and extract YAML config
3. Agents initialize with correct personas and capabilities
4. Unit tests verify agent loading

**Story 1.2: Implement CIO Orchestrator**
As a CIO agent, I want to orchestrate committee meetings,
so that all agents contribute appropriately.

*Acceptance Criteria*:
1. CIO can analyze queries and activate relevant agents
2. Orchestration follows team-config.yaml rules
3. CIO manages meeting phases correctly
4. Integration test of basic orchestration

**Story 1.3: Create Base Specialist Agents**
As a system, I want specialist agents with unique perspectives,
so that analysis is comprehensive.

*Acceptance Criteria*:
1. Risk Manager and Technical Analyst implemented
2. Each agent has unique analytical framework
3. Agents produce differentiated outputs
4. Cross-agent interaction protocols work

### Epic 2: Task Execution Framework
**Goal**: Implement task-driven interaction system

**Stories**:

**Story 2.1: Build Task Executor**
As a system, I want to execute meeting tasks from markdown,
so that workflows are configurable.

*Acceptance Criteria*:
1. Task executor parses meeting task markdown
2. Executes phases in correct sequence
3. Manages parallel and sequential operations
4. Handles agent responses correctly

**Story 2.2: Implement Committee Meeting Task**
As a user, I want structured committee meetings,
so that I get comprehensive analysis.

*Acceptance Criteria*:
1. Full meeting flow works end-to-end
2. All 7 phases execute correctly
3. Output matches expected JSON structure
4. Meeting completes in <5 minutes

**Story 2.3: Create Quick Analysis Task**
As a user, I want fast analysis for simple questions,
so that I get quick answers.

*Acceptance Criteria*:
1. Quick analysis task uses 3-4 agents
2. Completes in <30 seconds
3. Still provides balanced perspective
4. Appropriate for daily questions

### Epic 3: Daily Questions Engine
**Goal**: Automate daily market analysis

**Stories**:

**Story 3.1: Implement Daily Question Tasks**
As a user, I want automated daily analysis,
so that I get consistent market updates.

*Acceptance Criteria*:
1. Three daily questions have dedicated tasks
2. Contextual agent activation works
3. Pre-computation via scheduled jobs
4. Results cached appropriately

**Story 3.2: Build Market Context System**
As a system, I want current market context,
so that analysis is relevant.

*Acceptance Criteria*:
1. Market data integration (prices, volumes)
2. News aggregation system
3. On-chain data feeds
4. Context passed to agents correctly

**Story 3.3: Create Daily Brief Template**
As a user, I want consistent daily brief format,
so that I can quickly understand market state.

*Acceptance Criteria*:
1. Template renders three questions clearly
2. Agent contributions are attributed
3. Confidence scores displayed
4. Action items highlighted

### Epic 4: Advanced Agent Intelligence
**Goal**: Implement sophisticated agent interactions

**Stories**:

**Story 4.1: Implement BMad Elicitation Methods**
As agents, we want structured interaction patterns,
so that our analysis is thorough.

*Acceptance Criteria*:
1. Stakeholder Round Table protocol works
2. Red Team vs Blue Team challenges function
3. Self-Consistency Validation implemented
4. Emergent insights captured

**Story 4.2: Build Agent Memory System**
As an agent, I want to remember previous analyses,
so that I can be consistent.

*Acceptance Criteria*:
1. Agents maintain stance across session
2. Previous recommendations tracked
3. Learning from outcomes
4. Memory persists appropriately

**Story 4.3: Create Consensus Building Logic**
As a CIO, I want to build consensus systematically,
so that verdicts are well-founded.

*Acceptance Criteria*:
1. Agreement detection works
2. Divergence is documented
3. Weighting system functions
4. Confidence scores calculated correctly

### Epic 5: API & Integration Layer
**Goal**: Production-ready API for frontend integration

**Stories**:

**Story 5.1: Build REST API Endpoints**
As a frontend, I want clean API endpoints,
so that integration is simple.

*Acceptance Criteria*:
1. POST /chat endpoint works
2. GET /daily returns cached analysis
3. Session management functions
4. Error handling robust

**Story 5.2: Implement WebSocket Streaming**
As a user, I want real-time updates,
so that I see the committee discussion.

*Acceptance Criteria*:
1. WebSocket connection stable
2. Agents stream responses
3. Phases clearly delineated
4. Graceful disconnection handling

**Story 5.3: Create API Documentation**
As a developer, I want clear API documentation,
so that I can integrate the system.

*Acceptance Criteria*:
1. OpenAPI specification complete
2. Example requests/responses provided
3. Authentication documented
4. Rate limits explained

## File Structure

```
expansion-packs/crypto-investment-committee/
├── agents/
│   ├── cio-orchestrator.md                 # Created ✓
│   ├── risk-manager.md                     # Created ✓
│   ├── technical-analyst.md
│   ├── market-sentiment.md
│   ├── eth-specialist-vitalik.md
│   ├── macro-strategist-powell.md
│   ├── macro-strategist-trump.md
│   ├── macro-strategist-sec.md
│   └── contrarian.md
├── tasks/
│   ├── investment-committee-meeting.md     # Created ✓
│   ├── daily-market-analysis.md
│   ├── quick-analysis.md
│   ├── risk-assessment.md
│   └── consensus-building.md
├── templates/
│   ├── committee-report-tmpl.yaml
│   ├── daily-brief-tmpl.yaml
│   └── investment-verdict-tmpl.yaml
├── data/
│   ├── crypto-knowledge-base.md
│   ├── investment-frameworks.md
│   └── market-indicators.md
├── team-config.yaml                        # Created ✓
└── ARCHITECTURE.md                         # This file

backend/
├── src/
│   ├── agent_loader.py
│   ├── task_executor.py
│   ├── template_renderer.py
│   ├── orchestrator.py
│   ├── api.py
│   └── main.py
├── tests/
│   ├── test_agents.py
│   ├── test_tasks.py
│   └── test_integration.py
├── requirements.txt
└── Dockerfile
```

## Key Design Decisions

### 1. Why Markdown-Based Agents?
- **Flexibility**: Modify agent behavior without coding
- **Transparency**: Personas and logic are human-readable
- **Version Control**: Easy to track changes
- **Testing**: Can test prompts independently

### 2. Why Task-Driven Architecture?
- **Composability**: Mix and match workflows
- **Maintainability**: Business logic in tasks, not code
- **Extensibility**: Add new workflows easily
- **Debugging**: Clear execution path

### 3. Why Template-Based Output?
- **Consistency**: Uniform structure across agents
- **Integration**: Frontend knows what to expect
- **Flexibility**: Easy to add new output formats
- **Testing**: Can validate against schema

## Development Approach

### Phase 1: Agent Definitions (Week 1-2)
- Create all agent markdown files
- Define team configuration
- Build agent loader
- Unit test agent initialization

### Phase 2: Task Framework (Week 2-3)
- Implement task executor
- Create core task files
- Build orchestration logic
- Integration test workflows

### Phase 3: Core Functionality (Week 3-4)
- Implement daily questions
- Add data integrations
- Build template renderer
- End-to-end testing

### Phase 4: API Development (Week 4-5)
- Create REST endpoints
- Add WebSocket support
- Implement caching
- API testing

### Phase 5: Polish & Optimization (Week 5-6)
- Performance optimization
- Comprehensive logging
- Error handling
- Documentation

## Success Metrics

### Technical Metrics
- Agent definition load time: <100ms
- Task execution overhead: <5% of total time
- API response time: <30s for daily questions
- System uptime: 99.9%

### Quality Metrics
- Agent differentiation score: >80%
- Consensus detection accuracy: >90%
- Output template compliance: 100%
- Test coverage: >85%

### Business Metrics
- Beat single LLM by 20% on benchmarks
- User satisfaction: >85%
- Daily question accuracy: >75%
- Actionability score: >90%

## Conclusion

This architecture leverages the BMad framework's strengths:
1. **Modularity** through markdown-based agents
2. **Flexibility** through task-driven workflows
3. **Consistency** through template-based outputs
4. **Maintainability** through separation of concerns

The system can evolve by simply adding new agent definitions, tasks, and templates without touching core code. This approach ensures that the investment committee can adapt to changing market conditions and user needs while maintaining system stability.