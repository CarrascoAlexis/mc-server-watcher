#!/usr/bin/env node

/**
 * Test script for Tmux Channel Execution API
 * This script tests all the new endpoints and functionality
 */

const axios = require('axios');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const TOKEN = process.env.ADMIN_TOKEN || '';

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

/**
 * Print colored message
 */
function print(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Test function wrapper
 */
async function test(name, testFn) {
  print(`\n→ Testing: ${name}`, 'blue');
  try {
    await testFn();
    results.passed++;
    results.tests.push({ name, status: 'PASSED' });
    print(`✓ PASSED: ${name}`, 'green');
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAILED', error: error.message });
    print(`✗ FAILED: ${name}`, 'red');
    print(`  Error: ${error.message}`, 'red');
  }
}

/**
 * Test API connection
 */
async function testConnection() {
  const response = await axios.get(`${API_URL}/api/verify`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  
  if (!response.data.valid) {
    throw new Error('Token validation failed');
  }
}

/**
 * Test single channel execution
 */
async function testSingleChannel() {
  const response = await axios.post(`${API_URL}/api/execute-channel`, {
    terminalId: 'test-terminal',
    command: 'echo "Test command"'
  }, {
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  
  // Note: This might fail if test-terminal doesn't exist, which is expected
  // In a real test, you'd use an existing terminal ID from your config
  if (!response.data) {
    throw new Error('No response data received');
  }
}

/**
 * Test multiple channels execution
 */
async function testMultipleChannels() {
  const response = await axios.post(`${API_URL}/api/execute-multiple-channels`, {
    terminalIds: ['terminal1', 'terminal2'],
    command: 'echo "Batch test"'
  }, {
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!Array.isArray(response.data)) {
    throw new Error('Response should be an array');
  }
}

/**
 * Test all channels execution
 */
async function testAllChannels() {
  const response = await axios.post(`${API_URL}/api/execute-all-channels`, {
    command: 'date'
  }, {
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!Array.isArray(response.data)) {
    throw new Error('Response should be an array');
  }
}

/**
 * Test authentication requirement
 */
async function testAuthRequired() {
  try {
    await axios.post(`${API_URL}/api/execute-channel`, {
      terminalId: 'test',
      command: 'test'
    });
    throw new Error('Should have required authentication');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      // Expected behavior
      return;
    }
    throw error;
  }
}

/**
 * Test invalid terminal ID
 */
async function testInvalidTerminalId() {
  try {
    const response = await axios.post(`${API_URL}/api/execute-channel`, {
      terminalId: 'nonexistent-terminal-id-12345',
      command: 'test'
    }, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      validateStatus: () => true // Accept any status code
    });
    
    if (response.status === 200) {
      // Check if response indicates terminal not found
      if (response.data.error && response.data.error.includes('not found')) {
        return; // Expected behavior
      }
      throw new Error('Should have failed with nonexistent terminal');
    }
  } catch (error) {
    // Expected to fail
    if (error.response && error.response.data && error.response.data.error) {
      return; // Expected behavior
    }
    throw error;
  }
}

/**
 * Test missing parameters
 */
async function testMissingParameters() {
  try {
    await axios.post(`${API_URL}/api/execute-channel`, {
      terminalId: 'test'
      // Missing command parameter
    }, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    throw new Error('Should have required command parameter');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      return; // Expected behavior
    }
    throw error;
  }
}

/**
 * Test custom config path
 */
async function testCustomConfigPath() {
  const response = await axios.post(`${API_URL}/api/execute-channel`, {
    terminalId: 'test',
    command: 'echo "Test"',
    configPath: '/custom/path/to/terminals.json'
  }, {
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    validateStatus: () => true
  });
  
  // Should accept the configPath parameter (might fail if file doesn't exist)
  if (!response.data) {
    throw new Error('No response data');
  }
}

/**
 * Print test summary
 */
function printSummary() {
  print('\n' + '='.repeat(60), 'blue');
  print('TEST SUMMARY', 'blue');
  print('='.repeat(60), 'blue');
  
  print(`\nTotal Tests: ${results.passed + results.failed}`);
  print(`Passed: ${results.passed}`, 'green');
  print(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  
  if (results.tests.length > 0) {
    print('\nDetailed Results:', 'yellow');
    results.tests.forEach(test => {
      const symbol = test.status === 'PASSED' ? '✓' : '✗';
      const color = test.status === 'PASSED' ? 'green' : 'red';
      print(`  ${symbol} ${test.name}`, color);
      if (test.error) {
        print(`    → ${test.error}`, 'red');
      }
    });
  }
  
  print('\n' + '='.repeat(60), 'blue');
  
  if (results.failed > 0) {
    print('\n⚠️  Some tests failed. Review the errors above.', 'yellow');
    process.exit(1);
  } else {
    print('\n✓ All tests passed!', 'green');
    process.exit(0);
  }
}

/**
 * Main test runner
 */
async function main() {
  print('╔═══════════════════════════════════════════════════════════════╗', 'blue');
  print('║     Tmux Channel Execution API - Test Suite                  ║', 'blue');
  print('╚═══════════════════════════════════════════════════════════════╝', 'blue');
  
  // Check prerequisites
  if (!TOKEN) {
    print('\n❌ Error: ADMIN_TOKEN environment variable not set!', 'red');
    print('Set it with: export ADMIN_TOKEN="your-jwt-token"', 'yellow');
    process.exit(1);
  }
  
  print(`\nAPI URL: ${API_URL}`, 'yellow');
  print(`Token: ${TOKEN.substring(0, 10)}...`, 'yellow');
  
  // Run tests
  print('\n' + '='.repeat(60), 'blue');
  print('Running Tests...', 'blue');
  print('='.repeat(60), 'blue');
  
  await test('API Connection', testConnection);
  await test('Authentication Required', testAuthRequired);
  await test('Missing Parameters', testMissingParameters);
  await test('Invalid Terminal ID', testInvalidTerminalId);
  await test('Single Channel Execution', testSingleChannel);
  await test('Multiple Channels Execution', testMultipleChannels);
  await test('All Channels Execution', testAllChannels);
  await test('Custom Config Path', testCustomConfigPath);
  
  // Print summary
  printSummary();
}

// Run tests
main().catch(error => {
  print(`\n❌ Fatal error: ${error.message}`, 'red');
  if (error.response) {
    print(`Status: ${error.response.status}`, 'red');
    print(`Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
  }
  process.exit(1);
});
