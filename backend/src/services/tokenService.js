const jwt = require("jsonwebtoken");

function createAccessToken(compte, role) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return jwt.sign(
    {
      sub: compte.id_compte,
      role: role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    },
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
}

module.exports = {
  createAccessToken,
  verifyAccessToken,
};
