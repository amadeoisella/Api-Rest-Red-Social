const fs = require("fs");
const path = require("path");
const Publication = require("../models/Publication");
const followService = require("../services/followService");

const save = async (req, res) => {
  try {
    const params = req.body;

    if (!params.text) {
      return res.status(400).send({
        status: "error",
        message: "you must enter the text of publication",
      });
    }

    let newPublication = new Publication(params);
    newPublication.user = req.user.id;

    const publicationStored = await newPublication.save();

    if (!publicationStored) {
      return res.status(400).send({
        status: "error",
        message: "publication has not been saved",
      });
    }

    return res.status(200).send({
      status: "success",
      message: "save publication",
      publicationStored,
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "An error occurred while saving the publication",
      error: error.message,
    });
  }
};

const detail = async (req, res) => {
  try {
    const publicationId = req.params.id;

    const publicationStored = await Publication.findById(publicationId);

    if (!publicationStored) {
      return res.status(404).send({
        status: "error",
        message: "the publication does not exist",
      });
    }

    return res.status(200).send({
      status: "success",
      message: "show publication",
      publicationStored,
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "An error occurred while retrieving the publication",
      error: error.message,
    });
  }
};

const remove = async (req, res) => {
  try {
    const publicationId = req.params.id;

    await Publication.deleteOne({ user: req.user.id, _id: publicationId });

    return res.status(200).send({
      status: "success",
      message: "Publication removed",
      publication: publicationId,
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "An error occurred while removing the publication",
      error: error.message,
    });
  }
};

const user = async (req, res) => {
  let userId = req.params.id;

  let page = 1;

  if (req.params.page) page = req.params.page;

  const itemsPerPage = 5;

  try {
    const query = Publication.find({ user: userId })
      .sort("-created_at")
      .populate("user", "-password -__v -role -email");

    const publications = await query
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage)
      .exec();

    const total = await Publication.countDocuments({ user: userId });

    return res.status(200).send({
      status: "success",
      message: "user posts",
      page,
      total,
      pages: Math.ceil(total / itemsPerPage),
      publications,
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "An error occurred while fetching user posts.",
      error,
    });
  }
};

const upload = async (req, res) => {
  try {
    const publicationId = req.params.id;

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

    const publicationUpdated = await Publication.findOneAndUpdate(
      { user: req.user.id, _id: publicationId },
      { file: req.file.filename },
      { new: true }
    );

    if (!publicationUpdated) {
      return res.status(500).send({
        status: "error",
        message: "Error uploading image",
      });
    }

    return res.status(200).send({
      status: "success",
      publication: publicationUpdated,
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

const media = (req, res) => {
  try {
    const file = req.params.file;
    const filePath = "./uploads/publications/" + file;

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        return res
          .status(404)
          .send({ status: "error", message: "no image exists" });
      }

      return res.sendFile(path.resolve(filePath));
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "An error occurred during upload",
    });
  }
};

const feed = async (req, res) => {
  let page = 1;

  if (req.params.page) page = req.params.page;

  let itemsPerPage = 5;

  try {
    const myFollows = await followService.followUserIds(req.user.id);

    const query = Publication.find({ user: myFollows.following })
      .populate("user", "-password -role -__v -email")
      .sort("-created_at")
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage);

    const publications = await query.exec();

    const total = await Publication.countDocuments({
      user: myFollows.following,
    });

    return res.status(200).send({
      status: "success",
      message: "publications feed",
      following: myFollows.following,
      total,
      page,
      pages: Math.ceil(total / itemsPerPage),
      publications,
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "no feed posts listed",
    });
  }
};

module.exports = {
  save,
  detail,
  remove,
  user,
  upload,
  media,
  feed,
};
