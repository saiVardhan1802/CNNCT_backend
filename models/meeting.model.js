const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Types = mongoose.Types;

const meetingSchema = new Schema({
    eventTopic: { type: String, required: true },
    password: String,
    hostId: { type: Types.ObjectId, ref: 'User', required: true },
    hostName: {type: String, required: true},
    description: String,
    dateTime: { type: Date, required: true },
    timezone: { type: String, required: true},
    duration: { type: Number, required: true }, // minutes
    link: String,
    backgroundColor: String,
    inviteeEmails: [String],
    invitations: [
        {
            email: { type: String, required: true },
            name: { type: String, required: true},
            status: {
                type: String,
                enum: ["accepted", "rejected", "pending"],
                default: "pending"
            },
            active: {
                type: Boolean,
                default: true,
            }
        }
    ],
    hostActive: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model("Meeting", meetingSchema);
