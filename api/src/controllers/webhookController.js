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
			const instance = process.env.INSTANCE
			const apiKey = process.env.AUTHENTICATION_API_KEY;
			const evolutionApiUrl = `${this.evolutionApiUrl}/message/sendText/${instance}`;

			const text = "Webhook recebido, mensagem enviada com sucesso!";
			const data = {
				number: process.env.TEST_PHONE, //req.body.data.number,
				text: text,
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
