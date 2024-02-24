const { SignJWT, jwtVerify } = require("jose");

const { JWT_SECRET } = process.env;

const getToken = async (id, name, email, isAdmin) => {
  const jwt = await new SignJWT({
    user: {
      id,
      name,
      email,
      role: isAdmin ? "admin" : "user",
    },
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(new TextEncoder().encode(JWT_SECRET));

  return jwt;
};

const validateToken = async (token) => {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );

    return payload;
  } catch (error) {
    return;
  }
};

module.exports = {
  getToken,
  validateToken,
};
