const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const fs = require("fs");

const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is running! Please visit @modijisitebot on Telegram.");
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Retrieve the Telegram bot token from the environment variable
const botToken = process.env.TELEGRAM_BOT_TOKEN;

// Create the Telegram bot instance
const bot = new TelegramBot(botToken, { polling: true });

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username;
  const welcomeMessage =
    `😇 Hello, ${username}!\n\n` +
    "Welcome to the MODIJI LINKS URL Shortener Bot!\n" +
    "You can use this bot to shorten URLs using the Modiji.site api service.\n\n" +
    "To shorten a URL, just type or paste the URL directly in the chat, and the bot will provide you with the shortened URL.\n\n" +
    "If you haven't set your Modiji Links API token yet, use the command:\n/setapi YOUR_MODIJILINKS_API_TOKEN\n\n" +
    "How To Use Me 👇👇 \n\n" +
    "✅1. Got To https://modiji.site & Complete Your Registration.\n\n" +
    "✅2. Then Copy Your API Key from here https://modiji.site/member/tools/api Copy Your API Only. \n\n" +
    "✅3. Then add your API using command /setapi \n\n" +
    "Example: /setapi c49399f821fc020161bc2a31475ec59f35ae5b4\n\n" +
    "⚠️ You must have to send link with https:// or http://\n\n" +
    "Made with ❤️ By: @DracWound";
  +"**Now, go ahead and try it out!**";

  bot.sendMessage(chatId, welcomeMessage);
});

// Command: /setapi
bot.onText(/\/setapi (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userToken = match[1].trim(); // Get the API token provided by the user

  // Save the user's MODIJI LINKS API token to the database
  saveUserToken(chatId, userToken);

  const response = `MODIJI LINKS API token set successfully. Your token: ${userToken}`;
  bot.sendMessage(chatId, response);
});

// Listen for any message (not just commands)
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  // If the message starts with "http://" or "https://", assume it's a URL and try to shorten it
  if (
    messageText &&
    (messageText.startsWith("http://") || messageText.startsWith("https://"))
  ) {
    shortenUrlAndSend(chatId, messageText);
  }
});

// Function to shorten the URL and send the result
async function shortenUrlAndSend(chatId, Url) {
  const setapi = getUserToken(chatId);

  if (!setapi) {
    bot.sendMessage(
      chatId,
      "Please provide your Modiji Links API token first. Use the command: /setapi YOUR_MODIJILINKS_API_TOKEN"
    );
    return;
  }

  try {
    const apiUrl = `https://modiji.site/api?api=${setapi}&url=${Url}`;

    const https = require('https');
    const agent = new https.Agent({ family: 4 });

    const response = await axios.get(apiUrl, {
      httpsAgent: agent,
      timeout: 10000,
      headers: {
        'User-Agent': 'TelegramBot/1.0'
      }
    });

    const shortUrl = response.data.shortenedUrl;
    bot.sendMessage(chatId, `Shortened URL: ${shortUrl}`);
  } catch (error) {
    console.error("Shorten URL Error:", error.message || error);
    bot.sendMessage(
      chatId,
      "An error occurred while shortening the URL. Please check your API token and try again."
    );
  }
}


// Function to validate the URL format
function isValidUrl(url) {
  const urlPattern = /^(|ftp|http|https):\/\/[^ "]+$/;
  return urlPattern.test(url);
}

// Function to save user's MODIJI LINKS API token to the database (Replit JSON database)
function saveUserToken(chatId, token) {
  const dbData = getDatabaseData();
  dbData[chatId] = token;
  fs.writeFileSync("database.json", JSON.stringify(dbData, null, 2));
}

// Function to retrieve user's MODIJI LINKS API token from the database
function getUserToken(chatId) {
  const dbData = getDatabaseData();
  return dbData[chatId];
}

// Function to read the database file and parse the JSON data
function getDatabaseData() {
  try {
    return JSON.parse(fs.readFileSync("database.json", "utf8"));
  } catch (error) {
    // Return an empty object if the file doesn't exist or couldn't be parsed
    return {};
  }
}
