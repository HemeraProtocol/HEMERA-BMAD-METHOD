# Personal Crypto Investment Committee Product Requirements Document (PRD)

## Goals and Background Context

### Goals
- Enable individual investors to make institutional-quality crypto investment decisions through multi-agent AI committee analysis
- Answer three daily critical questions: market movement reasons, portfolio decisions, and emerging opportunities
- Reduce research time by 90% while improving decision confidence by 40%
- Beat single-LLM providers (ChatGPT, Claude, Gemini) by 20% across all evaluation dimensions
- Create scalable framework for adding specialist agents as crypto market evolves

### Background Context
Individual crypto investors lose money due to emotional decisions, information overload, and lack of diverse perspectives. Current solutions (trading bots, single AI tools, human advisors) fail to provide the balanced, multi-perspective analysis that institutional investment committees offer. This PRD defines requirements for a Personal Crypto Investment Committee system that democratizes institutional-grade analysis through specialized AI agents working collaboratively.

### Change Log
| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-01-25 | 1.0 | Initial PRD creation based on Project Brief | PM John |
| 2025-01-26 | 2.0 | Pivoted to JavaScript-only architecture for simplicity and reuse | PM John |

## Requirements

### Functional
- **FR1:** System shall provide 7-9 specialized AI agents with distinct crypto investment personas (CIO, Risk Manager, Technical Analyst, Market Sentiment, ETH Specialist, Macro Strategists, Contrarian)
- **FR2:** System shall answer three core daily questions: Why is BTC/ETH up/down today? Should I keep/buy/sell? What new assets show potential?
- **FR3:** Each agent shall provide unique perspective with clear reasoning and cite data sources for credibility
- **FR4:** CIO agent shall synthesize all agent inputs last and provide final investment verdict with confidence score
- **FR5:** System shall support user-initiated investment questions beyond the three daily core questions
- **FR6:** Agents shall interact using BMad elicitation methods (Stakeholder Round Table, Red Team vs Blue Team, Self-Consistency Validation)
- **FR7:** System shall display agent discussions showing agreements, disagreements, and consensus formation process
- **FR8:** System shall provide beginner mode with simplified explanations and educational tooltips
- **FR9:** System shall allow users to input current portfolio holdings for context-aware recommendations
- **FR10:** System shall include comprehensive disclaimers that all output is AI-generated educational content, not financial advice

### Non Functional
- **NFR1:** System shall respond to daily questions within 30 seconds using contextual agent selection
- **NFR2:** System shall achieve 95%+ analysis completion rate resulting in actionable recommendations
- **NFR3:** Platform shall support web browsers (Chrome, Safari, Firefox, Edge) on desktop and mobile
- **NFR4:** System shall encrypt all user data end-to-end and comply with GDPR/CCPA regulations
- **NFR5:** System shall integrate with multiple LLM providers (OpenAI/Anthropic) without vendor lock-in
- **NFR6:** System shall scale to support concurrent multi-agent processing for multiple users
- **NFR7:** All AI-generated content shall be clearly labeled with timestamps and confidence scores
- **NFR8:** System shall maintain 99.9% uptime for production environment

## User Interface Design Goals

### Overall UX Vision
**Backend-Only MVP: Chatbot API interface.** No frontend UI needed initially. System operates as a conversational chatbot that accepts text queries and returns multi-agent analysis in structured text format. Frontend integration will come later.

### Key Interaction Paradigms

**Investment Committee Meeting Simulation** - Based on expansion-packs/investment_committee_agent framework:

**Phase 1: Query Analysis & Agent Activation (Orchestrator Pattern)**
- CIO (Orchestrator) receives user query and determines relevant agents
- Dynamic agent selection based on query type and market context
- Agents activated in parallel groups for efficiency

**Phase 2: Individual Analysis (Specialist Agent Pattern)**
Following the Analysis Task Template structure:
- **Data Collection**: Each agent gathers relevant data from assigned sources
- **Domain Analysis**: Agents apply their specialized analytical frameworks
- **Interpretation**: Generate insights from their unique perspectives
- **Initial Position**: Form preliminary recommendations

**Phase 3: Committee Discussion (BMad Elicitation Methods)**
- **Round 1 - Stakeholder Round Table**: Each agent presents initial analysis
  - Sequential presentation with no interruptions
  - Clear attribution: "[Agent Name - Role]: Analysis..."
  - Include confidence levels and data sources
  
- **Round 2 - Red Team vs Blue Team**: Structured debate
  - Risk Manager challenges bullish positions
  - Contrarian attacks consensus views
  - Agents defend positions with evidence
  - Format: "[Agent X challenges Agent Y]: Point..." → "[Agent Y responds]: Counterpoint..."

