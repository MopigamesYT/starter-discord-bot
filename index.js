const { Client, GatewayIntentBits } = require("discord.js");
const express = require('express');
const fs = require('fs');
const client = new Client({
  intents: Object.keys(GatewayIntentBits).map((a) => {
    return GatewayIntentBits[a];
  }),
});
const channelID = process.env['CHANNEL_ID'];

const saveMessageToJSON = async (message) => {
  const messageData = {
    content: message.content,
    sender: message.author.username,
    pfp: message.author.displayAvatarURL(),
    time: message.createdTimestamp,
  };

  try {
    const fs = require('fs');
    fs.writeFileSync('news.json', JSON.stringify([messageData], null, 2));
  } catch (error) {
    console.error('Error saving message to JSON file:', error);
  }
};

const handleEveryonePing = async (message) => {
  if (message.mentions.everyone) {
    console.log('@everyone ping detected in channel', message.channel.name);
    await saveMessageToJSON(message);
  }
};

client.on('ready', async () => {
  console.log('Bot ready');
  const announcementsChannel = client.channels.cache.get(channelID);
  const latestMessages = await announcementsChannel.messages.fetch({
    max: 100,
  });

  for (const message of latestMessages.values()) {
    if (message.mentions.everyone) {
      await handleEveryonePing(message);
      break;
    }
  }

  const collector = announcementsChannel.createMessageCollector({
    filter: (message) => message.mentions.everyone,
  });

  collector.on('collect', (message) => handleEveryonePing(message));
});

const app = express();
app.get('/news.json', (req, res) => {
  const newsData = fs.readFileSync('news.json');
  res.header('Access-Control-Allow-Origin', '*');
  res.json(JSON.parse(newsData));
});
app.listen(3000, () => {
  console.log('Express server running on port 3000');
});

client.login(process.env['TOKEN']);