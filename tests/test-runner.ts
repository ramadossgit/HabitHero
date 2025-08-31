#!/usr/bin/env node
import { execSync } from 'child_process'
import chalk from 'chalk'

interface TestConfig {
  api: boolean
  unit: boolean
  e2e: boolean
  mobile: boolean
  platform?: 'android' | 'ios' | 'both'
  watch: boolean
  coverage: boolean
}

class TestRunner {
  private config: TestConfig

  constructor(config: TestConfig) {
    this.config = config
  }

  async run() {
    console.log(chalk.blue('🧪 HabitHero Test Suite Runner'))
    console.log(chalk.gray('=================================\n'))

    try {
      if (this.config.api) {
        await this.runApiTests()
      }

      if (this.config.unit) {
        await this.runUnitTests()
      }

      if (this.config.e2e) {
        await this.runE2ETests()
      }

      if (this.config.mobile) {
        await this.runMobileTests()
      }

      console.log(chalk.green('\n✅ All tests completed successfully!'))
    } catch (error) {
      console.error(chalk.red('\n❌ Test suite failed:'), error)
      process.exit(1)
    }
  }

  private async runApiTests() {
    console.log(chalk.yellow('📡 Running API Tests...'))
    const watchFlag = this.config.watch ? '--watch' : ''
    const coverageFlag = this.config.coverage ? '--coverage' : ''
    
    execSync(`npx vitest run tests/api ${watchFlag} ${coverageFlag}`, { 
      stdio: 'inherit' 
    })
    console.log(chalk.green('✅ API tests passed\n'))
  }

  private async runUnitTests() {
    console.log(chalk.yellow('🔧 Running Unit/Component Tests...'))
    const watchFlag = this.config.watch ? '--watch' : ''
    const coverageFlag = this.config.coverage ? '--coverage' : ''
    
    execSync(`npx vitest run tests/components ${watchFlag} ${coverageFlag}`, { 
      stdio: 'inherit' 
    })
    console.log(chalk.green('✅ Unit tests passed\n'))
  }

  private async runE2ETests() {
    console.log(chalk.yellow('🌐 Running E2E Tests...'))
    
    // Start development server if not running
    console.log(chalk.gray('Starting development server...'))
    
    execSync('npx playwright test', { stdio: 'inherit' })
    console.log(chalk.green('✅ E2E tests passed\n'))
  }

  private async runMobileTests() {
    console.log(chalk.yellow('📱 Running Mobile Tests...'))
    
    if (this.config.platform === 'android' || this.config.platform === 'both') {
      await this.runAndroidTests()
    }
    
    if (this.config.platform === 'ios' || this.config.platform === 'both') {
      await this.runIOSTests()
    }
    
    console.log(chalk.green('✅ Mobile tests passed\n'))
  }

  private async runAndroidTests() {
    console.log(chalk.cyan('🤖 Running Android Tests...'))
    
    // Check if Android emulator is running
    try {
      execSync('adb devices', { stdio: 'pipe' })
    } catch {
      console.log(chalk.yellow('⚠️  Starting Android emulator...'))
      execSync('npx @appium/doctor --android', { stdio: 'inherit' })
    }
    
    execSync('npx wdio wdio.conf.js --spec=tests/mobile/habit-approval.test.js --grep="Android"', { 
      stdio: 'inherit' 
    })
  }

  private async runIOSTests() {
    console.log(chalk.cyan('🍎 Running iOS Tests...'))
    
    // Check iOS simulator availability (macOS only)
    if (process.platform === 'darwin') {
      execSync('npx wdio wdio.conf.js --spec=tests/mobile/habit-approval.test.js --grep="iOS"', { 
        stdio: 'inherit' 
      })
    } else {
      console.log(chalk.yellow('⚠️  iOS tests skipped (requires macOS)'))
    }
  }
}

// CLI interface
const args = process.argv.slice(2)
const config: TestConfig = {
  api: args.includes('--api') || args.includes('--all'),
  unit: args.includes('--unit') || args.includes('--all'),
  e2e: args.includes('--e2e') || args.includes('--all'),
  mobile: args.includes('--mobile') || args.includes('--all'),
  platform: args.includes('--android') ? 'android' : args.includes('--ios') ? 'ios' : 'both',
  watch: args.includes('--watch'),
  coverage: args.includes('--coverage'),
}

if (args.length === 0) {
  console.log(chalk.blue('HabitHero Test Runner'))
  console.log(chalk.gray('Usage: npm run test [options]'))
  console.log('')
  console.log('Options:')
  console.log('  --api      Run API tests')
  console.log('  --unit     Run unit/component tests')
  console.log('  --e2e      Run end-to-end tests')
  console.log('  --mobile   Run mobile tests')
  console.log('  --android  Run Android tests only')
  console.log('  --ios      Run iOS tests only')
  console.log('  --all      Run all tests')
  console.log('  --watch    Run tests in watch mode')
  console.log('  --coverage Generate coverage report')
  console.log('')
  console.log('Examples:')
  console.log('  npm run test -- --api --unit')
  console.log('  npm run test -- --all --coverage')
  console.log('  npm run test -- --mobile --android')
  process.exit(0)
}

const runner = new TestRunner(config)
runner.run()