- **Round 3 - Self-Consistency Validation**: Cross-validation
  - Agents verify each other's data and logic
  - Flag inconsistencies or gaps
  - Request clarifications from other agents
  - Format: "[Agent X to Agent Y]: Can you clarify..."

**Phase 4: Consensus Building (Emergent Collaboration)**
- **Meta-Analysis**: Identify unexpected insights from agent interactions
- **Convergence Detection**: Track when agents reach agreement
- **Divergence Documentation**: Clearly note unresolved disagreements
- **Weighted Synthesis**: CIO weighs different viewpoints based on relevance

**Phase 5: Final Verdict (Orchestrator Synthesis)**
- CIO synthesizes all inputs using structured workflow coordination
- Presents final recommendation with:
  - Consensus points (what all agents agree on)
  - Divergent views (where agents disagree and why)
  - Confidence score (based on agreement level)
  - Action items (clear next steps)

**Response Formatting:**
```json
{
  "session_id": "uuid",
  "query": "user question",
  "committee_analysis": {
    "phase_1_activation": ["agents activated and why"],
    "phase_2_individual": {
      "agent_name": {
        "analysis": "detailed analysis",
        "confidence": 0.85,
        "sources": ["source1", "source2"]
      }
    },
    "phase_3_discussion": [
      {"type": "round_table", "agent": "X", "content": "..."},
      {"type": "challenge", "from": "Y", "to": "X", "content": "..."},
      {"type": "validation", "agent": "Z", "confirms": "..."}
    ],
    "phase_4_consensus": {
      "agreements": ["point1", "point2"],
      "disagreements": [{"topic": "...", "positions": {...}}],
      "insights": ["emergent insight 1"]
    },
    "phase_5_verdict": {
      "recommendation": "final CIO synthesis",
      "confidence": 0.75,
      "action_items": ["action1", "action2"]
    }
  }
}
```

**Conversation Memory:**
- Maintain agent stances across queries in session
- Track previous recommendations for consistency
- Build user profile from interaction history

### Core Screens and Views
- N/A for MVP - Backend API only

### Accessibility: API-First
Well-structured JSON/markdown responses that any frontend can render accessibly.

### Branding
N/A for MVP - Focus on response quality and agent personality through text.

### Target Device and Platforms: API-First
Platform agnostic chatbot backend. Can be integrated with any frontend (web, mobile, Discord, Telegram, etc.)

## Technical Assumptions

### Repository Structure: BMad Expansion Pack
Structured as a BMad expansion pack under `expansion-packs/crypto-investment-committee/` with agent definitions, tasks, templates, and data files. This follows the proven BMad framework pattern for modularity and maintainability.

### Service Architecture
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

### Testing Requirements
**CRITICAL DECISION - JavaScript Testing Strategy:**
- Jest unit tests for agent executor and orchestrator (90% coverage)
- Agent definition validation (proper YAML structure)
- Task workflow testing (phase execution order)
- Template rendering tests (output format compliance)
- Express API endpoint tests with supertest
- Integration tests for complete committee meetings
- Benchmark tests against single LLM providers
- Performance tests ensuring <30 second for daily questions

### Additional Technical Assumptions and Requests

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

## Epic List

**Epic 1: Foundation & Agent Definition Layer**
Create all 9 agent markdown definitions following BMad expansion pack structure, implement agent loader to parse markdown/YAML configs, establish CIO orchestrator and 2 core specialists (Risk Manager, Technical Analyst) with complete personas and analytical frameworks

**Epic 2: Task Execution Framework** 
Build task executor for running markdown-defined workflows, implement investment-committee-meeting task with 7-phase structure, create daily-market-analysis task for three core questions, establish quick-analysis task for fast responses

**Epic 3: Template & Data Framework**
Create output templates (committee-report, daily-brief, investment-verdict), build shared knowledge base files (crypto-knowledge, investment-frameworks, market-indicators), implement template renderer for consistent formatting

**Epic 4: Complete Agent Committee**
Implement remaining 6 specialist agents (Market Sentiment, ETH Specialist, 3 Macro Strategists, Contrarian), define unique analytical frameworks per agent, establish interaction protocols and challenge patterns, validate agent differentiation

**Epic 5: API & Integration Layer**
Build Express.js endpoints for committee meetings and daily questions, implement session management and conversation memory, add response caching and pre-computation, create comprehensive API documentation

## Epic 1: Foundation & Agent Definition Layer

