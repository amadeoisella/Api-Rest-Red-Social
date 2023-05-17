//imported dependencies
const bcrypt = require("bcrypt");
const mongoosePagination = require("mongoose-pagination");
const fs = require("fs");
const path = require("path");

//importar modelos
const User = require("../models/User");

//importar servicios
const jwt = require("../services/jwt");
const followService = require("../services/followService");

// POST - registro de usuarios
const register = (req, res) => {
  //recoger parámetros del body
  const params = req.body;

  //comprobar que me llegan (+ validacion)
  if (!params.name || !params.email || !params.password || !params.nick) {
    return res.status(400).send({
      status: "error",
      message: "no data to be sent",
    });
  }

  //control de usuarios duplicados
  User.find({
    $or: [
      { email: params.email.toLowerCase() },
      { nick: params.nick.toLowerCase() },
    ],
  }).then(async (users) => {
    if (users && users.length >= 1) {
      return res.status(200).send({
        status: "success",
        message: "user already exists",
      });
    }

    //cifrar password
    const pwd = await bcrypt.hash(params.password, 10);
    params.password = pwd;

    //crear objeto de usuario
    const userToSave = new User(params);

    //guardar usuario en la base de datos
    userToSave.save().then((userStored) => {
      return res.status(200).send({
        status: "success",
        message: "user successfully registered",
        user: userStored,
      });
    });
  });
};

// POST - logueo de usuarios
const login = async (req, res) => {
  // Recoger parámetros del body
  const params = req.body;

  if (!params.email || !params.password) {
    return res.status(404).send({
      status: "error",
      message: "no data to send",
    });
  }

  try {
    // Buscar en la base de datos si el usuario existe
    const user = await User.findOne({ email: params.email });

    if (!user) {
      return res.status(404).send({
        status: "error",
        message: "nonexistent user",
      });
    }

    // Comprobar la contraseña
    const pwd = bcrypt.compareSync(params.password, user.password);

    if (!pwd) {
      return res.status(400).send({
        status: "error",
        message: "you are not correctly identified",
      });
    }

    // Devolver token
    const token = jwt.createToken(user);

    // Devolver datos del usuario
    return res.status(200).send({
      status: "success",
      message: "you are correctly identified",
      user: {
        id: user._id,
        name: user.name,
        nick: user.nick,
      },
      token,
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Internal server error",
    });
  }
};

// GET - extraer un usuario
const profile = async (req, res) => {
  try {
    // recibir el parámetro del ID de usuario por la URL
    const id = req.params.id;

    // consulta para obtener los datos del usuario
    const userProfile = await User.findById(id).select({
      password: 0,
      role: 0,
    });

    if (!userProfile) {
      return res.status(404).send({
        status: "error",
        message: "User does not exist",
      });
    }

    //info de seguimiento
    const followInfo = await followService.followThisUser(req.user.id, id);

    // Posteriormente, devolver información de follows
    return res.status(200).send({
      status: "success",
      user: userProfile,
      following: followInfo.following,
      follower: followInfo.follower,
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "An error occurred",
    });
  }
};

// GET - listar usuarios por medio de pagination
const list = async (req, res) => {
  try {
    let page = 1;
    if (req.params.page) {
      page = parseInt(req.params.page);
    }

    let itemsPerPage = 3;

    const query = User.find().sort("_id");

    const users = await query
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage)
      .exec();
    const total = await User.countDocuments();

    if (!users || users.length === 0) {
      return res.status(404).send({
        status: "error",
        message: "No available users",
      });
    }

    return res.status(200).send({
      status: "success",
      users,
      page,
      itemsPerPage,
      total,
      pages: Math.ceil(total / itemsPerPage),
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "An error occurred",
    });
  }
};

// PUT - actualizar usuario
const update = async (req, res) => {
  try {
    // Recoger información del usuario a actualizar
    let userIdentity = req.user;
    let userToUpdate = req.body;

    // Eliminar campos sobrantes
    delete userToUpdate.role;
    delete userToUpdate.iat;
    delete userToUpdate.exp;
    delete userToUpdate.image;

    // Comprobar si el usuario existe
    const users = await User.find({
      $or: [
        { email: userToUpdate.email ? userToUpdate.email.toLowerCase() : null },
        { nick: userToUpdate.nick ? userToUpdate.nick.toLowerCase() : null },
      ],
    });

    let userIsset = false;

    users.forEach((user) => {
      if (user && user._id != userIdentity.id) userIsset = true;
    });

    if (userIsset) {
      return res.status(200).send({
        status: "success",
        message: "El usuario ya existe",
      });
    }

    // Cifrar password
    if (userToUpdate.password) {
      const pwd = bcrypt.hashSync(userToUpdate.password, 10);
      userToUpdate.password = pwd;
    }

    // Buscar y actualizar
    const userUpdated = await User.findByIdAndUpdate(
      { _id: userIdentity.id },
      userToUpdate,
      { new: true }
    );

    if (!userUpdated) {
      return res.status(500).send({
        status: "error",
        message: "Error al actualizar el usuario",
      });
    }

    // Devolver respuesta
    return res.status(200).send({
      status: "success",
      message: "Actualización de usuario correcta",
      user: userUpdated,
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Error en la consulta",
    });
  }
};

const upload = async (req, res) => {
  try {
    // Recoger el fichero de imagen y comprobar que existe
    if (!req.file) {
      return res.status(404).send({
        status: "error",
        message: "Request does not include an image",
      });
    }

    // Conseguir el nombre del archivo
    let image = req.file.originalname;

    // Separar la extensión del archivo
    let imageSplit = image.split(".");
    const extension = imageSplit[1];

    // Comprobar la extensión
    if (extension != "png" && extension != "jpg" && extension != "jpeg") {
      // Si no es correcta, borrar archivo
      const filePath = req.file.path;
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
        }
      });

      // Devolver respuesta negativa
      return res.status(400).send({
        status: "error",
        message: "Invalid file extension",
      });
    }

    // Si es correcta, guardar imagen en la base de datos
    const userUpdated = await User.findOneAndUpdate(
      { _id: req.user.id },
      { image: req.file.filename },
      { new: true }
    );

    if (!userUpdated) {
      return res.status(500).send({
        status: "error",
        message: "Error in uploading avatar",
      });
    }

    // Devolver respuesta
    return res.status(200).send({
      status: "success",
      user: userUpdated,
      file: req.file,
    });
  } catch (error) {
    console.error("Error in upload:", error);
    return res.status(500).send({
      status: "error",
      message: "An error occurred during upload",
    });
  }
};

const avatar = (req, res) => {
  try {
    const file = req.params.file;
    const filePath = "./uploads/avatars/" + file;

    //comprobar que existe
    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        return res
          .status(404)
          .send({ status: "error", message: "no image exists" });
      }

      //devolver un file
      return res.sendFile(path.resolve(filePath));
    });
  } catch (error) {
    console.error("Error in upload:", error);
    return res.status(500).send({
      status: "error",
      message: "An error occurred during upload",
    });
  }
};

//exported shares
module.exports = {
  register,
  login,
  profile,
  list,
  update,
  upload,
  avatar,
};
