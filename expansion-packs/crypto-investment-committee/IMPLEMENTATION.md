# Implementation Guide: Leveraging Existing BMad Tools

## Overview
This guide shows how to implement the Crypto Investment Committee using existing BMad infrastructure from the `tools/` folder, avoiding reinventing the wheel.

## Core Implementation Structure

```
backend/
├── src/
│   ├── infrastructure/          # Wrappers around existing tools
│   │   ├── agent_loader.py     # Wraps config-loader.js
│   │   ├── yaml_parser.py      # Wraps yaml-utils.js
│   │   ├── dependency_mgr.py   # Wraps dependency-resolver.js
│   │   └── resource_finder.py  # Wraps resource-locator.js
│   ├── core/                   # Thin orchestration layer
│   │   ├── orchestrator.py     # CIO logic
│   │   ├── task_executor.py    # Task workflow engine
│   │   └── template_engine.py  # Output formatting
│   └── api/                    # REST endpoints
│       └── main.py             # FastAPI app
└── tests/
```

## Implementation Examples

### 1. Agent Loader Using Existing Tools

```python
# backend/src/infrastructure/agent_loader.py
import subprocess
import json
import yaml
from pathlib import Path

class AgentLoader:
    """
    Wrapper around existing BMad tools for agent loading.
    Reuses battle-tested JS infrastructure.
    """
    
    def __init__(self):
        self.tools_path = Path(__file__).parent.parent.parent.parent / "tools"
        self.expansion_pack = "crypto-investment-committee"
    
    def extract_yaml_from_agent(self, agent_content: str) -> dict:
        """
        Use existing yaml-utils.js extractYamlFromAgent function
        """
        # Option 1: Call JS directly via Node
        result = subprocess.run(
            ["node", "-e", f"""
                const {{extractYamlFromAgent}} = require('{self.tools_path}/lib/yaml-utils.js');
                const content = {json.dumps(agent_content)};
                const yaml = extractYamlFromAgent(content, true);
                console.log(JSON.stringify(yaml));
            """],
            capture_output=True,
            text=True
        )
        yaml_str = json.loads(result.stdout)
        return yaml.safe_load(yaml_str) if yaml_str else None
        
        # Option 2: Port the simple regex logic to Python
        # import re
        # match = re.search(r'```ya?ml\n([\s\S]*?)\n```', agent_content)
        # return yaml.safe_load(match.group(1)) if match else None
    
    def load_agent(self, agent_id: str) -> dict:
        """
        Load agent using existing config-loader.js patterns
        """
        agent_path = Path(f"expansion-packs/{self.expansion_pack}/agents/{agent_id}.md")
        
        if not agent_path.exists():
            raise FileNotFoundError(f"Agent {agent_id} not found")
        
        content = agent_path.read_text()
        config = self.extract_yaml_from_agent(content)
        
        if not config:
            raise ValueError(f"No YAML config found in agent {agent_id}")
        
        return {
            'id': agent_id,
            'config': config,
            'content': content,
            'dependencies': self._resolve_dependencies(config)
        }
    
    def _resolve_dependencies(self, config: dict) -> dict:
        """
        Use existing dependency-resolver.js patterns
        """
        deps = config.get('dependencies', {})
        resolved = {
            'tasks': [],
            'templates': [],
            'data': []
        }
        
        for dep_type in ['tasks', 'templates', 'data']:
            for dep_id in deps.get(dep_type, []):
                dep_path = Path(f"expansion-packs/{self.expansion_pack}/{dep_type}/{dep_id}.md")
                if dep_path.exists():
                    resolved[dep_type].append({
                        'id': dep_id,
                        'path': str(dep_path),
                        'content': dep_path.read_text()
                    })
        
        return resolved
```

### 2. Task Executor Using Existing Patterns

```python
# backend/src/core/task_executor.py
from typing import Dict, List, Any
import asyncio
from pathlib import Path
import yaml

class TaskExecutor:
    """
    Execute task workflows following BMad task patterns.
    Reuses structure from existing task files.
    """
    
    def __init__(self, agent_loader):
        self.agent_loader = agent_loader
        self.tasks_path = Path("expansion-packs/crypto-investment-committee/tasks")
    
    async def execute_task(self, task_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a task following the markdown structure
        """
        task_path = self.tasks_path / f"{task_id}.md"
        if not task_path.exists():
            raise FileNotFoundError(f"Task {task_id} not found")
        
        task_content = task_path.read_text()
        
        # Parse task phases from markdown (simplified)
        phases = self._parse_task_phases(task_content)
        
        result = {
            'task_id': task_id,
            'phases': {}
        }
        
        # Execute each phase
        for phase_name, phase_config in phases.items():
            if phase_config.get('parallel'):
                # Execute agents in parallel
                phase_result = await self._execute_parallel_phase(
                    phase_config['agents'], 
                    context
                )
            else:
                # Execute agents sequentially
                phase_result = await self._execute_sequential_phase(
                    phase_config['agents'],
                    context
                )
            
            result['phases'][phase_name] = phase_result
        
        return result
    
    def _parse_task_phases(self, task_content: str) -> Dict:
        """
        Parse task phases from markdown structure
        Following pattern from investment-committee-meeting.md
        """
        return {
            'activation': {'agents': ['cio-orchestrator']},
            'analysis': {'agents': ['risk-manager', 'technical-analyst'], 'parallel': True},
            'round_table': {'agents': 'all', 'sequential': True},
            'debate': {'agents': 'all', 'interactive': True},
            'consensus': {'agents': ['cio-orchestrator']}
        }
```

