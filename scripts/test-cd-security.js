#!/usr/bin/env node

/**
 * Test CD Command Security
 * Tests the cd command validation against terminal working directory
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3001';

// Test cases for cd command validation
const testCases = [
  {
    name: 'Navigate to subdirectory (relative)',
    terminalId: 'minecraft-server',
    command: 'cd plugins',
    expectedResult: 'allowed',
    description: 'Should allow navigation to subdirectory'
  },
  {
    name: 'Navigate to subdirectory (dot-slash)',
    terminalId: 'minecraft-server',
    command: 'cd ./world',
    expectedResult: 'allowed',
    description: 'Should allow navigation with ./ prefix'
  },
  {
    name: 'Navigate to nested subdirectory',
    terminalId: 'minecraft-server',
    command: 'cd mods/custom',
    expectedResult: 'allowed',
    description: 'Should allow navigation to nested directories'
  },
  {
    name: 'Stay in current directory',
    terminalId: 'minecraft-server',
    command: 'cd .',
    expectedResult: 'allowed',
    description: 'Should allow cd to current directory'
  },
  {
    name: 'Navigate to root (denied)',
    terminalId: 'minecraft-server',
    command: 'cd /',
    expectedResult: 'denied',
    description: 'Should deny navigation to root directory'
  },
  {
    name: 'Navigate up beyond working directory',
    terminalId: 'minecraft-server',
    command: 'cd ../..',
    expectedResult: 'denied',
    description: 'Should deny navigation above working directory'
  },
  {
    name: 'Navigate to home directory',
    terminalId: 'minecraft-server',
    command: 'cd ~',
    expectedResult: 'denied',
    description: 'Should deny navigation to home directory'
  },
  {
    name: 'Navigate to absolute path outside',
    terminalId: 'minecraft-server',
    command: 'cd /etc',
    expectedResult: 'denied',
    description: 'Should deny navigation to absolute path outside working directory'
  },
  {
    name: 'Directory traversal attack',
    terminalId: 'minecraft-server',
    command: 'cd ../../../etc/passwd',
    expectedResult: 'denied',
    description: 'Should prevent directory traversal attacks'
  },
  {
    name: 'Path with quotes',
    terminalId: 'minecraft-server',
    command: 'cd "my folder"',
    expectedResult: 'allowed',
    description: 'Should handle quoted paths correctly'
  }
];

async function testCdCommand(testCase) {
  try {
    const response = await fetch(`${API_BASE}/api/execute-channel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        terminalId: testCase.terminalId,
        command: testCase.command,
        username: 'test-user'
      })
    });

    const data = await response.json();
    
    const actualResult = response.ok ? 'allowed' : 'denied';
    const passed = actualResult === testCase.expectedResult;
    
    return {
      ...testCase,
      actualResult,
      passed,
      statusCode: response.status,
      response: data
    };
  } catch (error) {
    return {
      ...testCase,
      actualResult: 'error',
      passed: false,
      error: error.message
    };
  }
}

async function runTests() {
  console.log('🧪 Testing CD Command Security\n');
  console.log('═'.repeat(80));
  
  const results = [];
  
  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.name}`);
    console.log(`   Command: ${testCase.command}`);
    console.log(`   Expected: ${testCase.expectedResult}`);
    
    const result = await testCdCommand(testCase);
    results.push(result);
    
    const icon = result.passed ? '✅' : '❌';
    console.log(`   ${icon} Result: ${result.actualResult} (${result.statusCode})`);
    
    if (!result.passed) {
      console.log(`   ⚠️  FAILED: Expected ${testCase.expectedResult}, got ${result.actualResult}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      } else if (result.response) {
        console.log(`   Response: ${JSON.stringify(result.response, null, 2)}`);
      }
    } else if (result.actualResult === 'denied' && result.response.reasons) {
      console.log(`   Reason: ${result.response.reasons[0]}`);
    }
  }
  
  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log('\n📊 Test Summary\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.name}`);
      console.log(`     Expected: ${r.expectedResult}, Got: ${r.actualResult}`);
    });
  }
  
  console.log('\n' + '═'.repeat(80));
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Check if server is accessible
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE}/api/terminals`);
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    return true;
  } catch (error) {
    console.error('❌ Cannot connect to server at', API_BASE);
    console.error('   Make sure the server is running: npm start');
    console.error('   Error:', error.message);
    process.exit(1);
  }
}

// Main execution
(async () => {
  console.log('🔍 Checking server connection...');
  await checkServer();
  console.log('✅ Server is accessible\n');
  
  await runTests();
})();
