require("dotenv").config();
const jwt = require("jwt-simple");
const moment = require("moment");

const secretJwt = require("../services/jwt");
const secret = secretJwt.secret;

exports.auth = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(403).send({
      status: "error",
      message: "request has no authentication header",
    });
  }

  const token = req.headers.authorization.replace(/['"]+/g, "");

  try {
    const payload = jwt.decode(token, secret);

    if (payload.exp <= moment.unix()) {
      return res.status(401).send({
        status: "error",
        message: "expired token",
      });
    }

    req.user = payload;
  } catch (error) {
    return res.status(404).send({
      status: "error",
      message: "invalid token",
    });
  }

  next();
};
