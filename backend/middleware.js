const { JWT_SECRET } = require("./config");
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  if (
    !req.body.authorization ||
    !req.body.authorization.startsWith("Bearer ")
  ) {
    return res.status(403).json({
      message: "Not Authorized",
    });
  }

  const token = req.body.authorization.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (errorMessage) {
    return res.status(403).json({
      errorMessage,
    });
  }
};

module.exports = {
  authMiddleware,
};
