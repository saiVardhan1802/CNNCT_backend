const express = require('express');
const router = express.Router();
const moment = require('moment-timezone');
const jwt = require('jsonwebtoken');
const meetingModel = require("../models/meeting.model");
const User = require('../models/user.model');
const { authMiddleware } = require("../middleware/authMiddleware");
const userModel = require('../models/user.model');
const { set, default: mongoose } = require('mongoose');

router.post('/', authMiddleware, async (req, res, next) => {
    try {
        const { eventTopic, 
            password, 
            hostUsername, 
            description, 
            dateAndTime, 
            timezone,
            duration, 
            backgroundColor, 
            addLink, 
            addEmails  } = req.body;
            console.log("response: ", req.body);
            console.log('adduserEmails: ', addEmails);

        const { date, time, ampm } = dateAndTime;
        const combinedDateTime = `${date} ${time} ${ampm}`;
        const userEmailsArray = typeof addEmails === "string"
        ? addEmails.split(',').map(userEmail => userEmail.trim())
        : addEmails;

        const user = await User.findOne({ username: hostUsername });
        if (!user) {
            res.status(404).json({ message: 'user not found' });
        }
        console.log("User emails array: ", userEmailsArray);
        const invitedUsers = await User.find({ email: { $in: userEmailsArray } });
        console.log("User emails before validation: ", invitedUsers);
        const validuserEmails = invitedUsers.map(user => user.email);
        console.log("valid userEmails:", validuserEmails);
        const userEmailNameMap = {};
        invitedUsers.forEach(invitedUser => {
            userEmailNameMap[invitedUser.email] = `${invitedUser.firstName} ${invitedUser.lastName}`;
        });
        
        
        const meeting = new meetingModel({
            eventTopic,
            password,
            hostId: user._id,
            hostName: `${user.firstName} ${user.lastName}`,
            description,
            dateTime: convertToUTC(combinedDateTime, timezone),
            timezone,
            duration: parseFloat(duration) * 60,
            backgroundColor,
            link: addLink,
            inviteeEmails: userEmailsArray,
            invitations: validuserEmails.map(email => ({ email, name: userEmailNameMap[email], status: "pending" }))
        });

        await meeting.save();
        res.status(200).json({ message: 'meeting successfully saved' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong", error });
    }
});

router.put('/:id', authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params; // Meeting ID from URL
        const { eventTopic, 
            password, 
            hostUsername, 
            description, 
            dateAndTime, 
            timezone,
            duration, 
            backgroundColor, 
            addLink, 
            addEmails  
        } = req.body;

        console.log("Update request for meeting:", id);
        console.log("Updated data:", req.body);

        // Find the meeting
        let meeting = await meetingModel.findById(id);
        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        // Find host user
        const user = await User.findOne({ username: hostUsername });
        if (!user) {
            return res.status(404).json({ message: 'Host user not found' });
        }

        // Check if the request is made by the host
        if (meeting.hostId.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "Only the host can edit this meeting" });
        }

        const { date, time, ampm } = dateAndTime;
        const combinedDateTime = `${date} ${time} ${ampm}`;
        const userEmailsArray = typeof addEmails === "string"
            ? addEmails.split(',').map(userEmail => userEmail.trim())
            : addEmails;

        console.log("User emails array: ", userEmailsArray);
        const invitedUsers = await User.find({ email: { $in: userEmailsArray } });
        console.log("User emails before validation: ", invitedUsers);

        const validUserEmails = invitedUsers.map(user => user.email);
        console.log("Valid userEmails:", validUserEmails);

        const userEmailNameMap = {};
        invitedUsers.forEach(invitedUser => {
            userEmailNameMap[invitedUser.email] = `${invitedUser.firstName} ${invitedUser.lastName}`;
        });

        // Preserve existing invitation statuses
        const updatedInvitations = validUserEmails.map(email => {
            const existingInvitation = meeting.invitations.find(inv => inv.email === email);
            return {
                email,
                name: userEmailNameMap[email],
                status: existingInvitation ? existingInvitation.status : "pending"
            };
        });

        // Update the meeting
        meeting.eventTopic = eventTopic || meeting.eventTopic;
        meeting.password = password || meeting.password;
        meeting.description = description || meeting.description;
        meeting.dateTime = convertToUTC(combinedDateTime, timezone);
        meeting.timezone = timezone || meeting.timezone;
        meeting.duration = parseFloat(duration) * 60 || meeting.duration;
        meeting.backgroundColor = backgroundColor || meeting.backgroundColor;
        meeting.link = addLink || meeting.link;
        meeting.inviteeEmails = userEmailsArray || meeting.inviteeEmails;
        meeting.invitations = updatedInvitations;

        await meeting.save();
        res.status(200).json({ message: 'Meeting successfully updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong", error });
    }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { userId, userEmail } = req.body; // userEmail is needed for invitee removal

        const meeting = await meetingModel.findById(id);
        if (!meeting) {
            return res.status(404).json({ message: "Meeting not found." });
        }

        // Host deleting the meeting
        if (meeting.hostId.toString() === userId) {
            await meetingModel.findByIdAndDelete(id);
            return res.status(200).json({ message: "Meeting deleted successfully." });
        }

        // Invitee removing himself from the meeting
        meeting.invitations = meeting.invitations.filter(inv => inv.email !== userEmail);
        meeting.inviteeEmails = meeting.inviteeEmails.filter(email => email !== userEmail);
        
        await meeting.save();

        res.status(200).json({ message: "You have been removed from the meeting." });
    } catch (error) {
        next(error);
    }
});

