const bcrypt = require("bcrypt");
const mongoosePagination = require("mongoose-pagination");
const Publication = require("../models/Publication");
const fs = require("fs");
const path = require("path");

const User = require("../models/User");

const jwt = require("../services/jwt");
const followService = require("../services/followService");
const Follow = require("../models/Follow");
const validate = require("../helpers/validate");

const register = (req, res) => {
  const params = req.body;

  if (!params.name || !params.email || !params.password || !params.nick) {
    return res.status(400).send({
      status: "error",
      message: "no data to be sent",
    });
  }

  try {
    validate(params);
  } catch (erro) {
    return res.status(400).send({
      status: "error",
      message: "validation failed",
    });
  }

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

    const pwd = await bcrypt.hash(params.password, 10);
    params.password = pwd;

    const userToSave = new User(params);

    userToSave.save().then((userStored) => {
      return res.status(200).send({
        status: "success",
        message: "user successfully registered",
        user: userStored,
      });
    });
  });
};

const login = async (req, res) => {
  const params = req.body;

  if (!params.email || !params.password) {
    return res.status(404).send({
      status: "error",
      message: "no data to send",
    });
  }

  try {
    const user = await User.findOne({ email: params.email });

    if (!user) {
      return res.status(404).send({
        status: "error",
        message: "nonexistent user",
      });
    }

    const pwd = bcrypt.compareSync(params.password, user.password);

    if (!pwd) {
      return res.status(400).send({
        status: "error",
        message: "you are not correctly identified",
      });
    }

    const token = jwt.createToken(user);

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

const profile = async (req, res) => {
  try {
    const id = req.params.id;

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

    const followInfo = await followService.followThisUser(req.user.id, id);

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

const list = async (req, res) => {
  try {
    let page = 1;
    if (req.params.page) {
      page = parseInt(req.params.page);
    }

    let itemsPerPage = 3;

    const query = User.find().select("-password -email -role -__v").sort("_id");

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

    let followUserIds = await followService.followUserIds(req.user.id, res);

    return res.status(200).send({
      status: "success",
      users,
      page,
      itemsPerPage,
      total,
      pages: Math.ceil(total / itemsPerPage),
      user_following: followUserIds.following,
      user_follow_me: followUserIds.followers,
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "An error occurred",
    });
  }
};

const update = async (req, res) => {
  try {
    let userIdentity = req.user;
    let userToUpdate = req.body;

    delete userToUpdate.role;
    delete userToUpdate.iat;
    delete userToUpdate.exp;
    delete userToUpdate.image;

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

    if (userToUpdate.password) {
      const pwd = bcrypt.hashSync(userToUpdate.password, 10);
      userToUpdate.password = pwd;
    } else {
      delete userToUpdate.password;
    }

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
    if (!req.file) {
      return res.status(404).send({
        status: "error",
        message: "Request does not include an image",
      });
    }

    let image = req.file.originalname;

    let imageSplit = image.split(".");
    const extension = imageSplit[1];

    if (extension != "png" && extension != "jpg" && extension != "jpeg") {
      const filePath = req.file.path;
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
        }
      });

      return res.status(400).send({
        status: "error",
        message: "Invalid file extension",
      });
    }

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

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        return res
          .status(404)
          .send({ status: "error", message: "no image exists" });
      }

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

const counters = async (req, res) => {
  let userId = req.user.id;

  if (req.params.id) {
    userId = req.params.id;
  }

  try {
    const following = await Follow.count({ user: userId });

    const followed = await Follow.count({ followed: userId });

    const publications = await Publication.count({ user: userId });

    return res.status(200).send({
      userId,
      folowing: following,
      followed: followed,
      publications: publications,
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "error in counters",
    });
  }
};

module.exports = {
  register,
  login,
  profile,
  list,
  update,
  upload,
  avatar,
  counters,
};
