const express = require('express');
const router = express.Router();

const { validateWebhook, validateEvolutionApiWebhook } = require('../middlewares/validationMiddleware');

module.exports = (webhookController) => {
  router.post('/', validateWebhook, webhookController.handleWebhook.bind(webhookController));
  // Nova rota EvolutionAPI webhook
  router.post('/evolutionapi/messages-upsert', validateEvolutionApiWebhook, webhookController.handleEvolutionWebhookFirstMessageResponse.bind(webhookController));
  // router.post('/disparo-top-compradores', webhookController.handleTopBuyersMessage.bind(webhookController));
  return router;
};
