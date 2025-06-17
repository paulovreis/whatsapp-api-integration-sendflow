// whatsappRoutes.js
const express = require("express");
const router = express.Router();

const { validateSaveMessage } = require("../middlewares/validationMiddleware");

module.exports = (whatsappController) => {
  router.get("/message", whatsappController.getMessage.bind(whatsappController));
  router.post("/save-message", validateSaveMessage, whatsappController.saveMessage.bind(whatsappController));
  return router;
};