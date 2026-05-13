import mongoose from "mongoose"

const SpeakerVolunteerSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            enum: ["speaker", "volunteer"],
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
        },
        mobileNumber: {
            type: String,
        },
        organization: {
            type: String,
        },
        designation: {
            type: String,
        },
        topic: {
            type: String,
        },
        bio: {
            type: String,
        },
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
        },
    },
    { timestamps: true }
)

if (process.env.NODE_ENV === "development" && mongoose.models.SpeakerVolunteer) {
    delete mongoose.models.SpeakerVolunteer
}

export default mongoose.models.SpeakerVolunteer ||
    mongoose.model("SpeakerVolunteer", SpeakerVolunteerSchema)
