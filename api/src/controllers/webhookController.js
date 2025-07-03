//WebhookController.js
const axios = require("axios");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
dotenv.config({ path: require("path").resolve(__dirname, "../.env") });

class WebhookController {
  constructor(evolutionApiUrl) {
    this.evolutionApiUrl = evolutionApiUrl;
  }

  async handleWebhook(req, res) {
    try {
      console.log("Received webhook:", req.body);
      // valida sendtok do sendflow
      const sendtok =
        req.headers["sendtok"] || req.headers["sendtok".toLowerCase()];
      if (!sendtok) {
        console.error("Webhook inválido: sendtok não encontrado nos headers.");
        return res.status(400).json({
          success: false,
          error: "Webhook inválido: sendtok não encontrado nos headers.",
        });
      }
      if (sendtok !== process.env.SENDFLOW_SENDTOK) {
        console.error("Webhook inválido: sendtok não corresponde.");
        return res.status(400).json({
          success: false,
          error: "Webhook inválido: sendtok não corresponde.",
        });
      }
      const apiKey = process.env.AUTHENTICATION_API_KEY;
      const fetchInstances = `${this.evolutionApiUrl}/instance/fetchInstances/`;

      // Puxar todas as instâncias existentes e salvar apenas os nomes
      let allInstances = [];
      try {
        const response = await axios.get(fetchInstances, {
          headers: {
            apikey: apiKey,
            "Content-Type": "application/json",
          },
        });
        allInstances = (response.data || [])
          .filter(
            (instance) =>
              (instance?.connectionStatus === "connected" ||
                instance?.connectionStatus === "open") &&
              instance?.name &&
              //isso aqui é provisório, trocar depois
              // instance?.name && !instance.name.includes("!") -> original
              (!instance.name.includes("!") || instance.name === "!busines2")
          )
          .map((instance) => instance.name)
          .filter(Boolean);
        console.log("All instances fetched (status open):", allInstances);
      } catch (error) {
        console.error("Error fetching instances:", error.message);
      }

      // Define uma instância aleatória para enviar a mensagem
      const instance =
        allInstances.length > 0
          ? allInstances[Math.floor(Math.random() * allInstances.length)]
          : null;
      if (!instance) {
        console.error("No instances available to send the message.");
        return res.status(500).json({
          success: false,
          error: "No instances available to send the message.",
        });
      }
      console.log("Using instance:", instance);

      // Define qual instância a mensagem será enviada
      const evolutionApiUrl = `${this.evolutionApiUrl}/message/sendText/${instance}`;

      // Message delay
      const minDelay = 4000; // 4 segundos
      const maxDelay = 60000; // 60 segundos
      const delay =
        Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

      // Exemplo de mensagem formatada para WhatsApp (montada por módulos aleatórios)
      const messageFile = path.resolve(__dirname, "../archives/message.json");
      const messageData = JSON.parse(fs.readFileSync(messageFile, "utf8"));
      let text = "";
      if (messageData.modules && Array.isArray(messageData.modules)) {
        text = messageData.modules
          .map((mod) =>
            Array.isArray(mod) && mod.length > 0
              ? mod[Math.floor(Math.random() * mod.length)]
              : ""
          )
          .join("\n\n");
      } else if (messageData.message) {
        text = messageData.message;
      }
      console.log("Mensagem a ser enviada:", text);
      if (!text) {
        console.error("Mensagem não encontrada no arquivo message.json.");
        return res.status(400).json({
          success: false,
          error: "Mensagem não encontrada no arquivo message.json.",
        });
      }

      const data = {
        number: req.body.data.number,
        text: text,
        delay: delay, // Tempo de espera aleatório entre 4 e 10 segundos
        linkPreview: true, // Habilita a visualização de links
      };

      if (!data.number || !data.text) {
        console.error("Campos 'number' e 'text' são obrigatórios.");
        return res.status(400).json({
          success: false,
          error: "Campos 'number' e 'text' são obrigatórios.",
        });
      }

      // Responde imediatamente ao webhook
      res.status(200).json({
        success: true,
        message: "Mensagem será enviada em background.",
      });

      // Envia a mensagem em background
      (async () => {
        try {
          const response = await axios.post(evolutionApiUrl, data, {
            headers: {
              apikey: apiKey,
              "Content-Type": "application/json",
            },
          });
          console.log("Mensagem enviada para Evolution API:", response.data);
        } catch (error) {
          console.error(
            "Erro ao enviar mensagem para Evolution API:",
            error.message
          );
        }
      })();
    } catch (error) {
      console.error(
        "Error forwarding webhook to Evolution API:",
        error.message
      );
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async handleEvolutionWebhookFirstMessageResponse(req, res) {
    try {
      const numerosAquecimento = [
        "557788783449",
        "557788043945",
        "5577988783449",
        "5577988043945",
      ];

      const evolutionApiUrl = `${this.evolutionApiUrl}/message/sendText/${req.body.instance}`;
      const apiKey = process.env.AUTHENTICATION_API_KEY;

      const randomDelay = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000; // Tempo aleatório entre 5 e 10 segundos

      const remoteJid = req.body.data.key.remoteJid;
      const number = remoteJid.replace(/@.*/, ""); // Extrai o número do JID

      const contactName = req.body.data.pushName;

      const receivedMessage = req.body.data.message.conversation.toLowerCase();

      if (
        !(
          receivedMessage.includes("grupo") ||
          receivedMessage.includes("grupovip") ||
          receivedMessage.includes("vip")
        )
      ) {
        console.error(
          "Mensagem recebida não contém 'grupo', 'vip' ou 'grupovip'."
        );
        return res.status(200).json({
          success: true,
          error:
            "Mensagem recebida não contém 'grupo', 'grupo vip' ou 'grupovip'.",
        });
      }

      if (numerosAquecimento.includes(number)) {
        console.error(
          "Número de aquecimento detectado, não será enviada resposta automática:",
          number
        );
        return res.status(200).json({
          success: true,
          message:
            "Número de aquecimento detectado, não será enviada resposta automática.",
        });
      }

      // Monta mensagem de boas-vindas a partir de responseMessage.json
      const responseMessageFile = path.resolve(
        __dirname,
        "../archives/responseMessage.json"
      );
      let text = "";
      try {
        const messageData = JSON.parse(
          fs.readFileSync(responseMessageFile, "utf8")
        );
        if (messageData.modules && Array.isArray(messageData.modules)) {
          text = messageData.modules
            .map((mod) =>
              Array.isArray(mod) && mod.length > 0
                ? mod[Math.floor(Math.random() * mod.length)]
                : ""
            )
            .join("\n\n");
        } else if (messageData.message) {
          text = messageData.message;
        }
      } catch (err) {
        console.error("Erro ao ler responseMessage.json:", err.message);
      }

      // texto com nome do contato antes para personalização
      if (text) {
        text = `${contactName ? `Olá, ${contactName}! ` : ""}${text}`;
      }

      const data = {
        number: number,
        text: text,
        delay: randomDelay,
        linkPreview: true,
      };

      if (!data.number || !data.text) {
        console.error("Campos 'number' e 'text' são obrigatórios.");
        return res.status(400).json({
          success: false,
          error: "Campos 'number' e 'text' são obrigatórios.",
        });
      }

      // Responde imediatamente ao webhook
      res.status(200).json({
        success: true,
        message: "Mensagem será enviada em background.",
      });

      // Envia a mensagem em background
      (async () => {
        try {
          // Envia mensagem de texto
          const response = await axios.post(evolutionApiUrl, data, {
            headers: {
              apikey: apiKey,
              "Content-Type": "application/json",
            },
          });
          console.log("Mensagem enviada para Evolution API:", response.data);

          // Função para ler e converter áudio em base64
          function getAudioBase64(filename) {
            const audioPath = path.resolve(__dirname, '../archives', filename);
            const audioBuffer = fs.readFileSync(audioPath);
            return audioBuffer.toString('base64');
          }

          // Envia o primeiro áudio
          const audio1 = getAudioBase64('Portal.mp3');
          const audioData1 = {
            number: number,
            audio: audio1,
            delay: 36000,
          };
          await axios.post(`${this.evolutionApiUrl}/message/sendWhatsappAudio/${req.body.instance}`, audioData1, {
            headers: {
              apikey: apiKey,
              "Content-Type": "application/json",
            },
          });
          console.log("Áudio 1 enviado para Evolution API");

          // Envia o segundo áudio
          const audio2 = getAudioBase64('Portal-2.mp3');
          const audioData2 = {
            number: number,
            audio: audio2,
            delay: 43000,
          };
          await axios.post(`${this.evolutionApiUrl}/message/sendWhatsappAudio/${req.body.instance}`, audioData2, {
            headers: {
              apikey: apiKey,
              "Content-Type": "application/json",
            },
          });
          console.log("Áudio 2 enviado para Evolution API");

        } catch (error) {
          console.error(
            "Erro ao enviar mensagem ou áudios para Evolution API:",
            error.message
          );
        }
      })();
    } catch (error) {
      console.error(
        "Error forwarding Evolution webhook for first message response:",
        error.message
      );
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ainda não implementado com uma rota
  async handleTopBuyersMessage(req, res) {
    try {
      // Lê o CSV de compradores
      const csvPath = path.resolve(__dirname, '../archives/top_compradores_030725.csv');
      const csvContent = fs.readFileSync(csvPath, 'utf8');
      const lines = csvContent.split(/\r?\n/).filter(Boolean);
      const buyers = [];
      for (let i = 1; i < lines.length; i++) { // pula o cabeçalho
        const [name, rawPhone] = lines[i].split(',');
        if (!name || !rawPhone) continue;
        // Limpa telefone: remove tudo que não for número
        let phone = rawPhone.replace(/\D/g, '');
        if (phone.length >= 10 && !phone.startsWith('55')) phone = '55' + phone;
        buyers.push({ name: name.trim(), phone });
      }

      // Lê mensagem personalizada dos módulos
      const messageFile = path.resolve(__dirname, '../archives/topBuyerMessage.json');
      let text = '';
      try {
        const messageData = JSON.parse(fs.readFileSync(messageFile, 'utf8'));
        if (messageData.modules && Array.isArray(messageData.modules)) {
          text = messageData.modules
            .map((mod) => Array.isArray(mod) && mod.length > 0 ? mod[Math.floor(Math.random() * mod.length)] : "")
            .join("\n\n");
        } else if (messageData.message) {
          text = messageData.message;
        }
      } catch (err) {
        console.error("Erro ao ler topBuyerMessage.json:", err.message);
      }
      if (!text) text = "Parabéns! Você está entre os melhores compradores!";

      // Função para ler e converter áudio em base64
      function getAudioBase64(filename) {
        const audioPath = path.resolve(__dirname, '../archives', filename);
        const audioBuffer = fs.readFileSync(audioPath);
        return audioBuffer.toString('base64');
      }
      const audioBase64 = getAudioBase64('audio_top_compradores.mp3');

      // Envia mensagem e áudio para cada comprador
      const apiKey = process.env.AUTHENTICATION_API_KEY;
      const instance = req.body.instance || '!normal2';
      const evolutionApiUrl = `https://evolutionapi.helderporto.com/message/sendText/${instance}`;
      const audioUrl = `https://evolutionapi.helderporto.com/message/sendWhatsappAudio/${instance}`;

      for (const buyer of buyers) {
        // Mensagem personalizada com nome
        const personalizedText = `Olá, ${buyer.name}! Tudo bem? Hélder aqui 😃\n\n${text}`;
        const data = {
          number: buyer.phone,
          text: personalizedText,
          delay: 3000,
          linkPreview: true,
        };
        try {
          await axios.post(evolutionApiUrl, data, {
            headers: {
              apikey: apiKey,
              "Content-Type": "application/json",
            },
          });
          console.log(`Mensagem enviada para ${buyer.name} (${buyer.phone})`);
        } catch (err) {
          console.error(`Erro ao enviar mensagem para ${buyer.name} (${buyer.phone}):`, err.message);
        }
        // Envia áudio
        const audioData = {
          number: buyer.phone,
          audio: audioBase64,
          delay: 40000, // 40 segundos após a mensagem
        };
        try {
          await axios.post(audioUrl, audioData, {
            headers: {
              apikey: apiKey,
              "Content-Type": "application/json",
            },
          });
          console.log(`Áudio enviado para ${buyer.name} (${buyer.phone})`);
        } catch (err) {
          console.error(`Erro ao enviar áudio para ${buyer.name} (${buyer.phone}):`, err.message);
        }
      }
      res.status(200).json({ success: true, message: `Mensagens e áudios enviados para ${buyers.length} compradores.` });
    } catch (error) {
      console.error('Erro ao enviar mensagens para top buyers:', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = WebhookController;
