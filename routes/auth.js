const express = require("express");
const router = express.Router();
const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/register", async (req, res, next) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        // console.log(req.body);
        // console.log(email, password);
        const hashedPassword = bcrypt.hashSync(password, 8);
        const user = new userModel({
            firstName,
            lastName,
            email,
            password: hashedPassword,
        });
        const payload = {
            id: user._id,
            name: user.username,
        };
        const token = jwt.sign(payload, process.env.SECRET_KEY);
        await user.save();
        res.json({ token, message: "User registered successfully" }).status(200);
    }
    catch (err) {
        next(err);
    }
});

router.post("/login", async (req, res, next) => {
    try {
        const { username, password } = req.body;
        console.log(username);
        const user = await userModel.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "Invalid Credentials" });
        }
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: "Invalid Credentials" });
        }
        const payload = {
            id: user._id,
            name: user.username,
        };
        const token = jwt.sign(payload, process.env.SECRET_KEY);
        res.json({ token, message: "Login successful" }).status(200);
    }
    catch (err) {
        next(err);
    }
});

module.exports = { authRoutes: router };