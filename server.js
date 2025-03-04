require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const { Api, TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware para parse de JSON
app.use(bodyParser.json());

// Middleware de autenticação (Token simples via Header)
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.AUTH_TOKEN}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

app.use(authenticate);

// Variáveis do Telegram
const apiId = parseInt(process.env.TELEGRAM_API_ID.trim());
const apiHash = process.env.TELEGRAM_API_HASH.trim();
const stringSession = new StringSession(process.env.STRING_SESSION.trim());
const channels = process.env.CHANNELS_SOURCE.split(",");
const channelTarget = process.env.CHANNEL_TARGET;

// Instância do TelegramClient
const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
});

// Função para aguardar um tempo (em milissegundos)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Loop de autenticação com tratamento para PHONE_CODE_EXPIRED
(async () => {
  console.log("Starting Telegram client...");
  let authenticated = false;
  while (!authenticated) {
    try {
      await client.start({
        phoneNumber: async () => await require("input").text("number ? "),
        password: async () => await require("input").text("password? "),
        phoneCode: async () => await require("input").text("Code ? "),
        onError: (err) => {
          console.error("Error during authentication:", err.message);
        },
      });
      authenticated = true;
      console.log("Telegram client connected.");
      console.log("String session:", client.session.save());
    } catch (error) {
      console.error("Authentication error:", error.message);
      if (error.message.includes("PHONE_CODE_EXPIRED")) {
        console.log("Phone code expired. Disconnecting, waiting 3 seconds, and requesting a new code...");
        // Desconecta para limpar o estado
        await client.disconnect();
        // Aguarda 3 segundos
        await sleep(3000);
        // O loop continuará e chamará client.start() novamente, o que reenvia o código
        continue;
      } else {
        console.log("Authentication failed with an unrecoverable error. Exiting.");
        process.exit(1);
      }
    }
  }
})();

// Endpoint para retornar a string_session
app.get("/session", (req, res) => {
  try {
    const currentSession = client.session.save();
    res.json({ stringSession: currentSession });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para enviar mensagem para o canal target
app.post("/send-message", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message text is required" });
    }
    const sentMessage = await client.sendMessage(`@${channelTarget}`, {
      message: message,
      parseMode: "html",
    });
    res.json({ success: true, messageId: sentMessage.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para editar uma mensagem existente
app.put("/edit-message", async (req, res) => {
  try {
    const { messageId, newText } = req.body;
    if (!messageId || !newText) {
      return res.status(400).json({ error: "Message ID and new text are required" });
    }
    await client.editMessage(`@${channelTarget}`, {
      message: messageId,
      text: newText,
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para buscar as 10 mensagens mais recentes do canal target
app.get("/get-messages", async (req, res) => {
  try {
    const messages = await client.getMessages(`@${channelTarget}`, { limit: 10 });
    res.json(
      messages.map((msg) => ({
        id: msg.id,
        text: msg.message,
        date: msg.date,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota de health-check (opcional)
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Inicia o servidor Express
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
