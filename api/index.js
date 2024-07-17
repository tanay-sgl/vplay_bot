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
    console.log(`Fetching stats for guild ID: ${guildId}`);
    const guild = await client.guilds.fetch(guildId);
    if (!guild) {
      console.log('Guild not found');
      return null;
    }

    console.log(`Guild found: ${guild.name}`);
    console.log(`Member count: ${guild.memberCount}`);

    const channelCount = guild.channels.cache.size;
    console.log(`Total channel count: ${channelCount}`);
    
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
    console.log(`Recent message count (up to last 100 per accessible channel): ${recentMessageCount}`);
    console.log(`Accessible channels: ${accessibleChannels}/${textChannels.size}`);

    const stats = {
      members: guild.memberCount,
      totalChannels: channelCount,
      accessibleTextChannels: accessibleChannels,
      totalTextChannels: textChannels.size,
      recentMessages: recentMessageCount
    };
    console.log('Final stats:', stats);
    return stats;
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
    console.log('Stats returned from getServerStats:', stats);
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