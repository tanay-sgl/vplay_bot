import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let isClientReady = false;

client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}`);
  isClientReady = true;
});

async function getServerStats(guildId) {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return null;

  const memberCount = guild.memberCount;
  const channelCount = guild.channels.cache.size;
  let messageCount = 0;

  const channels = guild.channels.cache.filter((channel) => channel.type === 0);
  for (const channel of channels.values()) {
    const messages = await channel.messages.fetch({ limit: 100 });
    messageCount += messages.size;
  }

  return {
    members: memberCount,
    channels: channelCount,
    messages: messageCount,
  };
}

export default async function handler(req, res) {
  if (!isClientReady) {
    await client.login(process.env.DISCORD_TOKEN);
  }

  const { guildId, apiKey } = req.query;

  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!guildId) {
    return res.status(400).json({ error: 'Invalid guildId' });
  }

  const stats = await getServerStats(guildId);
  if (stats) {
    return res.status(200).json(stats);
  } else {
    return res.status(404).json({ error: 'Guild not found' });
  }
}