**Goal:** Establish the BMad expansion pack structure with core agent definitions and loading system

### Story 1.1: Create Expansion Pack Structure
As a developer, I want the proper BMad expansion pack folder structure,
so that all components are organized correctly.

**Acceptance Criteria:**
1. Create expansion-packs/crypto-investment-committee/ directory structure
2. Establish folders: agents/, tasks/, templates/, data/
3. Create team-config.yaml with committee structure
4. Document structure in ARCHITECTURE.md

### Story 1.2: Implement Agent Loader (Leveraging Existing Tools)
As a system, I want to load agent definitions from markdown files,
so that agents can be modified without code changes.

**Implementation Approach - Reuse Existing Infrastructure:**
- **Use `tools/lib/yaml-utils.js`** for extracting YAML from agent markdown
- **Adapt `tools/installer/lib/config-loader.js`** for agent discovery and loading
- **Use `tools/lib/dependency-resolver.js`** for resolving agent dependencies
- **Leverage `tools/installer/lib/resource-locator.js`** for finding agent files

**Acceptance Criteria:**
1. Extend existing ConfigLoader to work with crypto-investment-committee expansion pack
2. Agent loader uses extractYamlFromAgent() for parsing
3. DependencyResolver handles tasks, templates, and data dependencies
4. Error handling inherits from existing tools

### Story 1.3: Create Core Agent Definitions
As a committee, I need the CIO orchestrator and core specialists,
so that basic committee meetings can function.

**Acceptance Criteria:**
1. cio-orchestrator.md with complete orchestration protocols
2. risk-manager.md with risk frameworks and red team protocols
3. technical-analyst.md with chart analysis frameworks
4. All agents have unique personas and analytical methods
5. Interaction protocols defined

## Epic 2: Task Execution Framework

**Goal:** Implement task-driven workflow system for committee operations

### Story 2.1: Build Task Executor (Leveraging Existing Patterns)
As a system, I want to execute workflows defined in task markdown files,
so that committee behavior is configurable.

**Implementation Approach - Reuse Existing Patterns:**
- **Extend DependencyResolver** pattern for task resolution
- **Use existing markdown parsing** patterns from agent loader
- **Leverage file-manager.js** for task file operations
- **Apply module-manager.js** pattern for dynamic task loading

**Acceptance Criteria:**
1. Task executor follows existing BMad task structure patterns
2. Reuses markdown parsing utilities from tools/lib
3. Executes phases in defined sequence
4. Manages agent responses and state using existing patterns

### Story 2.2: Create Committee Meeting Task
As a user, I want structured investment committee meetings,
so that I get comprehensive multi-perspective analysis.

**Acceptance Criteria:**
1. investment-committee-meeting.md with 7-phase workflow
2. Phases: activation → analysis → round table → debate → validation → consensus → verdict
3. Proper agent interaction patterns (stakeholder round table, red team challenges)
4. JSON output structure matching phases
5. Completes in <5 minutes

### Story 2.3: Implement Daily Analysis Task
As a user, I want automated analysis of three daily questions,
so that I get consistent market insights.

**Acceptance Criteria:**
1. daily-market-analysis.md with question-specific logic
2. Contextual agent activation based on market conditions
3. Pre-computation scheduling support
4. Structured output for each question
5. <30 second execution time

## Epic 3: Template & Data Framework

**Goal:** Create consistent output formatting and shared knowledge resources

### Story 3.1: Create Output Templates
As a frontend developer, I want consistent response formats,
so that integration is predictable.

**Acceptance Criteria:**
1. committee-report-tmpl.yaml for full analysis
2. daily-brief-tmpl.yaml for three questions
3. investment-verdict-tmpl.yaml for recommendations
4. All templates use consistent JSON structure
5. Template renderer produces valid output

### Story 3.2: Build Knowledge Base
As agents, we need shared knowledge and frameworks,
so that our analysis is consistent and comprehensive.

**Acceptance Criteria:**
1. crypto-knowledge-base.md with market fundamentals
2. investment-frameworks.md with analysis methodologies
3. market-indicators.md with technical/sentiment metrics
4. Agents can reference shared knowledge
5. Version controlled and updatable

## Epic 4: Complete Agent Committee

**Goal:** Implement all remaining specialist agents with unique perspectives

### Story 4.1: Create Market Analysis Agents
As a committee, I need market sentiment and contrarian perspectives,
so that analysis considers crowd psychology.

**Acceptance Criteria:**
1. market-sentiment.md with sentiment analysis framework
2. contrarian.md with counter-consensus protocols
3. Unique analytical approaches
4. Proper challenge patterns defined

