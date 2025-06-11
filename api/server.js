//server.js
const express = require("express");
const WebhookController = require("./src/controllers/webhookController");
const validationMiddleware = require("./src/middlewares/validationMiddleware");
const webhookRoutesFactory = require("./src/routes/webhookRoutes");
const dotenv = require("dotenv");
dotenv.config({ path: require('path').resolve(__dirname, '../.env') });

// Defina a URL base da Evolution API aqui
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
console.log("EVOLUTION_API_URL:", EVOLUTION_API_URL);
const webhookController = new WebhookController(EVOLUTION_API_URL);
const webhookRoutes = webhookRoutesFactory(webhookController);

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use("/webhook", webhookRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Servidor webhook rodando na porta ${PORT}`);
});
