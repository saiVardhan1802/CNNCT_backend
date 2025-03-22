const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');
const userModel = require("../models/user.model");
const { authMiddleware } = require("../middleware/authMiddleware");

router.get('/', async (req, res, next) => {
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

router.put("/", async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: "Authorization header missing." });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Token missing." });
        }

        console.log("Auth Header:", authHeader);
        console.log("Extracted Token:", token);

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const userId = decoded.id;

        const user = await userModel.findByIdAndUpdate(userId, req.body, { new: true });  // Ensures updated document is returned
        if (!user) {
            console.log(userId);
            return res.status(404).json({ message: "User not found." });
        }

        return res.status(200).json(user);
    } catch (error) {
        next(error);
    }
});

module.exports = router;