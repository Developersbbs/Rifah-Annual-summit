// Simple test script to verify delete API endpoint
// This can be run with: node test-delete-functionality.js

const testDeleteAPI = async () => {
    console.log('Testing delete API endpoint...')
    
    try {
        // First, let's check if the API endpoint exists by making a simple request
        const response = await fetch('http://localhost:3011/api/admin/delete-user', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                participantId: 'test-id',
                confirmName: 'test-name'
            })
        })

        if (response.status === 401) {
            console.log('✅ API endpoint exists and requires authentication (401 Unauthorized)')
        } else if (response.status === 404) {
            console.log('❌ API endpoint not found (404)')
        } else {
            console.log(`✅ API endpoint responded with status: ${response.status}`)
            const data = await response.json()
            console.log('Response:', data)
        }
    } catch (error) {
        console.log('❌ Error testing API:', error.message)
    }
}

// Run the test
testDeleteAPI()
