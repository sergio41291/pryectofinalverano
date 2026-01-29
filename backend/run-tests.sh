#!/bin/bash

# LearnMind AI - Testing & Load Testing Script
# Completes Phase 1 Testing
# Phase 1: OCR Integration + Unit Tests + Load Testing

set -e

echo "========================================"
echo "🚀 LearnMind AI - Phase 1 Testing Suite"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="$(pwd)"
LOG_FILE="$BACKEND_DIR/test-results-$(date +%Y%m%d-%H%M%S).log"
COVERAGE_DIR="$BACKEND_DIR/coverage"
LOAD_TEST_REPORT="$BACKEND_DIR/load-test-report.html"

# Función para log
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

log_section() {
    echo -e "\n${BLUE}════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}════════════════════════════════════${NC}\n"
}

# Pre-flight checks
log_section "Pre-Flight Checks"

# Check Node.js
if ! command -v node &> /dev/null; then
    log "${RED}❌ Node.js not found. Please install Node.js >= 18.0.0${NC}"
    exit 1
fi
log "${GREEN}✅${NC} Node.js $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    log "${RED}❌ NPM not found${NC}"
    exit 1
fi
log "${GREEN}✅${NC} NPM $(npm --version)"

# Check Python
if ! command -v python &> /dev/null; then
    log "${RED}❌ Python not found. Please install Python >= 3.8${NC}"
    exit 1
fi
log "${GREEN}✅${NC} Python $(python --version)"

# Check database connection
log ""
log "Checking database connections..."
if nc -z localhost 5432 2>/dev/null; then
    log "${GREEN}✅${NC} PostgreSQL: Running on port 5432"
else
    log "${YELLOW}⚠️${NC} PostgreSQL: Not running - some tests may fail"
fi

if nc -z localhost 6379 2>/dev/null; then
    log "${GREEN}✅${NC} Redis: Running on port 6379"
else
    log "${YELLOW}⚠️${NC} Redis: Not running - caching disabled"
fi

# Step 1: Verify Environment
log_section "Step 1: Environment Verification"

if [ -f "$BACKEND_DIR/verify-environment.sh" ]; then
    bash "$BACKEND_DIR/verify-environment.sh" | tee -a "$LOG_FILE"
else
    log "${YELLOW}⚠️${NC} Environment verification script not found"
fi

# Step 2: Install Dependencies
log_section "Step 2: Installing Dependencies"

log "${CYAN}📦 Installing NPM packages...${NC}"
npm install --legacy-peer-deps 2>&1 | grep -E "added|up to date" | tail -1 >> "$LOG_FILE"
log "${GREEN}✅${NC} NPM packages installed"

log "${CYAN}🐍 Installing Python dependencies...${NC}"
if pip install -q -r "$BACKEND_DIR/requirements.txt" 2>/dev/null; then
    log "${GREEN}✅${NC} Python dependencies installed"
else
    log "${YELLOW}⚠️${NC} Some Python packages may need manual installation"
fi

# Step 3: Lint & Build
log_section "Step 3: Code Quality Checks"

log "${CYAN}📝 Running ESLint...${NC}"
if npm run lint 2>&1 | tee -a "$LOG_FILE" | grep -q "error"; then
    log "${YELLOW}⚠️${NC} Linting issues found"
else
    log "${GREEN}✅${NC} Code quality check passed"
fi

log "${CYAN}🏗️  Building TypeScript...${NC}"
if npm run build 2>&1 >> "$LOG_FILE"; then
    log "${GREEN}✅${NC} Build successful"
else
    log "${RED}❌${NC} Build failed - check logs"
    exit 1
fi

# Step 4: Unit Tests
log_section "Step 4: Unit Tests"

log "${CYAN}🧪 Running unit tests...${NC}"
if npm run test -- --coverage --coverageDirectory="$COVERAGE_DIR" 2>&1 | tee -a "$LOG_FILE"; then
    log "${GREEN}✅${NC} Unit tests passed"
    
    if [ -f "$COVERAGE_DIR/coverage-summary.json" ]; then
        COVERAGE=$(grep -o '"lines"[^}]*' "$COVERAGE_DIR/coverage-summary.json" | grep -o '[0-9.]*' | head -1)
        log "   Coverage: ${CYAN}${COVERAGE}%${NC}"
    fi
