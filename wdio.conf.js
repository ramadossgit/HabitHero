import { config as baseConfig } from './wdio.shared.conf.js'

export const config = {
  ...baseConfig,
  
  // Test runner services
  services: [
    ['appium', {
      command: 'appium',
      args: {
        relaxedSecurity: true,
        allowInsecure: ['chromedriver_autodownload']
      }
    }]
  ],

  // Test capabilities for different platforms
  capabilities: [{
    // Android capabilities
    platformName: 'Android',
    'appium:deviceName': 'Android Emulator',
    'appium:platformVersion': '11.0',
    'appium:automationName': 'UiAutomator2',
    'appium:app': './HabitHeroesMobile/android/app/build/outputs/apk/release/app-release.apk',
    'appium:autoGrantPermissions': true,
  }, {
    // iOS capabilities  
    platformName: 'iOS',
    'appium:deviceName': 'iPhone 13',
    'appium:platformVersion': '15.0',
    'appium:automationName': 'XCUITest',
    'appium:app': './HabitHeroesMobile/ios/build/Build/Products/Release-iphonesimulator/HabitHeroes.app',
    'appium:autoAcceptAlerts': true,
  }],

  // Test configuration
  specs: [
    './tests/mobile/**/*.test.js'
  ],

  logLevel: 'info',
  bail: 0,
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  framework: 'mocha',
  reporters: ['spec'],

  mochaOpts: {
    ui: 'bdd',
    timeout: 60000
  },

  // Hooks
  before: function (capabilities, specs) {
    console.log('Starting mobile tests for:', capabilities.platformName)
  },

  beforeTest: function (test, context) {
    console.log('Running test:', test.title)
  }
}