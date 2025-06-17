// Server
const express = require("express");
const WebhookController = require("./src/controllers/webhookController");
const validationMiddleware = require("./src/middlewares/validationMiddleware");
const webhookRoutesFactory = require("./src/routes/webhookRoutes");
const dotenv = require("dotenv");
const cors = require("cors");
const WhatsappController = require("./src/controllers/whatsappController");
const whatsappRoutesFactory = require("./src/routes/whatsappRoutes");
dotenv.config({ path: require('path').resolve(__dirname, '../.env') });

const app = express();

// Habilitar CORS para qualquer rota vinda de 'helderporto.com'
app.use(cors({
  origin: ['https://helderporto.com', 'https://www.app.helderporto.com', 'https://app.helderporto.com', 'https://www.helderporto.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Defina a URL base da Evolution API aqui
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
console.log("EVOLUTION_API_URL:", EVOLUTION_API_URL);
// Webhook
const webhookController = new WebhookController(EVOLUTION_API_URL);
const webhookRoutes = webhookRoutesFactory(webhookController);
//whatsapp
const whatsappController = new WhatsappController();
const whatsappRoutes = whatsappRoutesFactory(whatsappController);

app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use("/webhook", webhookRoutes);
app.use("/whatsapp", whatsappRoutes);

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
  console.log(`Servidor webhook rodando na porta ${PORT}`);
});
