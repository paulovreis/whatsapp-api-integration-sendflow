const express = require('express');
const router = express.Router();

const { validateWebhook } = require('../middlewares/validationMiddleware');

module.exports = (webhookController) => {
  router.post('/', validateWebhook, webhookController.handleWebhook.bind(webhookController));
  return router;
};
