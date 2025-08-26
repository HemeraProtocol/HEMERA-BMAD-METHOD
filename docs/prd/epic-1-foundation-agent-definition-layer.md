# Epic 1: Foundation & Agent Definition Layer

**Goal:** Establish the BMad expansion pack structure with core agent definitions and loading system

## Story 1.1: Create Expansion Pack Structure
As a developer, I want the proper BMad expansion pack folder structure,
so that all components are organized correctly.

**Acceptance Criteria:**
1. Create expansion-packs/crypto-investment-committee/ directory structure
2. Establish folders: agents/, tasks/, templates/, data/
3. Create team-config.yaml with committee structure
4. Document structure in ARCHITECTURE.md

## Story 1.2: Implement Agent Loader (Leveraging Existing Tools)
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

## Story 1.3: Create Core Agent Definitions
As a committee, I need the CIO orchestrator and core specialists,
so that basic committee meetings can function.

**Acceptance Criteria:**
1. cio-orchestrator.md with complete orchestration protocols
2. risk-manager.md with risk frameworks and red team protocols
3. technical-analyst.md with chart analysis frameworks
4. All agents have unique personas and analytical methods
5. Interaction protocols defined
