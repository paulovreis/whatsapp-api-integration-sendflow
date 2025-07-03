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
  body('key').isObject().withMessage("Campo 'key' obrigatório e deve ser um objeto."),
  body('key.remoteJid').isString().notEmpty().withMessage("Campo 'key.remoteJid' obrigatório e deve ser string."),
  body('key.fromMe').isBoolean().withMessage("Campo 'key.fromMe' obrigatório e deve ser boolean."),
  body('key.id').isString().notEmpty().withMessage("Campo 'key.id' obrigatório e deve ser string."),
  body('pushName').isString().notEmpty().withMessage("Campo 'pushName' obrigatório e deve ser string."),
  body('status').isString().notEmpty().withMessage("Campo 'status' obrigatório e deve ser string."),
  body('message').isObject().withMessage("Campo 'message' obrigatório e deve ser um objeto."),
  body('message.conversation').isString().notEmpty().withMessage("Campo 'message.conversation' obrigatório e deve ser string."),
  body('messageType').isString().notEmpty().withMessage("Campo 'messageType' obrigatório e deve ser string."),
  body('messageTimestamp').isNumeric().withMessage("Campo 'messageTimestamp' obrigatório e deve ser numérico."),
  body('instanceId').isString().notEmpty().withMessage("Campo 'instanceId' obrigatório e deve ser string."),
  validationMiddleware
];

module.exports = {
  validateWebhook,
  validateWhatsappMessage,
  validateEvolutionApiWebhook
};
