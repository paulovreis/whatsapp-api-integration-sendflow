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

module.exports = {
  validateWebhook
};
