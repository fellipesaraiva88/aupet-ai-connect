# Auzap E2E Test Suite

Comprehensive test automation suite for the Auzap AI Connect platform using Playwright with TypeScript, following Test-Driven Development (TDD) principles.

## 🎯 Overview

This test suite provides complete coverage for the Auzap system including:

- **Authentication Flow**: Signup → Login → Dashboard validation
- **API Integration**: Full CRUD operations for all endpoints
- **Security Testing**: Authorization, input validation, XSS protection
- **Form Validation**: Real-time validation and user interactions
- **Responsive Design**: Multi-device and breakpoint testing
- **Performance**: Network conditions and loading states

## 🏗️ Architecture

```
tests/
├── api/                    # API integration tests
├── e2e/                    # End-to-end flow tests
├── security/               # Security and authorization tests
├── ui/                     # Form validation and UI interaction tests
├── responsive/             # Responsive design and UX tests
├── ci/                     # CI/CD integration utilities
├── page-objects/           # Page Object Model classes
├── utils/                  # Test utilities and helpers
├── global-setup.ts         # Global test setup
├── global-teardown.ts      # Global test cleanup
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Frontend running on port 8080
- Backend running on port 3001
- Supabase configured and accessible

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run test:install
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:auth          # Authentication flow tests
npm run test:api           # API integration tests
npm run test:security      # Security tests
npm run test:ui            # Form validation tests
npm run test:responsive    # Responsive design tests

# Run with specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run in headed mode (visible browser)
npx playwright test --headed

# Run specific test file
npx playwright test tests/e2e/auth-flow.spec.ts
```

### Viewing Test Reports

```bash
# Generate and view HTML report
npm run test:report

# View test results
open playwright-report/index.html
```

## 📋 Test Suites

### 1. Authentication Flow Tests (`tests/e2e/auth-flow.spec.ts`)

**TDD Focus**: Validates complete user journey from signup to dashboard access.

- ✅ **Signup → Login → Dashboard Flow**
  - Form validation with real-time feedback
  - Password strength requirements
  - Successful account creation
  - Automatic login after signup
  - Dashboard access verification

- ✅ **Session Management**
  - Token persistence across page reloads
  - Session sharing across browser tabs
  - Proper logout functionality
  - Protected route access control

- ✅ **Responsive Authentication**
  - Mobile signup flow
  - Tablet and desktop layouts
  - Touch interactions on mobile devices

### 2. API Integration Tests (`tests/api/api-integration.spec.ts`)

**TDD Focus**: Comprehensive API endpoint validation and data integrity.

- ✅ **Authentication API**
  - User signup with validation
  - Login with credential verification
  - JWT token handling
  - Invalid credential rejection

- ✅ **Customers API (CRUD)**
  - Create customer with validation
  - Retrieve customer list with pagination
  - Update customer information
  - Delete customer records
  - Search and filtering

- ✅ **Pets API (CRUD)**
  - Create pet with customer association
  - Pet listing and filtering
  - Update pet information
  - Species and breed validation

- ✅ **Appointments API (CRUD)**
  - Schedule appointments
  - Date/time validation
  - Status management
  - Customer/pet association

- ✅ **Data Consistency**
  - Concurrent request handling
  - Data integrity validation
  - Error handling and rollback

### 3. Security & Authorization Tests (`tests/security/authorization.spec.ts`)

**TDD Focus**: Comprehensive security validation and threat protection.

- ✅ **Route Protection**
  - Unauthenticated access prevention
  - Proper redirect behavior
  - JWT token validation
  - Expired token handling

- ✅ **Data Access Control**
  - Organization-level data isolation
  - User permission validation
  - Cross-tenant data protection

- ✅ **Input Validation & XSS Protection**
  - Form input sanitization
  - XSS payload prevention
  - SQL injection protection
  - Email format validation

- ✅ **API Security**
  - Authorization header validation
  - Rate limiting enforcement
  - CORS policy verification
  - Security header implementation

### 4. Form Validation Tests (`tests/ui/form-validation.spec.ts`)

**TDD Focus**: Real-time form validation and user interaction flows.

- ✅ **Signup Form Validation**
  - Required field validation
  - Email format checking
  - Password strength requirements
  - Organization name validation
  - Real-time error clearing

- ✅ **Form Interactions**
  - Password visibility toggle
  - Dropdown selections
  - Keyboard navigation
  - Loading state handling

- ✅ **Customer/Pet/Appointment Forms**
  - Field validation rules
  - Date/time restrictions
  - Required field enforcement
  - Cross-field validation

- ✅ **Search and Filters**
  - Search functionality
  - Filter application
  - Result updates
  - URL state management

### 5. Responsive Design Tests (`tests/responsive/responsive-design.spec.ts`)

**TDD Focus**: Multi-device compatibility and user experience validation.

- ✅ **Multi-Device Testing**
  - Mobile (375px): iPhone layouts
  - Tablet (768px): iPad layouts
  - Desktop (1280px): Standard desktop
  - Large Desktop (1920px): Full HD

- ✅ **Touch Interactions**
  - Tap targets (minimum 44px)
  - Swipe gestures
  - Pinch zoom prevention
  - Touch navigation

- ✅ **Layout Breakpoints**
  - Grid system adaptation
  - Content overflow handling
  - Sidebar behavior changes
  - Navigation menu transformations

- ✅ **Performance on Mobile**
  - Slow network simulation
  - Image loading optimization
  - JavaScript execution timing
  - Battery usage considerations

## 🧪 TDD Methodology

Our test suite follows strict Test-Driven Development principles:

### Red-Green-Refactor Cycle

1. **🔴 Red Phase**: Write failing tests that define expected behavior
2. **🟢 Green Phase**: Implement minimal code to make tests pass
3. **🔵 Refactor Phase**: Improve code while maintaining test coverage

