export const config = {
  runner: 'local',
  maxInstances: 1,
  
  baseUrl: 'http://localhost:5000',
  
  specs: [
    './tests/mobile/**/*.test.js'
  ],
  
  exclude: [],
  
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
  }
}