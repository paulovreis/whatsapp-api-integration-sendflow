// whatsappRoutes.js
const express = require("express");
const router = express.Router();

const { validateWhatsappMessage } = require("../middlewares/validationMiddleware");

module.exports = (whatsappController) => {
  router.get("/message", whatsappController.getMessage.bind(whatsappController));
  router.post("/save-message", validateWhatsappMessage, whatsappController.saveMessage.bind(whatsappController));
  return router;
};