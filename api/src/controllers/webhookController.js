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

      // Bloqueia disparos feitos pelo próprio número de envio
      const sender = req.body.data.status.toLowerCase();
      if (sender === "server_ack" || sender === "SERVER_ACK") {
        console.error(
          "Webhook recebido do próprio número de envio, ignorando."
        );
        return res.status(200).json({
          success: true,
          message: "Webhook recebido do próprio número de envio, ignorando.",
        });
      }

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
        text = `${contactName ? `Olá, ${contactName}! Tudo bem? Hélder aqui 😃 \n` : "Olá! Tudo bem? Hélder aqui 😃 \n"}${text}`;
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
            const audioPath = path.resolve(__dirname, "../archives", filename);
            const audioBuffer = fs.readFileSync(audioPath);
            return audioBuffer.toString("base64");
          }

          // Envia o primeiro áudio
          const audio1 = getAudioBase64("Portal.mp3");
          const audioData1 = {
            number: number,
            audio: audio1,
            delay: 36000,
          };
          await axios.post(
            `${this.evolutionApiUrl}/message/sendWhatsappAudio/${req.body.instance}`,
            audioData1,
            {
              headers: {
                apikey: apiKey,
                "Content-Type": "application/json",
              },
            }
          );
          console.log("Áudio 1 enviado para Evolution API");

          // Envia o segundo áudio
          const audio2 = getAudioBase64("Portal-2.mp3");
          const audioData2 = {
            number: number,
            audio: audio2,
            delay: 43000,
          };
          await axios.post(
            `${this.evolutionApiUrl}/message/sendWhatsappAudio/${req.body.instance}`,
            audioData2,
            {
              headers: {
                apikey: apiKey,
                "Content-Type": "application/json",
              },
            }
          );
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
}

module.exports = WebhookController;
