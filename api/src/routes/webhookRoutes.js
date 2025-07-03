const express = require('express');
const router = express.Router();

const { validateWebhook, validateEvolutionApiWebhook } = require('../middlewares/validationMiddleware');

module.exports = (webhookController) => {
  router.post('/', validateWebhook, webhookController.handleWebhook.bind(webhookController));
  // Nova rota EvolutionAPI webhook
  router.post('/evolutionapi/messages-upsert', webhookController.handleEvolutionWebhookFirstMessageResponse.bind(webhookController));
  return router;
};
