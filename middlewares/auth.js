//importar modulos
require("dotenv").config();
const jwt = require("jwt-simple");
const moment = require("moment");

//importar secret pass
const secretJwt = require("../services/jwt");
const secret = secretJwt.secret;

//middleware de autenticacion
exports.auth = (req, res, next) => {
  //comprobar si me llega la cabecera de auth
  if (!req.headers.authorization) {
    return res.status(403).send({
      status: "error",
      message: "request has no authentication header",
    });
  }

  //limpiar el token
  const token = req.headers.authorization.replace(/['"]+/g, "");

  //decodificar el token
  try {
    const payload = jwt.decode(token, secret);

    //comprobar expiracion del token
    if (payload.exp <= moment.unix()) {
      return res.status(401).send({
        status: "error",
        message: "expired token",
      });
    }

    //agregar datos de usuario a request
    req.user = payload;
  } catch (error) {
    return res.status(404).send({
      status: "error",
      message: "invalid token",
    });
  }

  //pasar a la ejecucion de la ruta
  next();
};
