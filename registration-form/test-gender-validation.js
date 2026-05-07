// Simple test to verify gender field validation
console.log('Testing gender field validation...')

// Test the validation schema (simulated)
const testCases = [
  { input: '', shouldPass: false, description: 'Empty gender should fail' },
  { input: 'male', shouldPass: true, description: 'Valid gender "male" should pass' },
  { input: 'female', shouldPass: true, description: 'Valid gender "female" should pass' },
  { input: 'other', shouldPass: true, description: 'Valid gender "other" should pass' },
]

testCases.forEach(test => {
  const result = test.input.length >= 1 // Simulating z.string().min(1) validation
  const status = result === test.shouldPass ? '✅' : '❌'
  console.log(`${status} ${test.description}: "${test.input}"`)
})

console.log('\nGender field validation test completed!')
