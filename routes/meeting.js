const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const meetingModel = require("../models/meeting.model");
const User = require('../models/user.model');
const { authMiddleware } = require("../middleware/authMiddleware");
const { json } = require('body-parser');

router.post('/', async (req, res, next) => {
    try {
        const { eventTopic, 
            password, 
            hostUsername, 
            description, 
            dateAndTime, 
            duration, 
            backgroundColor, 
            addLink, 
            addEmails  } = req.body;

        
        const meeting = new meetingModel({
            eventTopic,
            password,
            hostUsername: {},
            
        });
    } catch (error) {
        
    }
})

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
//     addEmails: [],
//   });