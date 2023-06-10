const Follow = require("../models/Follow");
const User = require("../models/User");

const followService = require("../services/followService");

const mongoosePagination = require("mongoose-pagination");

const save = async (req, res) => {
  try {
    const params = req.body;

    const identity = req.user;

    let userToFollow = new Follow({
      user: identity.id,
      followed: params.followed,
    });

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

const unfollow = async (req, res) => {
  try {
    const userId = req.user.id;

    const followedId = req.params.id;

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
    let userId = req.user.id;

    if (req.params.id) userId = req.params.id;

    let page = 1;
    if (req.params.page) page = req.params.page;

    const itemsPerPage = 5;

    const query = Follow.find({ user: userId })
      .populate("user followed", "-password -email -role -__v")
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage);

    const follows = await query.exec();
    const total = await Follow.countDocuments({ user: userId }).exec();

    let followUserIds = await followService.followUserIds(req.user.id, res);

    return res.status(200).send({
      status: "success",
      message: "list of users I'm following",
      follows,
      total,
      pages: Math.ceil(total / itemsPerPage),
      user_following: followUserIds.following,
      user_follow_me: followUserIds.followers,
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "An error occurred during following",
    });
  }
};

const followers = async (req, res) => {
  try {
    let userId = req.user.id;

    if (req.params.id) userId = req.params.id;

    let page = 1;
    if (req.params.page) page = req.params.page;

    const itemsPerPage = 5;

    const query = Follow.find({ followed: userId })
      .populate("user", "-password -email -role -__v")
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage);

    const follows = await query.exec();
    const total = await Follow.countDocuments({ user: userId }).exec();

    let followUserIds = await followService.followUserIds(req.user.id, res);

    return res.status(200).send({
      status: "success",
      message: "List of users who follow me",
      follows,
      total,
      pages: Math.ceil(total / itemsPerPage),
      user_following: followUserIds.following,
      user_follow_me: followUserIds.followers,
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "An error occurred during following",
    });
  }
};

module.exports = {
  save,
  unfollow,
  following,
  followers,
};
