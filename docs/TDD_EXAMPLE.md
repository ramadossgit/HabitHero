# TDD Example: Adding Premium Voice Recording Feature

This document demonstrates the complete TDD workflow for implementing a Premium Voice Recording feature in HabitHero.

## Feature Requirements

- Premium users can record voice messages for habit completions
- Voice recordings are stored securely in cloud storage
- Children can listen to parent's voice messages
- Free users see upgrade prompts when attempting to use voice features

## TDD Implementation Steps

### Step 1: Write Failing Tests (Red Phase)

#### API Test (`tests/api/voice-recording.test.ts`)

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import request from 'supertest'
import { createServer } from 'http'
import express from 'express'
import { registerRoutes } from '../../server/routes'

describe('Voice Recording API', () => {
  let app: express.Application
  let server: any

  beforeEach(async () => {
    app = express()
    app.use(express.json())
    
    // Mock premium authenticated user
    app.use((req, res, next) => {
      req.user = {
        id: 'premium-user-id',
        subscriptionStatus: 'active'
      }
      req.isAuthenticated = () => true
      next()
    })

    server = await registerRoutes(app)
  })

  afterEach(() => {
    if (server) {
      server.close()
    }
  })

  describe('POST /api/voice-recordings/upload-url', () => {
    it('should generate presigned URL for premium users', async () => {
      const response = await request(app)
        .post('/api/voice-recordings/upload-url')
        .send({
          habitId: 'test-habit-id',
          duration: 30,
          format: 'mp3'
        })
        .expect(200)

      expect(response.body).toHaveProperty('uploadUrl')
      expect(response.body).toHaveProperty('voiceRecordingId')
      expect(response.body.uploadUrl).toMatch(/^https:\/\//)
    })

    it('should reject requests from free users', async () => {
      const freeUserApp = express()
      freeUserApp.use(express.json())
      freeUserApp.use((req, res, next) => {
        req.user = {
          id: 'free-user-id',
          subscriptionStatus: 'free'
        }
        req.isAuthenticated = () => true
        next()
      })
      await registerRoutes(freeUserApp)

      await request(freeUserApp)
        .post('/api/voice-recordings/upload-url')
        .send({
          habitId: 'test-habit-id',
          duration: 30,
          format: 'mp3'
        })
        .expect(403)
    })

    it('should validate duration limits (max 60 seconds)', async () => {
      await request(app)
        .post('/api/voice-recordings/upload-url')
        .send({
          habitId: 'test-habit-id',
          duration: 120, // Too long
          format: 'mp3'
        })
        .expect(400)
    })
  })

  describe('POST /api/voice-recordings/:id/confirm', () => {
    it('should confirm voice recording upload', async () => {
      const response = await request(app)
        .post('/api/voice-recordings/test-recording-id/confirm')
        .send({
          fileSize: 1024000,
          transcript: 'Great job brushing your teeth!'
        })
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('voiceRecording')
      expect(response.body.voiceRecording.status).toBe('active')
    })
  })

  describe('GET /api/voice-recordings/:id', () => {
    it('should serve voice recording for authorized users', async () => {
      const response = await request(app)
        .get('/api/voice-recordings/test-recording-id')
        .expect(200)

      expect(response.headers['content-type']).toMatch(/audio/)
    })
  })
})
```

#### Component Test (`tests/components/voice-recorder.test.tsx`)

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import VoiceRecorder from '../../client/src/components/VoiceRecorder'
import * as useAuthModule from '../../client/src/hooks/useAuth'

vi.mock('../../client/src/hooks/useAuth')
const mockUseAuth = vi.mocked(useAuthModule.useAuth)

// Mock MediaRecorder API
global.MediaRecorder = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  addEventListener: vi.fn(),
  state: 'inactive',
}))

navigator.mediaDevices = {
  getUserMedia: vi.fn().mockResolvedValue({}),
} as any

describe('VoiceRecorder Component', () => {
  let queryClient: QueryClient
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    user = userEvent.setup()

    mockUseAuth.mockReturnValue({
      user: {
        id: 'premium-user-id',
        subscriptionStatus: 'active',
      },
      isAuthenticated: true,
      isLoading: false,
    })
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  describe('Premium Voice Recording Features', () => {
    it('should display record button for premium users', async () => {
      renderWithProviders(<VoiceRecorder habitId="test-habit" />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /record voice message/i })).toBeInTheDocument()
      })
    })

    it('should show upgrade prompt for free users', async () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'free-user-id',
          subscriptionStatus: 'free',
        },
        isAuthenticated: true,
        isLoading: false,
      })

      renderWithProviders(<VoiceRecorder habitId="test-habit" />)

      expect(screen.getByText(/premium feature/i)).toBeInTheDocument()
      expect(screen.getByText(/upgrade to record voice messages/i)).toBeInTheDocument()
    })

    it('should request microphone permissions before recording', async () => {
      const getUserMediaSpy = vi.spyOn(navigator.mediaDevices, 'getUserMedia')
      
      renderWithProviders(<VoiceRecorder habitId="test-habit" />)

      const recordButton = screen.getByRole('button', { name: /record voice message/i })
      await user.click(recordButton)

      expect(getUserMediaSpy).toHaveBeenCalledWith({ audio: true })
    })

    it('should start recording when record button is clicked', async () => {
      const mockMediaRecorder = {
        start: vi.fn(),
        stop: vi.fn(),
        addEventListener: vi.fn(),
        state: 'inactive',
      }
      
      global.MediaRecorder = vi.fn().mockImplementation(() => mockMediaRecorder)

      renderWithProviders(<VoiceRecorder habitId="test-habit" />)

      const recordButton = screen.getByRole('button', { name: /record voice message/i })
      await user.click(recordButton)

      expect(mockMediaRecorder.start).toHaveBeenCalled()
    })

    it('should show recording timer while recording', async () => {
      renderWithProviders(<VoiceRecorder habitId="test-habit" />)

      const recordButton = screen.getByRole('button', { name: /record voice message/i })
      await user.click(recordButton)

      await waitFor(() => {
        expect(screen.getByText(/00:01/)).toBeInTheDocument()
      })
    })

    it('should stop recording when stop button is clicked', async () => {
      const mockMediaRecorder = {
        start: vi.fn(),
        stop: vi.fn(),
        addEventListener: vi.fn(),
        state: 'recording',
      }
      
      global.MediaRecorder = vi.fn().mockImplementation(() => mockMediaRecorder)

      renderWithProviders(<VoiceRecorder habitId="test-habit" />)

      // Start recording
      const recordButton = screen.getByRole('button', { name: /record voice message/i })
      await user.click(recordButton)

      // Stop recording
      const stopButton = screen.getByRole('button', { name: /stop recording/i })
      await user.click(stopButton)

      expect(mockMediaRecorder.stop).toHaveBeenCalled()
    })

    it('should show playback controls after recording', async () => {
      renderWithProviders(<VoiceRecorder habitId="test-habit" />)

      // Simulate recording completion
      const recordButton = screen.getByRole('button', { name: /record voice message/i })
      await user.click(recordButton)

      // Simulate stop
      const stopButton = screen.getByRole('button', { name: /stop recording/i })
      await user.click(stopButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /play recording/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /save recording/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /discard recording/i })).toBeInTheDocument()
      })
    })

    it('should save recording and show success message', async () => {
      renderWithProviders(<VoiceRecorder habitId="test-habit" />)

      // Complete recording flow
      await completeRecording(user)

      const saveButton = screen.getByRole('button', { name: /save recording/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/voice message saved/i)).toBeInTheDocument()
      })
    })

    it('should enforce 60-second maximum recording time', async () => {
      vi.useFakeTimers()
      
      renderWithProviders(<VoiceRecorder habitId="test-habit" />)

      const recordButton = screen.getByRole('button', { name: /record voice message/i })
      await user.click(recordButton)

      // Fast-forward 60 seconds
      vi.advanceTimersByTime(60000)

      await waitFor(() => {
        expect(screen.getByText(/maximum recording time reached/i)).toBeInTheDocument()
      })

      vi.useRealTimers()
    })
  })

  describe('Error Handling', () => {
    it('should handle microphone permission denial', async () => {
      const getUserMediaSpy = vi.spyOn(navigator.mediaDevices, 'getUserMedia')
        .mockRejectedValue(new Error('Permission denied'))

      renderWithProviders(<VoiceRecorder habitId="test-habit" />)

      const recordButton = screen.getByRole('button', { name: /record voice message/i })
      await user.click(recordButton)

      await waitFor(() => {
        expect(screen.getByText(/microphone permission required/i)).toBeInTheDocument()
      })
    })

    it('should handle recording failures gracefully', async () => {
      const mockMediaRecorder = {
        start: vi.fn().mockImplementation(() => {
          throw new Error('Recording failed')
        }),
        addEventListener: vi.fn(),
        state: 'inactive',
      }
      
      global.MediaRecorder = vi.fn().mockImplementation(() => mockMediaRecorder)

      renderWithProviders(<VoiceRecorder habitId="test-habit" />)

      const recordButton = screen.getByRole('button', { name: /record voice message/i })
      await user.click(recordButton)

      await waitFor(() => {
        expect(screen.getByText(/recording failed/i)).toBeInTheDocument()
      })
    })
  })
})

// Helper function
async function completeRecording(user: ReturnType<typeof userEvent.setup>) {
  const recordButton = screen.getByRole('button', { name: /record voice message/i })
  await user.click(recordButton)

  const stopButton = screen.getByRole('button', { name: /stop recording/i })
  await user.click(stopButton)

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /save recording/i })).toBeInTheDocument()
  })
}
```

#### E2E Test (`tests/e2e/voice-recording.spec.ts`)

```typescript
import { test, expect } from '@playwright/test'

test.describe('Voice Recording E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock premium user authentication
    await page.route('**/api/auth/user', async route => {
      await route.fulfill({
        json: {
          id: 'premium-user-id',
          subscriptionStatus: 'active',
        }
      })
    })

    // Mock voice recording API
    await page.route('**/api/voice-recordings/upload-url', async route => {
      await route.fulfill({
        json: {
          uploadUrl: 'https://mock-storage.com/upload',
          voiceRecordingId: 'mock-recording-id'
        }
      })
    })

    await page.goto('/habit-tracker')
    await page.waitForLoadState('networkidle')
  })

  test('should complete voice recording workflow', async ({ page }) => {
    // Grant microphone permissions
    await page.context().grantPermissions(['microphone'])

    // Navigate to habit completion
    await page.click('[data-testid="complete-habit-button"]')
    
    // Open voice recorder
    await page.click('[data-testid="add-voice-message-button"]')
    
    // Verify voice recorder modal opens
    await expect(page.locator('[data-testid="voice-recorder-modal"]')).toBeVisible()
    
    // Start recording
    await page.click('[data-testid="record-voice-button"]')
    
    // Verify recording state
    await expect(page.locator('[data-testid="recording-timer"]')).toBeVisible()
    await expect(page.locator('text=Recording...')).toBeVisible()
    
    // Wait a moment then stop recording
    await page.waitForTimeout(2000)
    await page.click('[data-testid="stop-recording-button"]')
    
    // Verify playback controls appear
    await expect(page.locator('[data-testid="play-recording-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="save-recording-button"]')).toBeVisible()
    
    // Save the recording
    await page.click('[data-testid="save-recording-button"]')
    
    // Verify success message
    await expect(page.locator('text=Voice message saved!')).toBeVisible()
    
    // Verify modal closes
    await expect(page.locator('[data-testid="voice-recorder-modal"]')).not.toBeVisible()
  })

  test('should show upgrade prompt for free users', async ({ page }) => {
    // Mock free user
    await page.route('**/api/auth/user', async route => {
      await route.fulfill({
        json: {
          id: 'free-user-id',
          subscriptionStatus: 'free',
        }
      })
    })

    await page.reload()
    await page.click('[data-testid="complete-habit-button"]')
    await page.click('[data-testid="add-voice-message-button"]')

    // Should show premium upgrade prompt instead of recorder
    await expect(page.locator('text=Premium Feature')).toBeVisible()
    await expect(page.locator('text=Upgrade to Premium')).toBeVisible()
  })
})
```

#### Mobile Test (`tests/mobile/voice-recording.test.js`)

```javascript
describe('Mobile Voice Recording Tests', () => {
  beforeEach(async () => {
    await driver.reset()
    await authenticateAsPremiumUser()
  })

  it('should record voice message on mobile', async () => {
    await navigateToHabitCompletion()
    
    // Tap voice message button
    const voiceButton = await $('~add-voice-message-button')
    await voiceButton.click()
    
    // Handle platform-specific microphone permissions
    if (driver.isAndroid) {
      const allowButton = await $('id=com.android.permissioncontroller:id/permission_allow_button')
      if (await allowButton.isExisting()) {
        await allowButton.click()
      }
    } else if (driver.isIOS) {
      const okButton = await $('~OK')
      if (await okButton.isExisting()) {
        await okButton.click()
      }
    }
    
    // Start recording
    const recordButton = await $('~record-voice-button')
    await recordButton.click()
    
    // Verify recording state
    const recordingTimer = await $('~recording-timer')
    await expect(recordingTimer).toBeDisplayed()
    
    // Record for 3 seconds
    await driver.pause(3000)
    
    // Stop recording
    const stopButton = await $('~stop-recording-button')
    await stopButton.click()
    
    // Play recording to test
    const playButton = await $('~play-recording-button')
    await playButton.click()
    
    await driver.pause(1000)
    
    // Save recording
    const saveButton = await $('~save-recording-button')
    await saveButton.click()
    
    // Verify success
    const successMessage = await $('~success-message')
    await expect(successMessage).toHaveTextContaining('Voice message saved')
  })

  it('should handle voice recording with touch gestures', async () => {
    await navigateToHabitCompletion()
    
    const voiceButton = await $('~add-voice-message-button')
    await voiceButton.click()
    
    const recordButton = await $('~record-voice-button')
    
    if (driver.isAndroid) {
      // Long press to record on Android
      await driver.execute('mobile: longClickGesture', {
        elementId: recordButton.elementId,
        duration: 3000
      })
    } else if (driver.isIOS) {
      // Touch and hold on iOS
      await driver.execute('mobile: touchAndHold', {
        elementId: recordButton.elementId,
        duration: 3000
      })
    }
    
    // Should auto-stop after gesture ends
    const playButton = await $('~play-recording-button')
    await expect(playButton).toBeDisplayed()
  })
})

async function authenticateAsPremiumUser() {
  // Implementation for premium user authentication
  const emailInput = await $('~email-input')
  await emailInput.setValue('premium@example.com')
  
  const passwordInput = await $('~password-input')
  await passwordInput.setValue('premiumpass')
  
  const loginButton = await $('~login-button')
  await loginButton.click()
  
  const dashboard = await $('~dashboard')
  await dashboard.waitForExist({ timeout: 10000 })
}

async function navigateToHabitCompletion() {
  const habitCard = await $('~habit-card-0')
  await habitCard.click()
  
  const completeButton = await $('~complete-habit-button')
  await completeButton.click()
}
```

### Step 2: Run Tests - Should Fail (Red Phase)

```bash
# Run the test script
npm run test -- --all

# Expected output:
# ❌ API Tests: 0/6 passing
# ❌ Component Tests: 0/10 passing  
# ❌ E2E Tests: 0/2 passing
# ❌ Mobile Tests: 0/2 passing
```

All tests should fail since we haven't implemented the feature yet.

### Step 3: Implement Minimal Code (Green Phase)

Now we implement just enough code to make the tests pass:

1. **Backend API Implementation**
2. **Frontend Component Implementation** 
3. **Database Schema Updates**
4. **Object Storage Integration**

### Step 4: Refactor (Refactor Phase)

After tests pass, we refactor for:
- Better error handling
- Performance optimization
- Code reusability
- Type safety improvements

## Benefits of This TDD Approach

1. **Comprehensive Coverage**: Tests cover all platforms and user scenarios
2. **Premium Feature Validation**: Ensures subscription-based features work correctly
3. **Mobile-First**: Native mobile functionality is tested from the start
4. **Error Handling**: Edge cases are considered upfront
5. **Documentation**: Tests serve as living documentation of feature behavior

## Running the Example

```bash
# Run specific test suites
./scripts/run-tests.sh api
./scripts/run-tests.sh unit
./scripts/run-tests.sh e2e
./scripts/run-tests.sh mobile

# Run all tests with coverage
./scripts/run-tests.sh all --coverage

# Watch mode for development
./scripts/run-tests.sh unit --watch
```

This TDD example demonstrates how to build robust, well-tested features that work consistently across web, iOS, and Android platforms while maintaining premium feature restrictions and providing excellent user experience.