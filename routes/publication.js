const express = require("express");
const router = express.Router();
const PublicationController = require("../controllers/publication");

//test routes
router.get("/test-publication", PublicationController.testPublication);

module.exports = router;
