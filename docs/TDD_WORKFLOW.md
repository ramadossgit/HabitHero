# Test-Driven Development (TDD) Workflow for HabitHero

This document outlines the comprehensive TDD approach for the HabitHero project, covering Web, iOS, and Android platforms.

## TDD Cycle: Red-Green-Refactor

### 1. Red Phase: Write Failing Tests First

Before implementing any new feature:

1. **API Tests**: Write failing API endpoint tests
2. **Component Tests**: Write failing UI component tests  
3. **E2E Tests**: Write failing end-to-end behavior tests
4. **Mobile Tests**: Write failing mobile-specific tests

### 2. Green Phase: Make Tests Pass

Implement the minimal code required to make tests pass:

1. **Backend Implementation**: API routes, business logic
2. **Frontend Implementation**: Components, hooks, utilities
3. **Mobile Implementation**: Platform-specific code

### 3. Refactor Phase: Optimize Code

Improve code quality while keeping tests green:

1. **Code Structure**: Extract reusable components
2. **Performance**: Optimize queries and rendering
3. **Maintainability**: Add proper TypeScript types

## Testing Pyramid Structure

```
                    🔺 E2E Tests (Few)
                   /                \
                  /   Mobile Tests   \
                 /    (Platform)      \
                /____________________\
               /                      \
              /   Integration Tests    \
             /     (API + UI)          \
            /__________________________\
           /                            \
          /        Unit Tests            \
         /    (Components, Utils)        \
        /______________________________\
       /                                \
      /           API Tests              \
     /        (Backend Logic)            \
    /____________________________________\
```

## Test Categories

### 1. API Tests (`tests/api/`)
- **Purpose**: Test backend endpoints and business logic
- **Framework**: Vitest + Supertest
- **Coverage**: 
  - Request/response validation
  - Authentication & authorization
  - Error handling
  - Database operations

### 2. Unit/Component Tests (`tests/components/`)
- **Purpose**: Test individual React components
- **Framework**: Vitest + Testing Library
- **Coverage**:
  - Component rendering
  - User interactions
  - State management
  - Props validation

### 3. End-to-End Tests (`tests/e2e/`)
- **Purpose**: Test complete user workflows
- **Framework**: Playwright
- **Coverage**:
  - Multi-browser testing
  - Real user scenarios
  - Cross-device compatibility

### 4. Mobile Tests (`tests/mobile/`)
- **Purpose**: Test native mobile app functionality
- **Framework**: WebDriverIO + Appium
- **Coverage**:
  - iOS and Android platforms
  - Touch gestures
  - Device-specific features
  - Offline functionality

## TDD Workflow for New Features

### Example: Adding Premium Auto-Approval Feature

#### Step 1: Write Failing Tests

**API Test** (`tests/api/auto-approval.test.ts`):
```typescript
describe('Auto-Approval API', () => {
  it('should create auto-approval settings for premium users', async () => {
    const response = await request(app)
      .post('/api/auto-approval-settings')
      .send({ enabled: true, timeValue: 24, timeUnit: 'hours' })
      .expect(201)
    
    expect(response.body).toHaveProperty('id')
    expect(response.body.enabled).toBe(true)
  })
  
  it('should reject settings creation for free users', async () => {
    // Mock free user
    await request(freeUserApp)
      .post('/api/auto-approval-settings')
      .send({ enabled: true, timeValue: 24, timeUnit: 'hours' })
      .expect(403)
  })
})
```

**Component Test** (`tests/components/auto-approval-settings.test.tsx`):
```typescript
describe('AutoApprovalSettings Component', () => {
  it('should render settings form for premium users', () => {
    render(<AutoApprovalSettings isPremium={true} />)
    
    expect(screen.getByLabelText(/auto-approve after/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/time unit/i)).toBeInTheDocument()
  })
  
  it('should show upgrade prompt for free users', () => {
    render(<AutoApprovalSettings isPremium={false} />)
    
    expect(screen.getByText(/upgrade to premium/i)).toBeInTheDocument()
  })
})
```

**E2E Test** (`tests/e2e/auto-approval.spec.ts`):
```typescript
test('Premium user can configure auto-approval settings', async ({ page }) => {
  await loginAsPremiumUser(page)
  await page.goto('/habit-approval')
  
  await page.click('button:has-text("Configure Auto-Approval")')
  await page.selectOption('[data-testid="time-value"]', '12')
  await page.selectOption('[data-testid="time-unit"]', 'hours')
  await page.click('button:has-text("Save")')
  
  await expect(page.locator('text=Settings saved')).toBeVisible()
})
```

