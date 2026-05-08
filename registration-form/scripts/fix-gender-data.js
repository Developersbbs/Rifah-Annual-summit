const mongoose = require('mongoose');
const Participant = require('../models/Participant');

async function fixGenderData() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rifah-summit');
        console.log('Connected to database');

        // Find all participants without gender data
        const participantsWithoutGender = await Participant.find({ 
            $or: [
                { gender: { $exists: false } },
                { gender: null },
                { gender: '' }
            ]
        });

        console.log(`Found ${participantsWithoutGender.length} participants without gender data`);

        // Update participants without gender data
        for (const participant of participantsWithoutGender) {
            // Set a default gender value - you can modify this logic
            await Participant.findByIdAndUpdate(participant._id, { 
                gender: 'prefer-not-to-say' 
            });
            console.log(`Updated participant ${participant.name} with gender data`);
        }

        console.log('Gender data migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing gender data:', error);
        process.exit(1);
    }
}

fixGenderData();
