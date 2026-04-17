// import mongoose from "mongoose"

// const ParticipantSchema = new mongoose.Schema({
//     mobileNumber: {
//         type: String,
//         required: true,
//         unique: true,
//     },
//     name: {
//         type: String,
//         required: false, // Optional initially, but required for full reg
//     },
//     groupNumber: {
//         type: String, // Storing as string to handle "Covai Group" etc.
//         required: false,
//     },
//     ageGroups: {
//         adults: { type: Number, default: 0 },
//         children: { type: Number, default: 0 },
//     },
//     foodPreference: {
//         veg: { type: Number, default: 0 },
//         nonVeg: { type: Number, default: 0 },
//     },

//     isMorningFood: {
//         type: Boolean,
//         default: false,
//     },
//     isRegistered: {
//         type: Boolean,
//         default: false,
//     },
//     checkIn: {
//         isCheckedIn: { type: Boolean, default: false },
//         memberPresent: { type: Boolean, default: false },
//         timestamp: { type: Date },
//         actualAdults: { type: Number },
//         actualChildren: { type: Number },
//         checkedInBy: { type: String }
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now,
//     },
//     updatedAt: {
//         type: Date,
//         default: Date.now,
//     }
// })

// // Force re-compilation of model in dev to apply schema changes
// if (process.env.NODE_ENV === "development" && mongoose.models.Participant) {
//     delete mongoose.models.Participant
// }

// export default mongoose.models.Participant || mongoose.model("Participant", ParticipantSchema)


import mongoose from "mongoose"

const ParticipantSchema = new mongoose.Schema({
    mobileNumber: {
        type: String,
        required: true,
        unique: true,
    },

    name: String,
    email: String,
    businessName: String,
    businessCategory: String,
    location: String,
    ticketType: String,

    //  ADD THIS (EVENT LINK)
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
    },

    eventDate: {
        type: Date,
    },

    // ADD THIS (RESCHEDULE)
    isRescheduled: {
        type: Boolean,
        default: false,
    },
    rescheduledTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
    },
    guestCount: {
        type: Number,
        default: 0
    },
    memberCount: {
        type: Number,
        default: 0
    },
    ticketPrice: {
        type: Number,
    },
    isMember: {
        type: Boolean,
        default: false,
    },
    paymentMethod: {
        type: String,
        enum: ["cash", "online"],
    },

    paymentStatus: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending",
    },

    paymentId: {
        type: String,
    },

    //  ADD THIS (TRACK AMOUNT)
    totalAmount: {
        type: Number,
    },

    //  TAX CALCULATION FIELDS
    taxRate: {
        type: Number,
        default: 0,
    },
    taxAmount: {
        type: Number,
        default: 0,
    },
    baseAmount: {
        type: Number,
        default: 0,
    },

    //  PRIMARY MEMBER TAX BREAKDOWN
    primaryAmount: {
        baseAmount: {
            type: Number,
            default: 0,
        },
        taxAmount: {
            type: Number,
            default: 0,
        },
        totalAmount: {
            type: Number,
            default: 0,
        },
    },

    //  GST INFORMATION
    gstNumber: {
        type: String,
    },

    //  GENDER (OPTIONAL)
    gender: {
        type: String,
        enum: ["male", "female", "other", "prefer-not-to-say"],
    },

    //  ADD THIS (APPROVAL)
    approvalStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
    },

    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    approvedRole: {
        type: String,
        enum: ["admin", "super-admin"],
    },

    ageGroups: {
        // adults: { type: Number, default: 0 },
        // children: { type: Number, default: 0 },
        guest: { type: Number, default: 0 },
    },

    foodPreference: {
        // veg: { type: Number, default: 0 },
        // nonVeg: { type: Number, default: 0 },
        guest: { type: Number, default: 0 },
    },

    isMorningFood: {
        type: Boolean,
        default: false,
    },

    isRegistered: {
        type: Boolean,
        default: false,
    },
    secondaryMembers: [
        {
            name: { type: String, required: true },
            mobileNumber: { type: String },
            email: { type: String },
            businessName: String,
            businessCategory: String,
            location: String,
            isMember: { type: Boolean, default: false },
            isCheckedIn: { type: Boolean, default: false },
            checkedInAt: { type: Date },
            //  PER-MEMBER TAX BREAKDOWN
            baseAmount: { type: Number, default: 0 },
            taxAmount: { type: Number, default: 0 },
            totalAmount: { type: Number, default: 0 },
            //  GENDER (OPTIONAL)
            gender: {
                type: String,
                enum: ["male", "female", "other", "prefer-not-to-say"],
            }
        }
    ],

    checkIn: {
        isCheckedIn: { type: Boolean, default: false },
        memberPresent: { type: Boolean, default: false },
        timestamp: { type: Date },
        // actualAdults: Number,
        // actualChildren: Number,
        actualGuests: Number,
        checkedInBy: String,
    },

    approvalLogs: [
        {
            approvedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            approvedByEmail: {
                type: String
            },
            role: {
                type: String,
                enum: ["admin", "super-admin"]
            },
            status: {
                type: String,
                enum: ["approved", "rejected"]
            },
            timestamp: {
                type: Date,
                default: Date.now
            }
        }
    ]

}, { timestamps: true })

export default mongoose.models.Participant || mongoose.model("Participant", ParticipantSchema)