**Mobile Test** (`tests/mobile/auto-approval.test.js`):
```javascript
it('should configure auto-approval on mobile', async () => {
  await navigateToHabitApproval()
  
  const configureButton = await $('~configure-auto-approval-button')
  await configureButton.click()
  
  await selectTimeValue('12')
  await selectTimeUnit('hours')
  
  const saveButton = await $('~save-settings-button')
  await saveButton.click()
  
  const successMessage = await $('~success-message')
  await expect(successMessage).toBeDisplayed()
})
```

#### Step 2: Run Tests (Should Fail - Red Phase)

```bash
npm run test -- --all
# All tests should fail since feature doesn't exist yet
```

#### Step 3: Implement Minimal Code (Green Phase)

**Backend Implementation**:
1. Create API endpoint
2. Add database schema
3. Implement business logic

**Frontend Implementation**:
1. Create component
2. Add form handling
3. Integrate with API

**Mobile Implementation**:
1. Add native components
2. Implement touch handlers
3. Connect to backend

#### Step 4: Run Tests Again (Should Pass - Green Phase)

```bash
npm run test -- --all
# All tests should now pass
```

#### Step 5: Refactor Code (Refactor Phase)

1. Extract reusable components
2. Optimize performance
3. Add proper error handling
4. Improve TypeScript types

#### Step 6: Run Tests After Refactoring

```bash
npm run test -- --all --coverage
# Tests should still pass with improved coverage
```

## Running Tests

### Individual Test Suites

```bash
# API tests only
npm run test:api

# Component tests only
npm run test:unit

# E2E tests only
npm run test:e2e

# Mobile tests only
npm run test:mobile

# Android tests only
npm run test:mobile:android

# iOS tests only (macOS only)
npm run test:mobile:ios
```

### Combined Test Runs

```bash
# All tests
npm run test:all

# All tests with coverage
npm run test:all:coverage

# Watch mode for development
npm run test:watch

# CI/CD pipeline
npm run test:ci
```

### Test Configuration

#### Environment Variables
```bash
# Test environment
NODE_ENV=test

# Database URL for testing
TEST_DATABASE_URL=postgresql://localhost:5432/habitheroes_test

# Mock external services
MOCK_EXTERNAL_APIS=true

# Mobile testing
ANDROID_HOME=/path/to/android-sdk
APPIUM_HOST=localhost
APPIUM_PORT=4723
```

## Code Coverage Requirements

- **Minimum Coverage**: 80% overall
- **API Tests**: 90% coverage of backend code
- **Component Tests**: 85% coverage of React components
- **E2E Tests**: 70% of critical user paths
- **Mobile Tests**: 75% of mobile-specific features

## Continuous Integration

### GitHub Actions Workflow (`.github/workflows/test.yml`):

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  api-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:api

  unit-tests:
    runs-on: ubuntu-latest  
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e

  mobile-tests:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:mobile
```

## Best Practices

### 1. Test Organization
- Group related tests in describe blocks
- Use clear, descriptive test names
- Follow AAA pattern: Arrange, Act, Assert

### 2. Test Data Management
- Use factories for test data creation
- Clean up after each test
- Avoid shared mutable state

### 3. Mock Strategy
- Mock external APIs and services
- Use real database for integration tests
- Mock time-dependent functions

### 4. Error Testing
- Test both happy path and error cases
- Verify proper error messages
- Check error boundaries

### 5. Accessibility Testing
- Test keyboard navigation
- Verify ARIA labels
- Check screen reader compatibility

## Debugging Failed Tests

### 1. Check Test Output
```bash
npm run test -- --reporter=verbose
```

### 2. Use Debug Mode
```bash
npm run test:debug
```

### 3. Screenshot on Failure (E2E/Mobile)
Tests automatically capture screenshots on failure in `test-results/` directory.

### 4. Inspect Network Requests
Use browser dev tools or Charles Proxy for mobile tests.

## Maintenance

### 1. Regular Updates
- Update test dependencies monthly
- Review and update test data
- Refactor obsolete tests

### 2. Performance Monitoring
- Track test execution time
- Optimize slow tests
- Parallelize test execution

### 3. Coverage Analysis
- Review coverage reports weekly
- Identify untested code paths
- Add tests for critical missing coverage

This TDD workflow ensures high-quality, well-tested code across all platforms while maintaining rapid development velocity.