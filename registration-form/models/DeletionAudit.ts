import mongoose from "mongoose"

const DeletionAuditSchema = new mongoose.Schema({
    // Deleted participant information (backup)
    deletedParticipant: {
        name: { type: String, required: true },
        email: { type: String },
        mobileNumber: { type: String, required: true },
        businessName: { type: String },
        businessCategory: { type: String },
        location: { type: String },
        ticketType: { type: String },
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
        paymentMethod: { type: String },
        paymentStatus: { type: String },
        approvalStatus: { type: String },
        gender: { type: String },
        memberCount: { type: Number },
        guestCount: { type: Number },
        totalAmount: { type: Number },
        registrationLanguage: { type: String },
        // Store the full participant data as backup
        participantData: { type: mongoose.Schema.Types.Mixed }
    },

    // Deletion information
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    deletedByEmail: {
        type: String,
        required: true
    },
    deletedByRole: {
        type: String,
        enum: ["admin", "super-admin"],
        required: true
    },
    deletedAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    deletionReason: {
        type: String,
        default: "Admin deletion"
    },
    participantId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    }
}, { timestamps: true })

// Force re-compilation of model in dev to apply schema changes
if (process.env.NODE_ENV === "development" && mongoose.models.DeletionAudit) {
    delete mongoose.models.DeletionAudit
}

export default mongoose.models.DeletionAudit || mongoose.model("DeletionAudit", DeletionAuditSchema)
