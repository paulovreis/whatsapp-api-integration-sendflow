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
			// Ajuste para enviar para a rota /message/sendText/Teste
			const instance = process.env.INSTANCE;
			const apiKey = process.env.AUTHENTICATION_API_KEY;
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

			const response = await axios.post(evolutionApiUrl, data, {
				headers: {
					apikey: apiKey,
					"Content-Type": "application/json",
				},
			});
			console.log(
				"Webhook received and forwarded to Evolution API:",
				response.data
			);
			res.status(200).json({ success: true, result: response.data });
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
