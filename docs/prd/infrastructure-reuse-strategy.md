# Infrastructure Reuse Strategy

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
