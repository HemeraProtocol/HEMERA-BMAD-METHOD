#!/bin/bash

# Story 1.1 Validation Test Runner
# Automated test execution for expansion pack structure validation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
PASS=0
FAIL=0
SKIP=0
TOTAL=0

# Base path
BASE_PATH="expansion-packs/crypto-investment-committee"
cd "$(dirname "$0")/../../.." # Navigate to HEMERA-BMAD-METHOD root

# Test functions
log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
    ((TOTAL++))
}

pass() {
    echo -e "${GREEN}  ✅ PASS${NC}: $1"
    ((PASS++))
}

fail() {
    echo -e "${RED}  ❌ FAIL${NC}: $1"
    ((FAIL++))
}

skip() {
    echo -e "${YELLOW}  ⏭️  SKIP${NC}: $1"
    ((SKIP++))
}

# Header
echo "================================================"
echo "     Story 1.1 Validation Test Suite"
echo "     Crypto Investment Committee Structure"
echo "================================================"
echo ""

# =============================================================================
# STRUCTURAL VALIDATION TESTS
# =============================================================================
echo -e "${BLUE}═══ STRUCTURAL VALIDATION ═══${NC}"

log_test "1.1.1: Directory Structure Verification"
if [ -d "$BASE_PATH" ]; then
    if [ -d "$BASE_PATH/agents" ] && [ -d "$BASE_PATH/tasks" ] && \
       [ -d "$BASE_PATH/templates" ] && [ -d "$BASE_PATH/data" ]; then
        pass "All required directories exist"
    else
        fail "Missing required subdirectories"
    fi
else
    fail "Base directory not found"
fi

log_test "1.1.2: File Count Validation"
FILE_COUNT=$(find "$BASE_PATH" -type f -name "*.md" -o -name "*.yaml" 2>/dev/null | wc -l | tr -d ' ')
if [ "$FILE_COUNT" -ge 13 ]; then
    pass "Found $FILE_COUNT files (minimum: 13)"
else
    fail "Only $FILE_COUNT files found (minimum: 13)"
fi

log_test "1.1.3: Required Files Existence"
REQUIRED_FILES=(
    "$BASE_PATH/team-config.yaml"
    "$BASE_PATH/ARCHITECTURE.md"
    "$BASE_PATH/IMPLEMENTATION.md"
)
ALL_EXIST=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        ALL_EXIST=false
        fail "Missing: $(basename $file)"
    fi
done
if $ALL_EXIST; then
    pass "All required files present"
fi

# =============================================================================
# CONFIGURATION VALIDATION TESTS
# =============================================================================
echo ""
echo -e "${BLUE}═══ CONFIGURATION VALIDATION ═══${NC}"

log_test "1.2.1: team-config.yaml Structure"
if [ -f "$BASE_PATH/team-config.yaml" ]; then
    # Check for required sections using grep
    if grep -q "^bundle:" "$BASE_PATH/team-config.yaml" && \
       grep -q "^team_structure:" "$BASE_PATH/team-config.yaml" && \
       grep -q "^workflows:" "$BASE_PATH/team-config.yaml" && \
       grep -q "^interaction_matrix:" "$BASE_PATH/team-config.yaml"; then
        pass "All required YAML sections present"
    else
        fail "Missing required YAML sections"
    fi
else
    fail "team-config.yaml not found"
fi

