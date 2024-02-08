
const { Client, IntentsBitField } = require('discord.js');
const Openai = require('openai');
require('dotenv/config');
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
  ],
});

client.on('ready', () => {
  console.log('The bot is online!');
});

const openai = new Openai({
  apiKey: process.env.API_KEY,
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channelId !== process.env.CHANNEL_ID) return;
  if (message.content.startsWith('!')) return;

  let conversationLog = [
    { role: 'system', content: 'You are a friendly chatbot.' },
  ];

  try {
    await message.channel.sendTyping();
    let prevMessages = await message.channel.messages.fetch({ limit: 15 });
    prevMessages = prevMessages.reverse();
    
    prevMessages.forEach((msg) => {
      if (msg.content.startsWith('!')) return;
      if (msg.author.id !== client.user.id && message.author.bot) return;
      if (msg.author.id === client.user.id) {
        conversationLog.push({
          role: 'assistant',
          content: msg.content,
          name: msg.author.username
            .replace(/\s+/g, '_')
            .replace(/[^\w\s]/gi, ''),
        });
      }

      if (msg.author.id === message.author.id) {
        conversationLog.push({
          role: 'user',
          content: msg.content,
          name: message.author.username
            .replace(/\s+/g, '_')
            .replace(/[^\w\s]/gi, ''),
        });
      }
    });

    const result = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-instruct',
      messages: conversationLog,
      max_tokens: 150,
    });

    message.reply(result.data.choices[0].text);
  } catch (error) {
    console.log(`ERR: ${error}`);
  }
});

client.login(process.env.TOKEN);