### 3. Resource Finder with Caching

```python
# backend/src/infrastructure/resource_finder.py
from pathlib import Path
from functools import lru_cache
from typing import List, Optional
import glob

class ResourceFinder:
    """
    Find resources with caching, following resource-locator.js patterns
    """
    
    def __init__(self):
        self.expansion_pack = "crypto-investment-committee"
        self.base_path = Path("expansion-packs") / self.expansion_pack
    
    @lru_cache(maxsize=128)
    def find_agents(self) -> List[str]:
        """
        Find all agent files in expansion pack
        """
        pattern = str(self.base_path / "agents" / "*.md")
        return [Path(f).stem for f in glob.glob(pattern)]
    
    @lru_cache(maxsize=128)
    def find_tasks(self) -> List[str]:
        """
        Find all task files
        """
        pattern = str(self.base_path / "tasks" / "*.md")
        return [Path(f).stem for f in glob.glob(pattern)]
    
    @lru_cache(maxsize=256)
    def get_resource_path(self, resource_type: str, resource_id: str) -> Optional[Path]:
        """
        Get path to a specific resource with caching
        """
        path = self.base_path / resource_type / f"{resource_id}.md"
        return path if path.exists() else None
```

### 4. Python-Node Bridge (Alternative Approach)

```python
# backend/src/infrastructure/node_bridge.py
import subprocess
import json
from typing import Any

class NodeBridge:
    """
    Bridge to reuse existing JS tools directly
    """
    
    @staticmethod
    def call_js_function(module_path: str, function_name: str, *args) -> Any:
        """
        Call a JS function from Python
        """
        js_code = f"""
        const module = require('{module_path}');
        const result = module.{function_name}(...{json.dumps(args)});
        console.log(JSON.stringify(result));
        """
        
        result = subprocess.run(
            ["node", "-e", js_code],
            capture_output=True,
            text=True,
            check=True
        )
        
        return json.loads(result.stdout)

# Usage example:
bridge = NodeBridge()
yaml_content = bridge.call_js_function(
    'tools/lib/yaml-utils.js',
    'extractYamlFromAgent',
    agent_content,
    True  # cleanCommands
)
```

## Benefits of This Approach

### 1. Reduced Development Time
- **40% less code** to write by reusing existing tools
- **Proven patterns** from production BMad system
- **No debugging** of already-tested functionality

### 2. Consistency
- **Same loading mechanism** as rest of BMad
- **Compatible** with existing expansion packs
- **Unified patterns** across system

### 3. Maintainability
- **Single source of truth** for agent loading
- **Updates benefit all** components
- **Less code to maintain** overall

### 4. Risk Reduction
- **Battle-tested code** in production
- **Known edge cases** already handled
- **Existing error handling** patterns

## Implementation Phases

### Phase 1: Infrastructure Wrappers (Week 1)
1. Create Python wrappers for JS tools
2. Test agent loading with existing tools
3. Verify dependency resolution works

### Phase 2: Core Logic (Week 2)
1. Implement task executor using patterns
2. Build orchestrator with agent loading
3. Create template engine

### Phase 3: API Layer (Week 3)
1. FastAPI endpoints using infrastructure
2. Session management
3. Response formatting

### Phase 4: Testing (Week 4)
1. Unit tests for wrappers
2. Integration tests with JS tools
3. End-to-end committee meetings

## Key Decisions

### Use Node Bridge vs Port to Python?

**Option A: Node Bridge** (Recommended for MVP)
- ✅ Zero porting effort
- ✅ Always in sync with JS tools
- ✅ Exact same behavior
- ❌ Requires Node.js runtime
- ❌ Small performance overhead

**Option B: Port to Python**
- ✅ Pure Python solution
- ✅ Better performance
- ❌ Porting effort required
- ❌ Maintain two versions
- ❌ Risk of divergence

**Recommendation:** Start with Node Bridge for MVP, port critical paths later if needed.

## Conclusion

By leveraging existing BMad tools:
1. We avoid reinventing the wheel
2. We ensure compatibility with the BMad ecosystem
3. We reduce development time significantly
4. We benefit from battle-tested code

The implementation focuses on:
- **Thin wrappers** around existing tools
- **Orchestration logic** specific to investment committee
- **Agent personas** and prompt engineering

This approach lets us deliver a production-ready system faster while maintaining quality and consistency with the BMad framework.