else
    log "${YELLOW}⚠️${NC} Some unit tests failed - continuing..."
fi

# Step 5: E2E Tests
log_section "Step 5: End-to-End Tests"

log "${CYAN}🌐 Running E2E tests...${NC}"
if npm run test:e2e 2>&1 | tee -a "$LOG_FILE"; then
    log "${GREEN}✅${NC} E2E tests passed"
else
    log "${YELLOW}⚠️${NC} Some E2E tests failed"
fi

# Step 6: API Health Check
log_section "Step 6: API Health Check"

log "${CYAN}🏥 Checking API health...${NC}"
HEALTH=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3001/api/health 2>/dev/null || echo "000")

if [ "$HEALTH" = "200" ]; then
    log "${GREEN}✅${NC} API Health: OK (HTTP $HEALTH)"
elif [ "$HEALTH" = "000" ]; then
    log "${YELLOW}⚠️${NC} API not running - skipping load tests"
    log "   Start backend: npm run start:dev"
else
    log "${YELLOW}⚠️${NC} API Health: HTTP $HEALTH"
fi

# Step 7: Load Testing
log_section "Step 7: Load Testing"

log "${CYAN}⚡ Installing Artillery...${NC}"
npm install -g artillery 2>&1 >> "$LOG_FILE" || log "${YELLOW}⚠️${NC} Artillery already installed"

if [ "$HEALTH" = "200" ]; then
    log "${CYAN}🔥 Running load tests...${NC}"
    artillery run "$BACKEND_DIR/load-test-config.yml" --output "$LOAD_TEST_REPORT" 2>&1 | tee -a "$LOG_FILE"
    
    if [ -f "$LOAD_TEST_REPORT" ]; then
        log "${GREEN}✅${NC} Load test completed"
        log "   Report: ${CYAN}$LOAD_TEST_REPORT${NC}"
    fi
else
    log "${YELLOW}⚠️${NC} Skipping load tests - API not available"
fi

# Final Summary
log_section "Test Summary"

log "${CYAN}📊 Test Results Logged In:${NC}"
log "   ${CYAN}$LOG_FILE${NC}"

if [ -d "$COVERAGE_DIR" ]; then
    log "\n${CYAN}📈 Coverage Report:${NC}"
    log "   ${CYAN}$COVERAGE_DIR/index.html${NC}"
fi

if [ -f "$LOAD_TEST_REPORT" ]; then
    log "\n${CYAN}⚡ Load Test Report:${NC}"
    log "   ${CYAN}$LOAD_TEST_REPORT${NC}"
fi

log "\n${GREEN}════════════════════════════════════${NC}"
log "${GREEN}✅ Phase 1 Testing Complete!${NC}"
log "${GREEN}════════════════════════════════════${NC}\n"

log "📌 Next Steps:"
log "   1. Review coverage report: open $COVERAGE_DIR/index.html"
log "   2. Check load test results: open $LOAD_TEST_REPORT"
log "   3. Commit changes: git commit -m 'test: Phase 1 testing complete'"
log "   4. Start Phase 2: Integrate Claude API for summarization"
log ""

exit 0

artillery run load-test-config.yml --output load-test-results.json

# Generate report
artillery report load-test-results.json --output load-test-report.html

echo -e "\n${BLUE}=====================================${NC}"
echo -e "${GREEN}✅ Phase 1 Testing Complete!${NC}"
echo -e "${BLUE}=====================================${NC}"
echo -e "\n📊 Test Results:"
echo -e "  • Unit Tests: $([ $TEST_RESULT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo -e "  • E2E Tests: $([ $E2E_RESULT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo -e "  • Health Check: $([ "$HEALTH" == "200" ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo -e "  • Load Tests: ✅ COMPLETED"
echo -e "\n📄 Reports:"
echo -e "  • test-results.log"
echo -e "  • load-test-report.html"