router.put('/:meetingId/toggle-active', authMiddleware, async (req, res, next) => {
    try {
        const { meetingId } = req.params;
        console.log(meetingId);
        const { updates } = req.body; // Extracting 'updates' from frontend

        const meeting = await meetingModel.findById(meetingId);
        if (!meeting) {
            return res.status(404).json({ message: "Meeting not found" });
        }

        if (updates.hostActive !== undefined) {
            // Host is updating the event's active status
            meeting.hostActive = updates.hostActive;
        } else if (updates.invitations) {
            // Invitee is updating their active status
            updates.invitations.forEach(invUpdate => {
                const invitee = meeting.invitations.find(inv => inv.email === invUpdate.email);
                if (invitee) {
                    invitee.active = invUpdate.active;
                }
            });
        } else {
            return res.status(400).json({ message: "Invalid update payload" });
        }

        await meeting.save();
        res.json({ message: "Active status updated", updatedFields: updates });

    } catch (error) {
        next(error);
    }
});

router.get('/user/:username', authMiddleware, async (req, res, next) => {
    try {
        const username = req.params.username;
        const user = await userModel.findOne({ username: username });
        if (!user) {
            res.status(404).json({ message: 'user not found' });
        }
        const hostedMeetings = await meetingModel.find({ hostId : user._id });
        const invitedMeetings = await meetingModel.find({
            "invitations": {
                $elemMatch: { email: user.email }
            }
        });
        const userMeetings = [...hostedMeetings, ...invitedMeetings];
        console.log("Invited meetings in here: ", invitedMeetings.length);
        // console.log("User email: ", user.email);
        res.status(200).json(userMeetings);
        
    } catch (error) {
        next(error);
        res.status(500).json({ message: 'Internal sever error' })
    }
});


//to update status
router.put("/:meetingId/invite", authMiddleware, async (req, res, next) => {
    try {
        const { userEmail, status } = req.body; // Expecting email and new status
        const meetingId = req.params.meetingId;

        // Validate Meeting ID
        if (!mongoose.Types.ObjectId.isValid(meetingId)) {
            return res.status(400).json({ message: "Invalid Meeting ID" });
        }

        // Find and Update the Invitation Status
        const meeting = await meetingModel.findByIdAndUpdate(
            meetingId,
            {
                $set: { "invitations.$[elem].status": status } // Updating only the matched invitee's status
            },
            {
                new: true, // Return the updated document
                arrayFilters: [{ "elem.email": userEmail }] // Match invitee by email
            }
        );

        if (!meeting) {
            return res.status(404).json({ message: "Meeting not found" });
        }

        res.status(200).json({ message: "Invitation status updated", meeting });
    } catch (error) {
        next(error);
    }
});

// router.put('/:meetingId/invite', async (req, res, next) => {
//     try {
        
//         const { userEmail, status } = req.body;
//         const meetingId = req.params.meetingId;
//         const meetingObjectId = new mongoose.Types.ObjectId(meetingId);
//         console.log("MeetingId: ", meetingObjectId);
//         console.log(typeof meetingId);
//         console.log("Query:", { _id: meetingId, "invitations.email": userEmail });
//         const meeting = await meetingModel.findOneAndUpdate(
//             { _id: meetingId, "invitations.userEmail": userEmail },
//             { $set: { "invitations.$.status": status } },
//             { new: true }
//         );
//         console.log("userEmail: ", userEmail);
//         if (!meeting) return res.status(404).json({ message: "Meeting not found" });

//         res.json(meeting);
//     } catch (error) {
//         next(error);
//     }
// });

function convertToUTC(timeInUser, userTimezone) {
    return moment.tz(timeInUser, 'YYYY-MM-DD hh:mm A', userTimezone).toDate();
}

module.exports = router;

// const [eventData, setEventData] = useState({
//     eventTopic: '',
//     password: '',
//     hostName: '',
//     description: '',
//     dateAndTime: {
//       date: "", // Format: YYYY-MM-DD
//       time: "", // Format: HH:MM (24-hour)
//       ampm: "PM", // "AM" or "PM"
//       timezone: getUserTimezone(), // Default timezone
//     },
//     duration: '',
//     backgroundColor: '000000',
//     addLink: '',
//     adduserEmails: [],
//   });