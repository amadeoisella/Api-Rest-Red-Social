//imports
const Follow = require("../models/Follow");

const followUserIds = async (identityUserId, res) => {
  try {
    //sacar info de seguimiento
    let following = await Follow.find({ user: identityUserId })
      .select({
        followed: 1,
        _id: 0,
      })
      .exec();

    let followers = await Follow.find({ followed: identityUserId })
      .select({
        user: 1,
        _id: 0,
      })
      .exec();

    //procesar array de identificadores
    let followingClean = [];

    following.forEach((follow) => {
      followingClean.push(follow.followed);
    });

    followersClean = [];

    followers.forEach((follow) => {
      followersClean.push(follow.user);
    });

    return {
      following: followingClean,
      followers: followersClean,
    };
  } catch (error) {
    return {};
  }
};

//sacar info para ver si me sigue y lo sigo
const followThisUser = async (identityUserId, profileUserId) => {
  //sacar info de seguimiento
  let following = await Follow.findOne({
    user: identityUserId,
    followed: profileUserId,
  });

  let follower = await Follow.findOne({
    user: profileUserId,
    followed: identityUserId,
  });

  return {
    following,
    follower,
  };
};

module.exports = {
  followUserIds,
  followThisUser,
};