### Story 4.2: Implement Domain Specialists
As a committee, I need deep expertise in specific areas,
so that specialized knowledge informs decisions.

**Acceptance Criteria:**
1. eth-specialist-vitalik.md with Ethereum ecosystem expertise
2. Unique personality and knowledge domain
3. Specific interaction patterns with other agents
4. Domain-specific analytical frameworks

### Story 4.3: Create Macro Strategists
As a committee, I need macro economic perspectives,
so that broader context informs crypto decisions.

**Acceptance Criteria:**
1. macro-strategist-powell.md (Fed/interest rates focus)
2. macro-strategist-trump.md (geopolitical/trade focus)
3. macro-strategist-sec.md (regulatory focus)
4. Each with unique macro lens
5. Contextual activation based on events

## Epic 5: API & Integration Layer

**Goal:** Production-ready API for frontend integration

### Story 5.1: Build Core API Endpoints
As a frontend, I want clean API endpoints,
so that integration is straightforward.

**Acceptance Criteria:**
1. POST /chat - Execute committee meeting
2. GET /daily - Retrieve pre-computed analysis
3. POST /session - Create conversation session
4. GET /session/{id} - Get conversation history
5. Proper error handling and validation

### Story 5.2: Implement Session Management
As a user, I want coherent conversations across queries,
so that context is maintained.

**Acceptance Criteria:**
1. Session creation and management
2. Agent memory persistence within session
3. Conversation history tracking
4. User profile building from interactions
5. Redis-based state management

### Story 5.3: Add Performance Optimization
As a user, I want fast responses,
so that the system is responsive.

**Acceptance Criteria:**
1. Response caching for common queries
2. Pre-computation of daily questions
3. Parallel agent execution where possible
4. <30 second response time for daily questions
5. Performance monitoring and logging

## Infrastructure Reuse Strategy

**Existing Tools to Leverage (60% Development Savings):**

| Tool | Location | Purpose | Usage in Our System |
|------|----------|---------|-------------------|
| yaml-utils.js | tools/lib/ | Extract YAML from markdown | Parse agent definitions |
| config-loader.js | tools/installer/lib/ | Load agents and configs | Agent discovery and loading |
| dependency-resolver.js | tools/lib/ | Resolve dependencies | Load tasks, templates, data |
| file-manager.js | tools/installer/lib/ | File operations | Manage expansion pack files |
| resource-locator.js | tools/installer/lib/ | Find resources with caching | Locate agents and tasks |
| module-manager.js | tools/installer/lib/ | Dynamic module loading | Load components on demand |

**Implementation Approach:**
1. **Phase 1**: Extend existing JavaScript infrastructure directly
2. **Phase 2**: Add LangChain.js for LLM orchestration
3. **Phase 3**: Build Express.js API layer
4. **Result**: Native integration, single language stack, maximum code reuse

## Checklist Results Report

**Requirements Validation:**
- ✅ All functional requirements addressable through agent definitions and tasks
- ✅ Non-functional requirements achievable with proposed architecture
- ✅ BMad framework provides needed flexibility and modularity
- ✅ Existing tools significantly reduce implementation effort

**Technical Feasibility:**
- ✅ Agent loader pattern proven in BMad implementations
- ✅ Task-driven workflows reduce code complexity
- ✅ Template-based outputs ensure consistency
- ✅ JavaScript/Express/LangChain.js stack is mature
- ✅ Direct use of existing JS tools - no wrapping needed

**Risk Assessment:**
- ⚠️ Agent differentiation requires careful persona crafting
- ⚠️ Performance targets need optimization focus
- ⚠️ LLM costs need monitoring at scale
- ✅ Mitigation: Start with core agents, optimize prompts, implement caching
- ✅ Mitigation: Reuse existing tools reduces technical risk

## Next Steps

### UX Expert Prompt
"Review the crypto investment committee chatbot API design focused on delivering three daily questions through multi-agent discussion. The system is backend-only with structured JSON responses. Consider how future frontends might best visualize agent debates and consensus building."

### Architect Prompt
"Design the technical implementation for a JavaScript-native crypto investment committee system that extends existing BMad infrastructure. Use markdown-defined agents, task-driven workflows, and template-based outputs. Leverage existing tools from tools/lib and tools/installer/lib. Focus on the agent executor extending ConfigLoader, CommitteeOrchestrator for meeting coordination, and Express.js API layer. The system must support dynamic agent activation, 7-phase committee meetings, LangChain.js integration, and <30 second responses for daily questions."