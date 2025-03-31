const jwt = require("jsonwebtoken");
function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: "No token provided" });
        }

        // Split the "Bearer <token>" string and extract the token
        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Invalid token format" });
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}

exports.authMiddleware = authMiddleware;