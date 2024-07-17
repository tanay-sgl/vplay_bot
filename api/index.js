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
    if (!guild) {
      return null;
    }

    const channelCount = guild.channels.cache.size;

    let recentMessageCount = 0;
    let accessibleChannels = 0;
    const textChannels = guild.channels.cache.filter(channel => channel.type === 0);
    for (const channel of textChannels.values()) {
      try {
        const messages = await channel.messages.fetch({ limit: 100 });
        recentMessageCount += messages.size;
        accessibleChannels++;
      } catch (error) {
        console.log(`Couldn't access messages in channel ${channel.name}: ${error.message}`);
        // Continue to the next channel
      }
    }
 
    const stats = {
      members: guild.memberCount,
      totalChannels: channelCount,
      accessibleTextChannels: accessibleChannels,
      totalTextChannels: textChannels.size,
      recentMessages: recentMessageCount
    };

    return stats;
  } catch (error) {
   
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
    res.status(500).json({ error: 'Internal server error' });
  }
}