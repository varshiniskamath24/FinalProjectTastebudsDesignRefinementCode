const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const raw = req.headers.authorization;

  if (!raw || !raw.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "No token provided" });
  }

  try {
    const token = raw.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      _id: decoded._id,
      email: decoded.email,
      role: decoded.role,
      ngoRef: decoded.ngoRef || null
    };

    next();
  } catch {
    res.status(401).json({ msg: "Invalid token" });
  }
};
