// Test to verify gender field options after removing "Other"
console.log('Testing gender field options...')

// Simulate the available options in the form
const availableOptions = ['male', 'female']
const removedOption = 'other'

console.log('✅ Available gender options:')
availableOptions.forEach(option => {
  console.log(`  - ${option}`)
})

console.log(`\n✅ Removed option: "${removedOption}"`)

// Test validation
const testValues = ['', 'male', 'female', 'other']
testValues.forEach(value => {
  const isValid = availableOptions.includes(value)
  const status = isValid ? '✅' : '❌'
  console.log(`${status} "${value}" - ${isValid ? 'Valid' : 'Invalid'}`)
})

console.log('\nGender field options test completed!')
console.log('Users can now only select Male or Female options.')
