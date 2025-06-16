//WebhookController.js
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config({ path: require("path").resolve(__dirname, "../.env") });

class WebhookController {
	constructor(evolutionApiUrl) {
		this.evolutionApiUrl = evolutionApiUrl;
	}

	async handleWebhook(req, res) {
		try {
			console.log("Received webhook:", req.body);
			// valida sendtok do sendflow
			const sendtok = req.headers['sendtok'] || req.headers['sendtok'.toLowerCase()];
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
					.map((instance) => instance?.name)
					.filter(Boolean);
				console.log("All instances fetched:", allInstances);
			} catch (error) {
				console.error("Error fetching instances:", error.message);
			}

			// Define uma instância aleatória para enviar a mensagem
			const instance = allInstances.length > 0 ? allInstances[Math.floor(Math.random() * allInstances.length)] : null;
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
			const maxDelay = 10000; // 10 segundos
			const delay =
				Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

			// Exemplo de mensagem formatada para WhatsApp
			const text = `Seja bem-vindo(a) a minha comunidade vip!!! Saiba que sua presença aqui é muito especial. 🎉😃

👀 Fique de olho no grupo de avisos, é por lá que Hélder vai mandar todas informações sobre os nossos sorteios. 

Já aproveito também pra te enviar o link da ação gratuita da Fan 0 KM, não se esqueça se você ganhar e não estiver mais no grupo será desclassificado automaticamente. 👉🏼 

https://heldersorteios.com/campanha/hondafan25gratis

E caso tenha qualquer dúvida sobre nossas ações é só falar aqui. Tamo junto! ❤️🍀

Se o link não funcionar, responda essa mensagem com um "ok" ou salve o número de telefone! Obrigado! 🙏🏼`;

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
			res.status(200).json({ success: true, message: 'Mensagem será enviada em background.' });

			// Envia a mensagem em background
			(async () => {
				try {
					const response = await axios.post(evolutionApiUrl, data, {
						headers: {
							apikey: apiKey,
							"Content-Type": "application/json",
						},
					});
					console.log(
						"Mensagem enviada para Evolution API:",
						response.data
					);
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
}

module.exports = WebhookController;
