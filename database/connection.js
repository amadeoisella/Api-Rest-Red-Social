const mongoose = require("mongoose");

const connection = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/my_social_network", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("correct connection to database");
  } catch (error) {
    console.error(error);
    throw new Error("failed to connect to the database");
  }
};

module.exports = connection;