### Test Structure

Each test follows the **Arrange-Act-Assert** pattern:

```typescript
test('should create customer successfully', async () => {
  // Arrange: Set up test data and preconditions
  const customerData = {
    name: 'Test Customer',
    email: TestHelpers.generateTestEmail(),
    phone: '+5511999887766'
  };

  // Act: Perform the action being tested
  const response = await apiClient.createCustomer(customerData);

  // Assert: Verify the expected outcome
  expect(response.success).toBeTruthy();
  expect(response.data.customer.name).toBe(customerData.name);
});
```

### Page Object Model

We use the Page Object Model pattern for maintainable and reusable test code:

```typescript
export class SignupPage {
  constructor(private page: Page) {}

  async completeSignup(data: SignupData) {
    await this.goto();
    await this.fillSignupForm(data);
    await this.submitForm();
    return data;
  }

  async verifySuccessfulSignup() {
    await this.helpers.verifyToast('Conta criada com sucesso');
    await this.helpers.verifyURL('/');
  }
}
```

## 🔧 Configuration

### Playwright Configuration (`playwright.config.ts`)

- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Parallel Execution**: Up to 4 workers for faster test execution
- **Retries**: 2 retries on CI, 0 on local development
- **Timeouts**: 60s test timeout, 30s action timeout
- **Reports**: HTML, JSON, JUnit XML formats

### Test Environment Variables

```bash
# Frontend URL
PLAYWRIGHT_BASE_URL=http://localhost:8080

# Backend API URL
PLAYWRIGHT_API_URL=http://localhost:3001

# Test execution settings
PLAYWRIGHT_WORKERS=4
PLAYWRIGHT_RETRIES=2
```

## 📊 CI/CD Integration

### GitHub Actions Workflow (`.github/workflows/test.yml`)

Our CI/CD pipeline includes:

- **Health Checks**: System readiness validation
- **Unit Tests**: Frontend component testing
- **E2E Tests**: Cross-browser testing with sharding
- **API Tests**: Backend integration validation
- **Security Tests**: Authorization and security validation
- **Visual Tests**: Responsive design verification
- **Result Aggregation**: Combined reporting and notifications

### Test Execution Matrix

| Browser | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Chromium | ✅ | ✅ | ✅ |
| Firefox | ✅ | ✅ | ✅ |
| WebKit | ✅ | ✅ | ✅ |

## 🛠️ Development Workflow

### Adding New Tests

1. **Identify the requirement** based on user story or bug report
2. **Write failing test** that describes expected behavior
3. **Run test** to confirm it fails (Red phase)
4. **Implement minimal code** to make test pass (Green phase)
5. **Refactor** and optimize while maintaining passing tests

### Test Naming Convention

```typescript
// Feature-based grouping
test.describe('TDD: Authentication Flow', () => {
  // Specific behavior testing
  test('should complete signup → login → dashboard flow successfully', async () => {
    // Test implementation
  });
});
```

### Page Object Updates

When UI changes occur:

1. Update relevant page object selectors
2. Add new helper methods if needed
3. Update related test assertions
4. Verify all dependent tests still pass

## 📈 Test Metrics and Reporting

### Coverage Requirements

- **Lines**: 80% minimum coverage
- **Functions**: 80% minimum coverage
- **Branches**: 80% minimum coverage
- **Statements**: 80% minimum coverage

### Performance Benchmarks

- **Page Load**: < 3 seconds on desktop, < 5 seconds on mobile
- **API Response**: < 500ms for CRUD operations
- **Form Submission**: < 2 seconds including validation

### Test Execution Times

- **Full Suite**: ~15 minutes (parallel execution)
- **Authentication**: ~3 minutes
- **API Tests**: ~5 minutes
- **Security Tests**: ~4 minutes
- **Responsive Tests**: ~8 minutes

## 🔍 Debugging Tests

### Running Tests in Debug Mode

```bash
# Debug specific test
npx playwright test --debug tests/e2e/auth-flow.spec.ts

# Debug with browser visible
npx playwright test --headed --slowMo=1000

# Run single test with verbose output
npx playwright test --verbose tests/api/api-integration.spec.ts
```

### Test Artifacts

When tests fail, the following artifacts are captured:

- **Screenshots**: Visual state at failure point
- **Videos**: Complete test execution recording
- **Traces**: Detailed execution timeline with network requests
- **Logs**: Console output and error messages

### Common Issues and Solutions

#### 1. Network Timeouts
```bash
# Increase timeout for slow networks
npx playwright test --timeout=120000
```

#### 2. Element Not Found
```typescript
// Wait for element to be visible
await page.waitForSelector(selector, { state: 'visible' });
```

#### 3. Flaky Tests
```typescript
// Add explicit waits for network requests
await page.waitForLoadState('networkidle');
```

## 🤝 Contributing

### Test Contribution Guidelines

1. **Follow TDD principles**: Red-Green-Refactor cycle
2. **Use Page Object Model**: Maintain separation of concerns
3. **Write descriptive test names**: Clear intent and expected behavior
4. **Include both positive and negative test cases**
5. **Ensure cross-browser compatibility**
6. **Add appropriate test documentation**

### Code Review Checklist

- [ ] Tests follow TDD methodology
- [ ] Page objects are properly structured
- [ ] Test data is properly managed
- [ ] Error scenarios are covered
- [ ] Performance considerations addressed
- [ ] Security validations included
- [ ] Responsive design tested

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Test-Driven Development Guide](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Accessibility Testing](https://playwright.dev/docs/accessibility-testing)

---

**Last Updated**: 2025-01-17
**Test Suite Version**: 1.0.0
**Playwright Version**: 1.55.1