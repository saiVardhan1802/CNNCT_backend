const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    terms : {
        type: String
    },
    username: {
        type: String,
        required: true,
        default: ' '
    },
    category: {
        type: String
    },
    unavailability: [
        {
          day: { type: String},   // Ex: 'Mon', 'Tue'
          slots: [
            {
              startTime: { type: String},  // like '10:00 AM'
              endTime: { type: String}
            }
          ],
          isUnavailable: { type: Boolean }
        }
      ]
      
});

module.exports = mongoose.model("User", userSchema);