import mongoose from "mongoose"

const eventSchema = new mongoose.Schema({
    eventName: {
        type: String,
        required: true,
    },

    // REGISTRATION WINDOW
    registrationStart: {
        type: Date,
        required: true,
    },

    registrationEnd: {
        type: Date,
        required: true,
    },

    // EVENT SCHEDULE
    eventDate: {
        type: Date,
        required: true,
    },

    startTime: {
        type: Date,
        required: true,
    },

    endTime: {
        type: Date,
        required: true,
    },

    // VENUE
    venue: {
        name: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
    },

    maxCapacity: {
        type: Number,
        default: 100,
    },

    registeredCount: {
        type: Number,
        default: 0,
    },

    isActive: {
        type: Boolean,
        default: true,
    },

    // TICKET PRICING SYSTEM
    ticketsPrice: [
        {
            name: {
                type: String,
                required: true,
            },
            price: {
                type: Number,
                required: true,
            },
            soldCount: {
                type: Number,
                default: 0,
            },
        }
    ],

    // TAX CONFIGURATION
    taxRate: {
        type: Number,
        default: 0, // Default to 0% tax
        min: 0,
        max: 100,
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

}, { timestamps: true })

// FIX (VERY IMPORTANT)
if (mongoose.models.Event) {
    delete mongoose.models.Event
}

export default mongoose.model("Event", eventSchema)