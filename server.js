require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const { Api, TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");

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

// Instância do TelegramClient (mantida única durante o fluxo de autenticação)
const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
});

// Função de aguardar (em milissegundos)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Loop de autenticação sem desconectar o cliente em caso de PHONE_CODE_EXPIRED
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
        console.log("Phone code expired. Waiting 3 seconds and retrying using the same MTProto instance...");
        await sleep(3000);
        continue;
      } else {
        console.log("Unrecoverable error. Exiting.");
        process.exit(1);
      }
    }
  }
})();

// Array para armazenar novas mensagens recebidas
let newMessages = [];

// Event handler para capturar novas mensagens do Telegram
client.addEventHandler((event) => {
  const message = event.message;
  if (message) {
    const msgObj = {
      id: message.id,
      text: message.message,
      date: message.date,
    };
    console.log("New message received:", msgObj);
    newMessages.push(msgObj);
  }
}, new NewMessage({}));

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

// Endpoint para buscar mensagens do canal target com parâmetro "limit"
app.get("/get-messages", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const messages = await client.getMessages(`@${channelTarget}`, { limit });
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

// Novo endpoint para retornar as mensagens recebidas (armazenadas em memória)
app.get("/new-messages", (req, res) => {
  res.json(newMessages);
});

// Rota de health-check (opcional)
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Inicia o servidor Express
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
