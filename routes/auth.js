const express = require("express");
const router = express.Router();
const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/register", async (req, res, next) => {
    try {
        const { firstName, lastName, email, password, terms } = req.body;
        console.log(req.body);
        const validationErrors = validateUserData({ firstName, email, password, terms });
        console.log("errors: ", validationErrors)
        if (validationErrors.length > 0) {
            return res.status(400).json({ message: validationErrors.join("\n") });
        }
        const userExists = await userModel.findOne({ email: email });
        console.log("User Model: ", userModel);
        if(userExists) {
            return res.status(409).json({ message: "An account with this email already exists. Please log in or use a different email." });
        }
        // console.log(req.body);
        // console.log(email, password);
        const hashedPassword = bcrypt.hashSync(password, 8);
        const user = new userModel({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            terms
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

function validateUserData({ firstName, email, password, terms }) {
    const errors = [];

    if (!firstName) {
        errors.push("First name is required.");
        return errors;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push("Invalid email format.");
        return errors;
    }
    if (!password || password.length < 8) {
        errors.push("Password must be at least 8 characters long.");
    }
    if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter.");
    }
    if (!/[a-z]/.test(password)) {
        errors.push("Password must contain at least one lowercase letter.");
    }
    if (!/\d/.test(password)) {
        errors.push("Password must contain at least one number.");
    }
    if (!/[@$!%*?&]/.test(password)) {
        errors.push("Password must contain at least one special character (@$!%*?&).");
        return errors;
    }
    if(terms===false) {
        errors.push("Please accept the terms and conditions.");
        return errors;
    }

    return errors; // Returns an array of error messages
}