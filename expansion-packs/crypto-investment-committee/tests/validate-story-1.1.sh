#!/bin/bash

# Story 1.1 Validation Script - Simplified and Robust
# Tests the crypto investment committee expansion pack structure

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
PASS=0
FAIL=0
TOTAL=0

# Base directory
BASE="expansion-packs/crypto-investment-committee"

# Test function
test_check() {
    local name="$1"
    local condition="$2"
    TOTAL=$((TOTAL + 1))
    
    echo -n "[$TOTAL] $name... "
    
    if eval "$condition"; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASS=$((PASS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAIL=$((FAIL + 1))
        return 1
    fi
}

# Header
echo "======================================"
echo "   Story 1.1 Implementation Tests"
echo "======================================"
echo ""

# Change to project root if needed
if [ ! -d "$BASE" ] && [ -d "../../../$BASE" ]; then
    cd ../../..
fi

echo -e "${BLUE}Testing from: $(pwd)${NC}"
echo ""

# =====================================
# STRUCTURAL TESTS
# =====================================
echo -e "${BLUE}=== Structural Validation ===${NC}"

test_check "Base directory exists" "[ -d '$BASE' ]"
test_check "agents/ directory exists" "[ -d '$BASE/agents' ]"
test_check "tasks/ directory exists" "[ -d '$BASE/tasks' ]"
test_check "templates/ directory exists" "[ -d '$BASE/templates' ]"
test_check "data/ directory exists" "[ -d '$BASE/data' ]"
test_check "tests/ directory exists" "[ -d '$BASE/tests' ]"

# =====================================
# FILE EXISTENCE TESTS
# =====================================
echo ""
echo -e "${BLUE}=== File Existence Validation ===${NC}"

test_check "team-config.yaml exists" "[ -f '$BASE/team-config.yaml' ]"
test_check "ARCHITECTURE.md exists" "[ -f '$BASE/ARCHITECTURE.md' ]"
test_check "IMPLEMENTATION.md exists" "[ -f '$BASE/IMPLEMENTATION.md' ]"

# =====================================
# FILE COUNT TESTS
# =====================================
echo ""
echo -e "${BLUE}=== File Count Validation ===${NC}"

TOTAL_FILES=$(find "$BASE" -type f \( -name "*.md" -o -name "*.yaml" \) 2>/dev/null | wc -l | tr -d ' ')
test_check "Total files >= 13" "[ $TOTAL_FILES -ge 13 ]"
echo "  └─ Found $TOTAL_FILES files"

AGENT_FILES=$(find "$BASE/agents" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
test_check "Agent files >= 2" "[ $AGENT_FILES -ge 2 ]"
echo "  └─ Found $AGENT_FILES agent files"

TASK_FILES=$(find "$BASE/tasks" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
test_check "Task files >= 2" "[ $TASK_FILES -ge 2 ]"
echo "  └─ Found $TASK_FILES task files"

TEMPLATE_FILES=$(find "$BASE/templates" -name "*.yaml" 2>/dev/null | wc -l | tr -d ' ')
test_check "Template files >= 3" "[ $TEMPLATE_FILES -ge 3 ]"
echo "  └─ Found $TEMPLATE_FILES template files"

DATA_FILES=$(find "$BASE/data" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
test_check "Data files >= 3" "[ $DATA_FILES -ge 3 ]"
echo "  └─ Found $DATA_FILES data files"

# =====================================
# SPECIFIC FILE TESTS
# =====================================
echo ""
echo -e "${BLUE}=== Specific File Validation ===${NC}"

test_check "CIO orchestrator agent exists" "[ -f '$BASE/agents/cio-orchestrator.md' ]"
test_check "Risk manager agent exists" "[ -f '$BASE/agents/risk-manager.md' ]"
test_check "Daily market analysis task exists" "[ -f '$BASE/tasks/daily-market-analysis.md' ]"
test_check "Investment committee task exists" "[ -f '$BASE/tasks/investment-committee-meeting.md' ]"
test_check "Investment verdict template exists" "[ -f '$BASE/templates/investment-verdict-tmpl.yaml' ]"
test_check "Daily brief template exists" "[ -f '$BASE/templates/daily-brief-tmpl.yaml' ]"
test_check "Committee report template exists" "[ -f '$BASE/templates/committee-report-tmpl.yaml' ]"

# =====================================
# CONTENT VALIDATION TESTS
# =====================================
echo ""
echo -e "${BLUE}=== Content Validation ===${NC}"

if [ -f "$BASE/team-config.yaml" ]; then
    test_check "team-config has bundle section" "grep -q '^bundle:' '$BASE/team-config.yaml'"
    test_check "team-config has team_structure" "grep -q '^team_structure:' '$BASE/team-config.yaml'"
    test_check "team-config has workflows" "grep -q '^workflows:' '$BASE/team-config.yaml'"
    test_check "team-config has interaction_matrix" "grep -q '^interaction_matrix:' '$BASE/team-config.yaml'"
    test_check "team-config has activation_rules" "grep -q '^activation_rules:' '$BASE/team-config.yaml'"
    test_check "team-config has meeting_protocols" "grep -q '^meeting_protocols:' '$BASE/team-config.yaml'"
    test_check "team-config has performance_metrics" "grep -q '^performance_metrics:' '$BASE/team-config.yaml'"
fi

if [ -f "$BASE/agents/cio-orchestrator.md" ]; then
    test_check "CIO agent has YAML block" "grep -q '^agent:' '$BASE/agents/cio-orchestrator.md'"
    test_check "CIO agent has persona section" "grep -q 'persona:' '$BASE/agents/cio-orchestrator.md'"
    test_check "CIO agent has commands" "grep -q 'commands:' '$BASE/agents/cio-orchestrator.md'"
fi

# =====================================
# NAMING CONVENTION TESTS
# =====================================
echo ""
echo -e "${BLUE}=== Naming Convention Tests ===${NC}"

BAD_TEMPLATES=$(find "$BASE/templates" -name "*.yaml" ! -name "*-tmpl.yaml" 2>/dev/null | wc -l | tr -d ' ')
test_check "All templates follow *-tmpl.yaml pattern" "[ $BAD_TEMPLATES -eq 0 ]"

# =====================================
# DOCUMENTATION QUALITY
# =====================================
echo ""
echo -e "${BLUE}=== Documentation Quality ===${NC}"

if [ -f "$BASE/ARCHITECTURE.md" ]; then
    ARCH_LINES=$(wc -l < "$BASE/ARCHITECTURE.md" | tr -d ' ')
    test_check "ARCHITECTURE.md is comprehensive (>100 lines)" "[ $ARCH_LINES -gt 100 ]"
    echo "  └─ ARCHITECTURE.md has $ARCH_LINES lines"
fi

if [ -f "$BASE/team-config.yaml" ]; then
    CONFIG_LINES=$(wc -l < "$BASE/team-config.yaml" | tr -d ' ')
    test_check "team-config.yaml is detailed (>150 lines)" "[ $CONFIG_LINES -gt 150 ]"
    echo "  └─ team-config.yaml has $CONFIG_LINES lines"
fi

# =====================================
# SUMMARY
# =====================================
echo ""
echo "======================================"
echo "         TEST SUMMARY"
echo "======================================"
echo -e "${GREEN}Passed:${NC} $PASS / $TOTAL"
echo -e "${RED}Failed:${NC} $FAIL / $TOTAL"

if [ $TOTAL -gt 0 ]; then
    PERCENT=$((PASS * 100 / TOTAL))
    echo -e "${BLUE}Success Rate:${NC} ${PERCENT}%"
    echo ""
    
    if [ $PERCENT -eq 100 ]; then
        echo -e "${GREEN}🎉 PERFECT SCORE!${NC} All tests passed!"
        echo "Story 1.1 implementation is complete and validated."
    elif [ $PERCENT -ge 90 ]; then
        echo -e "${GREEN}✅ EXCELLENT${NC} - Story 1.1 meets all core requirements"
    elif [ $PERCENT -ge 80 ]; then
        echo -e "${YELLOW}⚠️  GOOD${NC} - Most requirements met with minor gaps"
    else
        echo -e "${RED}❌ NEEDS WORK${NC} - Significant gaps found"
    fi
fi

echo "======================================"

# Return appropriate exit code
if [ $FAIL -eq 0 ]; then
    exit 0
else
    exit 1
fi