// WhatsappController.js
const fs = require("fs");
const path = require("path");

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
}

module.exports = WhatsappController;