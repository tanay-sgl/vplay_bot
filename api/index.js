import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

let isClientReady = false;

client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}`);
  isClientReady = true;
});
async function getServerStats(guildId) {
  try {
    const guild = await client.guilds.fetch(guildId);
    if (!guild) return null;

    let memberCount;
    if (guild.memberCount !== guild.members.cache.size) {
      // If the cache doesn't have all members, fetch them
      await guild.members.fetch();
      memberCount = guild.members.cache.size;
    } else {
      memberCount = guild.memberCount;
    }

    const channelCount = guild.channels.cache.size;
    
    // Get message count (up to last 100 messages per channel)
    let messageCount = 0;
    const textChannels = guild.channels.cache.filter(channel => channel.type === 0);
    for (const channel of textChannels.values()) {
      const messages = await channel.messages.fetch({ limit: 100 });
      messageCount += messages.size;
    }

    return {
      members: memberCount,
      channels: channelCount,
      messages: messageCount,
    };
  } catch (error) {
    console.error('Error fetching server stats:', error);
    return null;
  }
}

export default async function handler(req, res) {
  // Strict API key check
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { guildId } = req.query;

  if (!guildId) {
    return res.status(400).json({ error: 'Invalid guildId' });
  }

  if (!isClientReady) {
    try {
      await client.login(process.env.DISCORD_TOKEN);
    } catch (error) {
      console.error('Failed to log in to Discord:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  try {
    const stats = await getServerStats(guildId);
    if (stats) {
      res.status(200).json(stats);
    } else {
      res.status(404).json({ error: 'Guild not found or error fetching stats' });
    }
  } catch (error) {
    console.error('Error getting server stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}