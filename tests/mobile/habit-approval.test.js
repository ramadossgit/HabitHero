describe('Mobile Habit Approval Tests', () => {
  beforeEach(async () => {
    // Reset app state before each test
    await driver.reset()
    
    // Wait for app to load
    await driver.pause(3000)
    
    // Handle platform-specific authentication
    if (driver.isAndroid) {
      await authenticateAndroid()
    } else if (driver.isIOS) {
      await authenticateIOS()
    }
  })

  describe('Auto-Approval Settings - Mobile', () => {
    it('should navigate to habit approval section', async () => {
      // Navigate to parent dashboard
      const parentButton = await $('~parent-dashboard-tab')
      await parentButton.waitForExist({ timeout: 10000 })
      await parentButton.click()
      
      // Navigate to habit approval
      const habitApprovalButton = await $('~habit-approval-button')
      await habitApprovalButton.waitForExist({ timeout: 5000 })
      await habitApprovalButton.click()
      
      // Verify we're on the habit approval screen
      const habitApprovalTitle = await $('~habit-approval-title')
      await expect(habitApprovalTitle).toBeDisplayed()
    })

    it('should open auto-approval settings modal on mobile', async () => {
      await navigateToHabitApproval()
      
      // Look for configure button (may be in overflow menu on mobile)
      let configureButton = await $('~configure-auto-approval-button')
      
      if (!(await configureButton.isExisting())) {
        // Check overflow menu
        const menuButton = await $('~overflow-menu-button')
        await menuButton.click()
        configureButton = await $('~configure-auto-approval-button')
      }
      
      await configureButton.click()
      
      // Verify settings modal opens
      const timeValueSelector = await $('~time-value-selector')
      await expect(timeValueSelector).toBeDisplayed()
      
      const timeUnitSelector = await $('~time-unit-selector')
      await expect(timeUnitSelector).toBeDisplayed()
    })

    it('should handle time value selection on mobile', async () => {
      await navigateToAutoApprovalSettings()
      
      // Tap time value selector
      const timeValueSelector = await $('~time-value-selector')
      await timeValueSelector.click()
      
      if (driver.isAndroid) {
        // Android: Handle dropdown/picker
        const value12Option = await $('android=new UiSelector().text("12")')
        await value12Option.click()
      } else if (driver.isIOS) {
        // iOS: Handle picker wheel
        await driver.execute('mobile: selectPickerWheelValue', {
          element: await $('~time-value-picker').elementId,
          value: '12'
        })
      }
      
      // Verify selection
      const selectedValue = await timeValueSelector.getText()
      expect(selectedValue).toContain('12')
    })

    it('should handle time unit selection on mobile', async () => {
      await navigateToAutoApprovalSettings()
      
      const timeUnitSelector = await $('~time-unit-selector')
      await timeUnitSelector.click()
      
      if (driver.isAndroid) {
        const daysOption = await $('android=new UiSelector().text("days")')
        await daysOption.click()
      } else if (driver.isIOS) {
        await driver.execute('mobile: selectPickerWheelValue', {
          element: await $('~time-unit-picker').elementId,
          value: 'days'
        })
      }
      
      const selectedUnit = await timeUnitSelector.getText()
      expect(selectedUnit).toContain('days')
    })

    it('should save settings and close modal', async () => {
      await navigateToAutoApprovalSettings()
      
      // Make some changes
      await selectTimeValue('6')
      await selectTimeUnit('hours')
      
      // Save settings
      const saveButton = await $('~save-settings-button')
      await saveButton.click()
      
      // Verify modal closes
      const timeValueSelector = await $('~time-value-selector')
      await expect(timeValueSelector).not.toBeDisplayed()
      
      // Verify success message
      const successMessage = await $('~success-message')
      await expect(successMessage).toBeDisplayed()
      await expect(successMessage).toHaveTextContaining('Settings Updated')
    })
  })

  describe('Child Selection - Mobile', () => {
    it('should display children list on mobile', async () => {
      await navigateToHabitApproval()
      
      // Verify children are displayed
      const child1 = await $('~select-child-child-1')
      const child2 = await $('~select-child-child-2')
      
      await expect(child1).toBeDisplayed()
      await expect(child2).toBeDisplayed()
      
      // Check pending counts are visible
      const pendingBadge = await $('~pending-count-badge')
      await expect(pendingBadge).toBeDisplayed()
    })

    it('should select child and show pending habits', async () => {
      await navigateToHabitApproval()
      
      const child1Button = await $('~select-child-child-1')
      await child1Button.click()
      
      // Verify child is selected (visual feedback)
      const selectedBorder = await child1Button.getAttribute('selected')
      expect(selectedBorder).toBe('true')
      
      // Wait for pending habits to load
      const pendingHabitsSection = await $('~pending-habits-section')
      await pendingHabitsSection.waitForExist({ timeout: 5000 })
      await expect(pendingHabitsSection).toBeDisplayed()
    })
  })

  describe('Habit Actions - Mobile', () => {
    beforeEach(async () => {
      await navigateToHabitApproval()
      const child1Button = await $('~select-child-child-1')
      await child1Button.click()
      
      // Wait for habits to load
      await driver.pause(2000)
    })

    it('should approve habit with swipe gesture', async () => {
      const habitCard = await $('~habit-card-0')
      await habitCard.waitForExist({ timeout: 5000 })
      
      if (driver.isAndroid) {
        // Android swipe to approve
        await driver.execute('mobile: swipeGesture', {
          elementId: habitCard.elementId,
          direction: 'right',
          percent: 0.75
        })
      } else if (driver.isIOS) {
        // iOS swipe to approve
        const location = await habitCard.getLocation()
        const size = await habitCard.getSize()
        
        await driver.touchAction([
          { action: 'press', x: location.x, y: location.y + size.height / 2 },
          { action: 'moveTo', x: location.x + size.width * 0.8, y: location.y + size.height / 2 },
          { action: 'release' }
        ])
      }
      
      // Verify approval confirmation
      const approveConfirmButton = await $('~confirm-approve-button')
      await approveConfirmButton.click()
      
      // Check success message
      const successMessage = await $('~success-message')
      await expect(successMessage).toHaveTextContaining('Habit Approved')
    })

    it('should reject habit with feedback modal', async () => {
      const habitCard = await $('~habit-card-0')
      
      // Long press or swipe left to reject
      if (driver.isAndroid) {
        await driver.execute('mobile: longClickGesture', {
          elementId: habitCard.elementId
        })
        
        const rejectOption = await $('android=new UiSelector().text("Reject")')
        await rejectOption.click()
      } else if (driver.isIOS) {
        // iOS swipe left to reject
        const location = await habitCard.getLocation()
        const size = await habitCard.getSize()
        
        await driver.touchAction([
          { action: 'press', x: location.x + size.width, y: location.y + size.height / 2 },
          { action: 'moveTo', x: location.x + size.width * 0.2, y: location.y + size.height / 2 },
          { action: 'release' }
        ])
        
        const rejectButton = await $('~reject-habit-button')
        await rejectButton.click()
      }
      
      // Enter feedback
      const feedbackInput = await $('~feedback-input')
      await feedbackInput.setValue('Please try again with more effort')
      
      // Submit feedback
      const submitButton = await $('~submit-feedback-button')
      await submitButton.click()
      
      // Verify success
      const successMessage = await $('~success-message')
      await expect(successMessage).toHaveTextContaining('Feedback Sent')
    })
  })

  describe('Responsive Design - Mobile', () => {
    it('should handle portrait orientation', async () => {
      await driver.orientation('PORTRAIT')
      await navigateToHabitApproval()
      
      // Verify all elements are visible and accessible
      const configureButton = await $('~configure-auto-approval-button')
      await expect(configureButton).toBeDisplayed()
      
      const childrenList = await $('~children-list')
      await expect(childrenList).toBeDisplayed()
    })

    it('should handle landscape orientation', async () => {
      await driver.orientation('LANDSCAPE')
      await navigateToHabitApproval()
      
      // Verify layout adapts to landscape
      const configureButton = await $('~configure-auto-approval-button')
      await expect(configureButton).toBeDisplayed()
      
      // Check if layout switches to side-by-side on larger screens
      const childrenSection = await $('~children-section')
      const habitsSection = await $('~habits-section')
      
      await expect(childrenSection).toBeDisplayed()
      await expect(habitsSection).toBeDisplayed()
    })
  })

  describe('Offline Functionality', () => {
    it('should handle network disconnection gracefully', async () => {
      // Simulate network disconnection
      await driver.toggleData()
      
      await navigateToHabitApproval()
      
      // Verify offline state is handled
      const offlineMessage = await $('~offline-message')
      await expect(offlineMessage).toBeDisplayed()
      
      // Reconnect network
      await driver.toggleData()
      
      // Verify app recovers
      await driver.pause(3000)
      const configureButton = await $('~configure-auto-approval-button')
      await expect(configureButton).toBeDisplayed()
    })

    it('should queue actions for when connection returns', async () => {
      await navigateToHabitApproval()
      
      // Select child
      const child1Button = await $('~select-child-child-1')
      await child1Button.click()
      
      // Disconnect network
      await driver.toggleData()
      
      // Try to approve habit (should queue)
      const habitCard = await $('~habit-card-0')
      const approveButton = await habitCard.$('~approve-button')
      await approveButton.click()
      
      // Should show queued state
      const queuedMessage = await $('~action-queued-message')
      await expect(queuedMessage).toBeDisplayed()
      
      // Reconnect network
      await driver.toggleData()
      
      // Verify action is processed
      await driver.pause(5000)
      const successMessage = await $('~success-message')
      await expect(successMessage).toHaveTextContaining('Habit Approved')
    })
  })
})

