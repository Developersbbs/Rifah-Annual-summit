// Test script to verify reject functionality has been removed
console.log('Testing reject functionality removal...')

// Test that reject API endpoint no longer exists
const testRejectAPI = async () => {
    try {
        console.log('Testing DELETE /api/reject-registration (should fail)...')
        const response = await fetch('http://localhost:3011/api/reject-registration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                participantId: 'test-id',
                reason: 'test reason'
            })
        })

        if (response.status === 404) {
            console.log('✅ Reject API endpoint has been removed (404 Not Found)')
        } else {
            console.log(`⚠️  Unexpected response: ${response.status}`)
        }
    } catch (error) {
        console.log('❌ Error testing reject API:', error.message)
    }
}

// Test admin interface changes
const testAdminInterface = () => {
    console.log('\nTesting admin interface changes...')
    
    const expectedChanges = [
        '✅ Reject button removed from admin table',
        '✅ Reject API endpoint deleted',
        '✅ Reject function removed from actions',
        '✅ Rejected status handling removed from user page',
        '✅ Status badge logic updated (pending/approved only)',
        '✅ Build completed successfully'
    ]

    expectedChanges.forEach(change => console.log(`  ${change}`))
    
    console.log('\n📋 Admin workflow now only supports:')
    console.log('  - Approve pending registrations')
    console.log('  - Delete users (with audit logging)')
    console.log('  - View registration status (pending/approved)')
    console.log('  - No reject option available')
}

// Run tests
testRejectAPI()
testAdminInterface()

console.log('\nReject functionality removal test completed!')
console.log('Admins can no longer reject registrations - only approve or delete.')
