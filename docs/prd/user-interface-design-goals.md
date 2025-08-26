# User Interface Design Goals

## Overall UX Vision
**Backend-Only MVP: Chatbot API interface.** No frontend UI needed initially. System operates as a conversational chatbot that accepts text queries and returns multi-agent analysis in structured text format. Frontend integration will come later.

## Key Interaction Paradigms

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

## Core Screens and Views
- N/A for MVP - Backend API only

## Accessibility: API-First
Well-structured JSON/markdown responses that any frontend can render accessibly.

## Branding
N/A for MVP - Focus on response quality and agent personality through text.

## Target Device and Platforms: API-First
Platform agnostic chatbot backend. Can be integrated with any frontend (web, mobile, Discord, Telegram, etc.)
