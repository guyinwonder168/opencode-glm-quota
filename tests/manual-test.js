#!/usr/bin/env node

/**
 * Quick test script for Slice 1: Credential Discovery
 *
 * This script tests the core credential discovery functions
 * without requiring full OpenCode integration.
 */

import { getProviderPlatform, getCredentials, createCredentialError } from '../dist/index.js'

console.log('=== Slice 1: Credential Discovery Test ===\n')

// Test 1: Platform Detection
console.log('Test 1: Platform Detection')
console.log('─'.repeat(50))

const testCases = [
  { input: 'zai-coding-plan', expected: 'ZAI' },
  { input: 'zai', expected: 'ZAI' },
  { input: 'zhipu', expected: 'ZHIPU' },
  { input: 'unknown', expected: null }
]

testCases.forEach(({ input, expected }) => {
  const result = getProviderPlatform(input)
  const status = result === expected ? '✅ PASS' : '❌ FAIL'
  console.log(`${status}: getProviderPlatform('${input}') → ${result} (expected: ${expected})`)
})

// Test 2: Credential Discovery (Environment Variables)
console.log('\nTest 2: Credential Discovery (Environment Variables)')
console.log('─'.repeat(50))

if (process.env.ZAI_API_KEY) {
  const result = await getCredentials()
  console.log(`✅ ZAI_API_KEY found: ${result?.token.substring(0, 10)}...`)
  console.log(`   Platform: ${result?.platform}`)
} else if (process.env.ZHIPU_API_KEY || process.env.ZHIPUAI_API_KEY) {
  const result = await getCredentials()
  console.log(`✅ ZHIPU_API_KEY found: ${result?.token.substring(0, 10)}...`)
  console.log(`   Platform: ${result?.platform}`)
} else {
  const result = await getCredentials()
  console.log(`❌ No credentials found: ${result}`)
}

// Test 3: Error Message
console.log('\nTest 3: Error Message')
console.log('─'.repeat(50))
const errorMessage = createCredentialError()
console.log(errorMessage)
console.log('\n✅ Error message generated successfully')

// Test 4: Plugin Integration
console.log('\nTest 4: Plugin Integration')
console.log('─'.repeat(50))
try {
  const credentials = await getCredentials()
  if (credentials) {
    console.log(`✅ Credentials found for ${credentials.platform} platform`)
    console.log(`   Feature coming soon: quota limits, model usage, and MCP tool usage statistics.`)
  } else {
    console.log('❌ No credentials available')
    console.log('   This is expected if no ZAI_API_KEY or ZHIPU_API_KEY is set.')
  }
} catch (error) {
  console.log(`❌ Error: ${error.message}`)
}

console.log('\n=== Test Complete ===')
console.log('\nTo test with actual credentials:')
console.log('  export ZAI_API_KEY="your-token-here"')
console.log('  node tests/manual-test.js')
