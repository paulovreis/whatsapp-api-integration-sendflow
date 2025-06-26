// WhatsappController.js
const fs = require("fs");
const path = require("path");
const axios = require("axios");

class WhatsappController {
  constructor() {
    this.messageFile = path.resolve(__dirname, "../archives/message.json");
  }

  // GET: retorna a mensagem atual
  getMessage(req, res) {
    try {
      const data = fs.readFileSync(this.messageFile, "utf8");
      const json = JSON.parse(data);
      res.status(200).json({ message: json.message });
    } catch (error) {
      res.status(500).json({ error: "Erro ao ler a mensagem." });
    }
  }

  // POST: salva uma nova mensagem
  saveMessage(req, res) {
    try {
      const { message } = req.body;
      fs.writeFileSync(this.messageFile, JSON.stringify({ message }, null, 2));
      res.status(200).json({ success: true, message: "Mensagem salva com sucesso!" });
    } catch (error) {
      res.status(500).json({ error: "Erro ao salvar a mensagem." });
    }
  }

  // --- Aquecimento entre instâncias ---
  static heatingInterval = null;
  static heatingActive = false;
  static heatingStats = { totalMessages: 0, lastMessage: null, errors: 0 };

  async startHeating(req, res) {
    if (WhatsappController.heatingActive) {
      return res.status(200).json({ success: true, message: "Aquecimento já está em execução." });
    }
    WhatsappController.heatingActive = true;
    WhatsappController.heatingStats = { totalMessages: 0, lastMessage: null, errors: 0 };
    const apiKey = process.env.AUTHENTICATION_API_KEY;
    const evolutionApiUrl = process.env.EVOLUTION_API_URL;
    const fetchInstances = `${evolutionApiUrl}/instance/fetchInstances/`;
    const randomMessage = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-+/%*_.,;:?!@#$&()[]{}<>| ';
      const length = Math.floor(Math.random() * (1000 - 100 + 1)) + 100;
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    // Limite de paralelismo
    const MAX_PARALLEL = 3;
    const sendHeatingMessages = async () => {
      try {
        const response = await axios.get(fetchInstances, {
          headers: {
            apikey: apiKey,
            "Content-Type": "application/json",
          },
        });
        const heatingInstances = (response.data || [])
          .filter((instance) => (instance?.connectionStatus === "connected" || instance?.connectionStatus === "open") && instance?.name?.startsWith("!"));
        if (heatingInstances.length < 2) {
          console.log("É necessário pelo menos 2 instâncias iniciadas com '!' para aquecimento.");
          return;
        }
        // Envio paralelo limitado
        for (let i = 0; i < heatingInstances.length; i++) {
          const sender = heatingInstances[i];
          const receivers = heatingInstances.filter((_, idx) => idx !== i);
          let batch = [];
          for (const receiver of receivers) {
            if (!WhatsappController.heatingActive) return;
            // DEBUG: log instância completa
            // console.log('Sender:', sender);
            // console.log('Receiver:', receiver);
            const senderName = sender?.name || 'null';
            const receiverNumber = receiver?.number || receiver?.phone || receiver?.waNumber || null;
            console.log(`Enviando mensagem de aquecimento de ${senderName} para ${receiverNumber}`);
            const message = randomMessage();
            const minDelay = 60000; // 1 min
            const maxDelay = 180000; // 3 min
            const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
            const url = `${evolutionApiUrl}/message/sendText/${senderName}`;
            const data = {
              number: receiverNumber,
              text: message,
              linkPreview: true,
              delay: randomDelay,
            };
            // Função de envio individual
            const send = async () => {
              try {
                if (!receiverNumber) throw new Error('Número do receiver não encontrado!');
                await axios.post(url, data, {
                  headers: {
                    apikey: apiKey,
                    "Content-Type": "application/json",
                  },
                });
                WhatsappController.heatingStats.totalMessages++;
                WhatsappController.heatingStats.lastMessage = { sender: senderName, receiver: receiverNumber, date: new Date(), text: message };
                console.log(`Mensagem enviada de ${senderName} para ${receiverNumber}`);
              } catch (err) {
                WhatsappController.heatingStats.errors++;
                console.error(`Erro ao enviar de ${senderName} para ${receiverNumber}:`, err.message);
              }
              await new Promise(resolve => setTimeout(resolve, randomDelay));
            };
            batch.push(send());
            if (batch.length >= MAX_PARALLEL) {
              await Promise.all(batch);
              batch = [];
            }
          }
          if (batch.length > 0) {
            await Promise.all(batch);
          }
        }
      } catch (error) {
        WhatsappController.heatingStats.errors++;
        console.error("Erro no startHeating:", error.message);
      }
    };
    // Loop infinito em background
    const loop = async () => {
      while (WhatsappController.heatingActive) {
        await sendHeatingMessages();
      }
    };
    WhatsappController.heatingInterval = loop();
    return res.status(200).json({ success: true, message: "Aquecimento iniciado entre instâncias!" });
  }

  async stopHeating(req, res) {
    WhatsappController.heatingActive = false;
    return res.status(200).json({ success: true, message: "Aquecimento interrompido." });
  }

  async heatingStatus(req, res) {
    res.status(200).json({
      active: WhatsappController.heatingActive,
      stats: WhatsappController.heatingStats,
      startedByCron: req.app?.locals?.heatingStartedByCron || false
    });
  }
}

module.exports = WhatsappController;