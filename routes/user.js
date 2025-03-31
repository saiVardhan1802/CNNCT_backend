const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');
const userModel = require("../models/user.model");
const { authMiddleware } = require("../middleware/authMiddleware");

router.get('/', authMiddleware , async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) { 
            res.status(401).json({ message: "Authorization header missing." });
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: "token missing" });
        }
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const userId = decoded.id;
        console.log("UserId: ", userId)
        const user = await userModel.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'user not found' });
        }

        res.json(user);
    } catch (error) {
        next(error);
    }
})

router.put("/", authMiddleware, async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const { username } = req.body;
        const usernameExists = await userModel.findOne({ username: username });
        if (usernameExists) {
            return res.status(409).json({ message: "This username is already in use." });
        }
        const { email } = req.body;
        console.log(req.body)
        const emailExists = await userModel.findOne({ email: email });
        if (emailExists) {
            return res.status(409).json({ message: "This email is already in use. "})
        }
        if (!authHeader) {
            return res.status(401).json({ message: "Authorization header missing." });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Token missing." });
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const userId = decoded.id;
        console.log("Received Data:", JSON.stringify(req.body, null, 2));

        const user = await userModel.findByIdAndUpdate(
            userId, 
            { $set: req.body },  // 🔥 Ensures only the provided fields get updated
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        console.log(user.unavailability);

        return res.status(200).json(user);
    } catch (error) {
        next(error);
    }
});

module.exports = router;