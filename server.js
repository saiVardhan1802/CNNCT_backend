const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const morgan = require('morgan');

const errorHandler = require('./middleware/errorHandler');

const { authRoutes } = require("./routes/auth");
const userRoutes = require("./routes/user");
const meetingRoutes = require('./routes/meeting');

dotenv.config();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(errorHandler);
app.use(morgan('dev'));
app.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    console.log(`Headers:`, req.headers);
    console.log(`Body:`, req.body);
    next();
});


app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/meeting', meetingRoutes);

const PORT = process.env.PORT || 3000;

app.get("/", (req, res, next) => {
    try {
        res.send("Hello World!");
    } catch (err) {
        next(err);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
    mongoose.connect(process.env.MONGODB_URI, {
        // useNewUrlParser: true,
        // useUnifiedTopology: true,
    }).then(() => {
        console.log("MongoDB connected");
    }).catch((err) => {
        console.log(err);
    });
});