// Helper functions
async function authenticateAndroid() {
  const emailInput = await $('~email-input')
  await emailInput.setValue('test@example.com')
  
  const passwordInput = await $('~password-input')
  await passwordInput.setValue('testpassword')
  
  const loginButton = await $('~login-button')
  await loginButton.click()
  
  // Wait for dashboard
  const dashboard = await $('~parent-dashboard')
  await dashboard.waitForExist({ timeout: 10000 })
}

async function authenticateIOS() {
  const emailInput = await $('~email-input')
  await emailInput.setValue('test@example.com')
  
  const passwordInput = await $('~password-input')
  await passwordInput.setValue('testpassword')
  
  const loginButton = await $('~login-button')
  await loginButton.click()
  
  // Wait for dashboard
  const dashboard = await $('~parent-dashboard')
  await dashboard.waitForExist({ timeout: 10000 })
}

async function navigateToHabitApproval() {
  const parentButton = await $('~parent-dashboard-tab')
  await parentButton.click()
  
  const habitApprovalButton = await $('~habit-approval-button')
  await habitApprovalButton.click()
  
  // Wait for page load
  await driver.pause(2000)
}

async function navigateToAutoApprovalSettings() {
  await navigateToHabitApproval()
  
  let configureButton = await $('~configure-auto-approval-button')
  
  if (!(await configureButton.isExisting())) {
    const menuButton = await $('~overflow-menu-button')
    await menuButton.click()
    configureButton = await $('~configure-auto-approval-button')
  }
  
  await configureButton.click()
  
  // Wait for modal to open
  await driver.pause(1000)
}

async function selectTimeValue(value) {
  const timeValueSelector = await $('~time-value-selector')
  await timeValueSelector.click()
  
  if (driver.isAndroid) {
    const valueOption = await $(`android=new UiSelector().text("${value}")`)
    await valueOption.click()
  } else if (driver.isIOS) {
    await driver.execute('mobile: selectPickerWheelValue', {
      element: await $('~time-value-picker').elementId,
      value: value
    })
  }
}

async function selectTimeUnit(unit) {
  const timeUnitSelector = await $('~time-unit-selector')
  await timeUnitSelector.click()
  
  if (driver.isAndroid) {
    const unitOption = await $(`android=new UiSelector().text("${unit}")`)
    await unitOption.click()
  } else if (driver.isIOS) {
    await driver.execute('mobile: selectPickerWheelValue', {
      element: await $('~time-unit-picker').elementId,
      value: unit
    })
  }
}