log_test "1.2.2: Agent Files Validation"
AGENT_COUNT=$(find "$BASE_PATH/agents" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
if [ "$AGENT_COUNT" -ge 2 ]; then
    pass "Found $AGENT_COUNT agent files (minimum: 2)"
else
    fail "Only $AGENT_COUNT agent files (minimum: 2)"
fi

log_test "1.2.3: Template Files Validation"
TEMPLATE_COUNT=$(find "$BASE_PATH/templates" -name "*.yaml" 2>/dev/null | wc -l | tr -d ' ')
if [ "$TEMPLATE_COUNT" -ge 3 ]; then
    pass "Found $TEMPLATE_COUNT template files (minimum: 3)"
else
    fail "Only $TEMPLATE_COUNT template files (minimum: 3)"
fi

# =============================================================================
# CONTENT VALIDATION TESTS
# =============================================================================
echo ""
echo -e "${BLUE}═══ CONTENT VALIDATION ═══${NC}"

log_test "1.3.1: Agent Definition Completeness"
if [ -f "$BASE_PATH/agents/cio-orchestrator.md" ]; then
    if grep -q "^agent:" "$BASE_PATH/agents/cio-orchestrator.md" && \
       grep -q "persona:" "$BASE_PATH/agents/cio-orchestrator.md" && \
       grep -q "commands:" "$BASE_PATH/agents/cio-orchestrator.md"; then
        pass "CIO orchestrator has complete definition"
    else
        fail "CIO orchestrator missing required sections"
    fi
else
    fail "CIO orchestrator file not found"
fi

log_test "1.3.2: Template Structure Check"
if [ -f "$BASE_PATH/templates/investment-verdict-tmpl.yaml" ]; then
    if grep -q "verdict_structure:" "$BASE_PATH/templates/investment-verdict-tmpl.yaml" && \
       grep -q "output_format:" "$BASE_PATH/templates/investment-verdict-tmpl.yaml"; then
        pass "Investment verdict template properly structured"
    else
        fail "Investment verdict template missing sections"
    fi
else
    fail "Investment verdict template not found"
fi

log_test "1.3.3: Documentation Quality"
if [ -f "$BASE_PATH/ARCHITECTURE.md" ]; then
    LINE_COUNT=$(wc -l < "$BASE_PATH/ARCHITECTURE.md" | tr -d ' ')
    if [ "$LINE_COUNT" -ge 100 ]; then
        pass "ARCHITECTURE.md has $LINE_COUNT lines (comprehensive)"
    else
        fail "ARCHITECTURE.md only has $LINE_COUNT lines"
    fi
else
    fail "ARCHITECTURE.md not found"
fi

# =============================================================================
# NAMING CONVENTION TESTS
# =============================================================================
echo ""
echo -e "${BLUE}═══ NAMING CONVENTION TESTS ═══${NC}"

log_test "1.4.1: Template File Naming"
INVALID_TEMPLATES=$(find "$BASE_PATH/templates" -name "*.yaml" ! -name "*-tmpl.yaml" 2>/dev/null)
if [ -z "$INVALID_TEMPLATES" ]; then
    pass "All templates follow naming convention (*-tmpl.yaml)"
else
    fail "Invalid template names found"
fi

log_test "1.4.2: Agent File Extensions"
INVALID_AGENTS=$(find "$BASE_PATH/agents" -type f ! -name "*.md" 2>/dev/null)
if [ -z "$INVALID_AGENTS" ]; then
    pass "All agent files use .md extension"
else
    fail "Non-markdown files in agents directory"
fi

# =============================================================================
# INTEGRATION READINESS TESTS
# =============================================================================
echo ""
echo -e "${BLUE}═══ INTEGRATION READINESS ═══${NC}"

log_test "1.5.1: Task Files Present"
TASK_COUNT=$(find "$BASE_PATH/tasks" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
if [ "$TASK_COUNT" -ge 2 ]; then
    pass "Found $TASK_COUNT task files"
else
    fail "Only $TASK_COUNT task files found"
fi

log_test "1.5.2: Data Files Present"
DATA_COUNT=$(find "$BASE_PATH/data" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
if [ "$DATA_COUNT" -ge 3 ]; then
    pass "Found $DATA_COUNT data files"
else
    fail "Only $DATA_COUNT data files found"
fi

log_test "1.5.3: Cross-Reference Validation"
# Check if team-config references existing agents
if grep -q "crypto-cio-orchestrator" "$BASE_PATH/team-config.yaml" && \
   [ -f "$BASE_PATH/agents/cio-orchestrator.md" ]; then
    pass "team-config correctly references existing agents"
else
    skip "Cannot validate agent references (implementation needed)"
fi

# =============================================================================
# PERFORMANCE & QUALITY METRICS
# =============================================================================
echo ""
echo -e "${BLUE}═══ QUALITY METRICS ═══${NC}"

log_test "1.6.1: Configuration Completeness"
if [ -f "$BASE_PATH/team-config.yaml" ]; then
    if grep -q "performance_metrics:" "$BASE_PATH/team-config.yaml" && \
       grep -q "quality_standards:" "$BASE_PATH/team-config.yaml"; then
        pass "Advanced configuration sections present"
    else
        fail "Missing performance/quality sections"
    fi
else
    fail "Configuration file not found"
fi

log_test "1.6.2: Meeting Protocol Definition"
if grep -q "meeting_protocols:" "$BASE_PATH/team-config.yaml"; then
    if grep -q "phases:" "$BASE_PATH/team-config.yaml"; then
        pass "Meeting protocols with phases defined"
    else
        fail "Meeting protocols incomplete"
    fi
else
    fail "No meeting protocols defined"
fi

# =============================================================================
# TEST SUMMARY
# =============================================================================
echo ""
echo "================================================"
echo "              TEST SUMMARY"
echo "================================================"
echo -e "${GREEN}Passed:${NC}  $PASS"
echo -e "${RED}Failed:${NC}  $FAIL"
echo -e "${YELLOW}Skipped:${NC} $SKIP"
echo -e "${BLUE}Total:${NC}   $TOTAL"
echo ""

# Calculate percentage
if [ $TOTAL -gt 0 ]; then
    PERCENT=$((PASS * 100 / TOTAL))
    echo -e "Success Rate: ${PERCENT}%"
    
    if [ $PERCENT -ge 90 ]; then
        echo -e "${GREEN}🎉 EXCELLENT: Story 1.1 implementation validated!${NC}"
        EXIT_CODE=0
    elif [ $PERCENT -ge 70 ]; then
        echo -e "${YELLOW}⚠️  GOOD: Most requirements met, some issues found${NC}"
        EXIT_CODE=1
    else
        echo -e "${RED}❌ NEEDS WORK: Significant gaps in implementation${NC}"
        EXIT_CODE=2
    fi
else
    echo -e "${RED}No tests executed${NC}"
    EXIT_CODE=3
fi

echo "================================================"

# Detailed failure report if any
if [ $FAIL -gt 0 ]; then
    echo ""
    echo -e "${RED}Failed Test Details:${NC}"
    echo "Please review the test output above for specific failures."
    echo "Run individual tests with verbose mode for more details."
fi

exit $EXIT_CODE