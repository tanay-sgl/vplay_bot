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
    console.log(`Initial member count: ${guild.memberCount}`);

    let memberCount = guild.memberCount;
    if (guild.memberCount !== guild.members.cache.size) {
      console.log('Member cache incomplete, fetching members...');
      try {
        await guild.members.fetch();
        memberCount = guild.members.cache.size;
        console.log(`Updated member count after fetch: ${memberCount}`);
      } catch (fetchError) {
        console.error('Error fetching members:', fetchError);
        // Fallback to the initial count if fetch fails
      }
    }

    const channelCount = guild.channels.cache.size;
    console.log(`Channel count: ${channelCount}`);
    
    let messageCount = 0;
    const textChannels = guild.channels.cache.filter(channel => channel.type === 0);
    for (const channel of textChannels.values()) {
      const messages = await channel.messages.fetch({ limit: 100 });
      messageCount += messages.size;
    }
    console.log(`Message count (last 100 per channel): ${messageCount}`);

    const stats = {
      members: memberCount,
      channels: channelCount,
      messages: messageCount,
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

  console.log('Received request:', req.method, req.url);
  console.log('Headers:', req.headers);
  console.log('Query:', req.query);

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