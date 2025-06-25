// Server
const express = require("express");
const WebhookController = require("./src/controllers/webhookController");
const validationMiddleware = require("./src/middlewares/validationMiddleware");
const webhookRoutesFactory = require("./src/routes/webhookRoutes");
const dotenv = require("dotenv");
const cors = require("cors");
const WhatsappController = require("./src/controllers/whatsappController");
const whatsappRoutesFactory = require("./src/routes/whatsappRoutes");
const jwt = require("jsonwebtoken");
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

// Endpoint de refresh token
const REFRESH_TOKENS = new Set();

app.post("/auth/refresh", express.json(), (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken || !REFRESH_TOKENS.has(refreshToken)) {
    return res.status(401).json({ error: "Refresh token inválido." });
  }
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET || "jwtdevsecret");
    // Gera novo access token
    const token = jwt.sign({ username: payload.username }, process.env.JWT_SECRET || "jwtdevsecret", { expiresIn: "2h" });
    return res.status(200).json({ token });
  } catch (err) {
    return res.status(403).json({ error: "Refresh token expirado ou inválido." });
  }
});

// Modifica o /auth/login para emitir refreshToken
app.post("/auth/login", express.json(), (req, res) => {
  const { username, password } = req.body;
  // Troque por validação real em produção!
  if (username === "admin" && password === "@Temsenha123") {
    const token = jwt.sign({ username }, process.env.JWT_SECRET || "jwtdevsecret", { expiresIn: "2h" });
    const refreshToken = jwt.sign({ username }, process.env.JWT_SECRET || "jwtdevsecret", { expiresIn: "30d" });
    REFRESH_TOKENS.add(refreshToken);
    return res.status(200).json({ token, refreshToken });
  }
  return res.status(401).json({ error: "Usuário ou senha inválidos." });
});

// Endpoint para logout (opcional, remove refreshToken)
app.post("/auth/logout", express.json(), (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) REFRESH_TOKENS.delete(refreshToken);
  res.status(200).json({ success: true });
});

// Middleware para proteger rotas (exemplo de uso)
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "jwtdevsecret");
      req.user = decoded;
      return next();
    } catch (err) {
      return res.status(403).json({ error: "Token inválido ou expirado." });
    }
  }
  return res.status(401).json({ error: "Token não fornecido." });
}

// Proteger todas as rotas /whatsapp com JWT
app.use("/whatsapp", authenticateJWT, whatsappRoutes);

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
  console.log(`Servidor webhook rodando na porta ${PORT}`);
});
