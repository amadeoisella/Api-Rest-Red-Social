require("dotenv").config();
const jwt = require("jwt-simple");
const moment = require("moment");

const secret = process.env.JWT_SECRET;

const createToken = (user) => {
  const payload = {
    id: user._id,
    name: user.name,
    surname: user.surname,
    nick: user.nick,
    email: user.email,
    user: user.role,
    image: user.image,
    iat: moment().unix(),
    exp: moment().add(7, "days").unix(),
  };

  return jwt.encode(payload, secret);
};

module.exports = { secret, createToken };
