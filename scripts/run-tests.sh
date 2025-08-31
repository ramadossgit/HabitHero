#!/bin/bash

# HabitHero Test Runner Script
# Usage: ./scripts/run-tests.sh [api|unit|e2e|mobile|all] [--coverage] [--watch]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
TEST_TYPE="all"
COVERAGE=false
WATCH=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    api|unit|e2e|mobile|all)
      TEST_TYPE="$1"
      shift
      ;;
    --coverage)
      COVERAGE=true
      shift
      ;;
    --watch)
      WATCH=true
      shift
      ;;
    --help)
      echo "Usage: $0 [api|unit|e2e|mobile|all] [--coverage] [--watch]"
      echo ""
      echo "Test types:"
      echo "  api     - Run API tests only"
      echo "  unit    - Run unit/component tests only"
      echo "  e2e     - Run end-to-end tests only"
      echo "  mobile  - Run mobile tests only"
      echo "  all     - Run all tests (default)"
      echo ""
      echo "Options:"
      echo "  --coverage - Generate coverage report"
      echo "  --watch    - Run tests in watch mode"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Helper functions
run_api_tests() {
  echo -e "${BLUE}📡 Running API Tests...${NC}"
  
  EXTRA_ARGS=""
  if [ "$COVERAGE" = true ]; then
    EXTRA_ARGS="$EXTRA_ARGS --coverage"
  fi
  if [ "$WATCH" = true ]; then
    EXTRA_ARGS="$EXTRA_ARGS --watch"
  fi
  
  npx vitest run tests/api $EXTRA_ARGS
  echo -e "${GREEN}✅ API tests completed${NC}\n"
}

run_unit_tests() {
  echo -e "${BLUE}🔧 Running Unit/Component Tests...${NC}"
  
  EXTRA_ARGS=""
  if [ "$COVERAGE" = true ]; then
    EXTRA_ARGS="$EXTRA_ARGS --coverage"
  fi
  if [ "$WATCH" = true ]; then
    EXTRA_ARGS="$EXTRA_ARGS --watch"
  fi
  
  npx vitest run tests/components $EXTRA_ARGS
  echo -e "${GREEN}✅ Unit tests completed${NC}\n"
}

run_e2e_tests() {
  echo -e "${BLUE}🌐 Running E2E Tests...${NC}"
  
  # Start development server if not already running
  if ! curl -s http://localhost:5000 > /dev/null; then
    echo -e "${YELLOW}Starting development server...${NC}"
    npm run dev &
    SERVER_PID=$!
    sleep 10
  fi
  
  npx playwright test
  
  # Stop server if we started it
  if [ ! -z "$SERVER_PID" ]; then
    kill $SERVER_PID
  fi
  
  echo -e "${GREEN}✅ E2E tests completed${NC}\n"
}

run_mobile_tests() {
  echo -e "${BLUE}📱 Running Mobile Tests...${NC}"
  
  # Check if Appium is installed
  if ! command -v appium &> /dev/null; then
    echo -e "${RED}Appium not found. Installing...${NC}"
    npm install -g appium
    npx appium driver install uiautomator2
    npx appium driver install xcuitest
  fi
  
  # Check for Android/iOS setup
  if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${YELLOW}Running iOS and Android tests...${NC}"
    npx wdio wdio.conf.js
  else
    echo -e "${YELLOW}Running Android tests only (iOS requires macOS)...${NC}"
    npx wdio wdio.conf.js --spec=tests/mobile/*.test.js --grep="Android"
  fi
  
  echo -e "${GREEN}✅ Mobile tests completed${NC}\n"
}

# Main execution
echo -e "${BLUE}🧪 HabitHero Test Suite Runner${NC}"
echo -e "${BLUE}=================================${NC}\n"

case $TEST_TYPE in
  api)
    run_api_tests
    ;;
  unit)
    run_unit_tests
    ;;
  e2e)
    run_e2e_tests
    ;;
  mobile)
    run_mobile_tests
    ;;
  all)
    run_api_tests
    run_unit_tests
    run_e2e_tests
    if [ "$CI" != "true" ]; then
      run_mobile_tests
    fi
    ;;
esac

echo -e "${GREEN}✅ All requested tests completed successfully!${NC}"

# Generate summary report
if [ "$COVERAGE" = true ]; then
  echo -e "${YELLOW}📊 Generating coverage summary...${NC}"
  echo "Coverage reports available in coverage/ directory"
fi