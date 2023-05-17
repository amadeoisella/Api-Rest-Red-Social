//other imports
const Follow = require("../models/Follow");
const User = require("../models/User");

//importar servicios
const followService = require("../services/followService");

//importas dependencias
const mongoosePagination = require("mongoose-pagination");

//accion de guardar un follow (seguir)
const save = async (req, res) => {
  try {
    // Get data from the request body
    const params = req.body;

    // Get the ID of the authenticated user
    const identity = req.user;

    // Create a new Follow object
    let userToFollow = new Follow({
      user: identity.id,
      followed: params.followed,
    });

    // Save the object to the database
    const followStored = await userToFollow.save();

    return res.status(200).send({
      status: "success",
      identity: req.user,
      follow: followStored,
    });
  } catch (error) {
    console.error("Error in upload:", error);
    return res.status(500).send({
      status: "error",
      message: "An error occurred during upload",
    });
  }
};

//accion de borrar un follow (dejar de seguir)
const unfollow = async (req, res) => {
  try {
    // Get the ID of the authenticated user
    const userId = req.user.id;

    // Get the ID of the user to unfollow
    const followedId = req.params.id;

    // Find and remove the matching follow document
    const followStored = await Follow.findOneAndRemove({
      user: userId,
      followed: followedId,
    });

    return res.status(200).send({
      status: "success",
      message: "follower successfully deleted",
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "An error occurred during unfollow",
    });
  }
};

const following = async (req, res) => {
  try {
    // Sacar el id del usuario identificado
    let userId = req.user.id;

    // Comprobar si me llega el id por parámetro en la URL
    if (req.params.id) userId = req.params.id;

    // Comprobar si me llega la página, sino es la página 1
    let page = 1;
    if (req.params.page) page = req.params.page;

    // Usuarios por página que se quieren mostrar
    const itemsPerPage = 5;

    const query = Follow.find({ user: userId })
      .populate("user followed", "-password -role -__v")
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage);

    const follows = await query.exec();
    const total = await Follow.countDocuments({ user: userId }).exec();

    // Sacar un array de ids de los usuarios que me siguen para ver si me siguen o no
    let followUserIds = await followService.followUserIds(req.user.id, res);

    return res.status(200).send({
      status: "success",
      message: "list of users I'm following",
      follows,
      total,
      pages: Math.ceil(total / itemsPerPage),
      user_following: followUserIds.following, // Acceder a la propiedad `following` sin invocarla como una función
      user_follow_me: followUserIds.followers, // Acceder a la propiedad `followers` sin invocarla como una función
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "An error occurred during following",
    });
  }
};

//accion listado de usuarios que me "siguen" o siguen a cualquier otro usuario
const followers = (req, res) => {
  return res.status(200).send({
    status: "success",
    message: "list of users following me",
  });
};

//exported shares
module.exports = {
  save,
  unfollow,
  following,
  followers,
};
