require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const { Api, TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");

const app = express();
const PORT = process.env.PORT || 3002;

// Variáveis do Telegram
const apiId = parseInt(process.env.TELEGRAM_API_ID.trim());
const apiHash = process.env.TELEGRAM_API_HASH.trim();
const stringSession = new StringSession(process.env.STRING_SESSION.trim());
console.log(stringSession)
const channels = process.env.CHANNELS_SOURCE.split(",");
const channelTarget = process.env.CHANNEL_TARGET;

