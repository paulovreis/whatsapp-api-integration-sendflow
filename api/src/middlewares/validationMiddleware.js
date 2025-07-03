//validationMiddleware.js
const { body, query, validationResult } = require('express-validator');

const validationMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validateWebhook = [
  body('id').isString().notEmpty().withMessage("Campo 'id' obrigatório e deve ser string."),
  body('event').isString().notEmpty().withMessage("Campo 'event' obrigatório e deve ser string."),
  body('version').isString().notEmpty().withMessage("Campo 'version' obrigatório e deve ser string."),
  body('data').isObject().withMessage("Campo 'data' obrigatório e deve ser um objeto."),
  body('data.campaignId').isString().notEmpty().withMessage("Campo 'data.campaignId' obrigatório e deve ser string."),
  body('data.campaignName').isString().notEmpty().withMessage("Campo 'data.campaignName' obrigatório e deve ser string."),
  body('data.groupName').isString().notEmpty().withMessage("Campo 'data.groupName' obrigatório e deve ser string."),
  body('data.number').isString().notEmpty().withMessage("Campo 'data.number' obrigatório e deve ser string."),
  body('data.createdAt').isString().notEmpty().withMessage("Campo 'data.createdAt' obrigatório e deve ser string (data ISO)."),
  validationMiddleware
];
const validateWhatsappMessage = [
  body('modules')
    .isArray({ min: 1 })
    .withMessage("Campo 'modules' obrigatório e deve ser um array."),
  body('modules.*')
    .isArray({ min: 1 })
    .withMessage("Cada módulo deve ser um array com pelo menos uma variação."),
  body('modules.*.*')
    .isString()
    .notEmpty()
    .withMessage("Cada variação deve ser uma string não vazia."),
  validationMiddleware
];


const validateEvolutionApiWebhook = [
  body('event').isString().notEmpty().withMessage("Campo 'event' obrigatório e deve ser string."),
  body('instance').isString().notEmpty().withMessage("Campo 'instance' obrigatório e deve ser string."),
  body('data').isObject().withMessage("Campo 'data' obrigatório e deve ser um objeto."),
  body('data.key').isObject().withMessage("Campo 'data.key' obrigatório e deve ser um objeto."),
  body('data.key.remoteJid').isString().notEmpty().withMessage("Campo 'data.key.remoteJid' obrigatório e deve ser string."),
  body('data.key.fromMe').isBoolean().withMessage("Campo 'data.key.fromMe' obrigatório e deve ser boolean."),
  body('data.key.id').isString().notEmpty().withMessage("Campo 'data.key.id' obrigatório e deve ser string."),
  body('data.pushName').isString().notEmpty().withMessage("Campo 'data.pushName' obrigatório e deve ser string."),
  body('data.status').isString().notEmpty().withMessage("Campo 'data.status' obrigatório e deve ser string."),
  body('data.message').isObject().withMessage("Campo 'data.message' obrigatório e deve ser um objeto."),
  body('data.message.conversation').isString().notEmpty().withMessage("Campo 'data.message.conversation' obrigatório e deve ser string."),
  body('data.messageType').isString().notEmpty().withMessage("Campo 'data.messageType' obrigatório e deve ser string."),
  body('data.messageTimestamp').isNumeric().withMessage("Campo 'data.messageTimestamp' obrigatório e deve ser numérico."),
  body('data.instanceId').isString().notEmpty().withMessage("Campo 'data.instanceId' obrigatório e deve ser string."),
  body('data.source').isString().notEmpty().withMessage("Campo 'data.source' obrigatório e deve ser string."),
  body('destination').isString().notEmpty().withMessage("Campo 'destination' obrigatório e deve ser string."),
  body('date_time').isString().notEmpty().withMessage("Campo 'date_time' obrigatório e deve ser string."),
  body('sender').isString().notEmpty().withMessage("Campo 'sender' obrigatório e deve ser string."),
  body('server_url').isString().notEmpty().withMessage("Campo 'server_url' obrigatório e deve ser string."),
  body('apikey').isString().notEmpty().withMessage("Campo 'apikey' obrigatório e deve ser string."),
  validationMiddleware
];

module.exports = {
  validateWebhook,
  validateWhatsappMessage,
  validateEvolutionApiWebhook
};
