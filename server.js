require("dotenv").config();


// Variáveis do Telegram
const apiId = parseInt(process.env.TELEGRAM_API_ID.trim());
const apiHash = process.env.TELEGRAM_API_HASH.trim();
const stringSession = new StringSession(process.env.STRING_SESSION.trim());
console.log(stringSession)
const channels = process.env.CHANNELS_SOURCE.split(",");
const channelTarget = process.env.CHANNEL_TARGET;

