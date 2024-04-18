const { Client, GatewayIntentBits } = require("discord.js");
const express = require('express');
const fs = require('fs');
const client = new Client({
  intents: Object.keys(GatewayIntentBits).map((a) => {
    return GatewayIntentBits[a];
  }),
});
const channelID = process.env['CHANNEL_ID'];

// Initialize an empty array to store message data in memory
let messageCollection = [];

const saveMessageToMemory = async (message) => {
  const messageData = {
    content: message.content,
    sender: message.author.username,
    pfp: message.author.displayAvatarURL(),
    time: message.createdTimestamp,
  };

  // Save message data to the messageCollection array
  messageCollection.push(messageData);

  console.log('Message saved to memory:', messageData);
};

client.on('ready', async () => {
  console.log('Bot ready');
  const announcementsChannel = client.channels.cache.get(channelID);
  const latestMessages = await announcementsChannel.messages.fetch({
    max: 100,
  });

  for (const message of latestMessages.values()) {
    if (message.mentions.everyone) {
      await saveMessageToMemory(message);
    }
  }

  announcementsChannel.messages.cache.forEach(message => {
    if (message.mentions.everyone) {
      saveMessageToMemory(message);
    }
  });

  announcementsChannel.on('messageCreate', (message) => {
    if (message.mentions.everyone) {
      saveMessageToMemory(message);
    }
  });
});

const handleEveryonePing = async (message) => {
  if (message.mentions.everyone) {
    console.log('@everyone ping detected in channel', message.channel.name);
    await saveMessageToMemory(message);
  }
};

const app = express();

app.get('/news.json', (req, res) => {
  // Send the message collection as JSON response
  res.header('Access-Control-Allow-Origin', '*');
  res.json(messageCollection);
});

app.listen(3000, () => {
  console.log('Express server running on port 3000');
});

client.login(process.env['TOKEN']);
