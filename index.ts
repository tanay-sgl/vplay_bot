import { Client, GatewayIntentBits, TextChannel } from 'discord.js';

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

async function getServerStats(guildId: string) {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return null;

  const memberCount = guild.memberCount;
  const channelCount = guild.channels.cache.size;
  let messageCount = 0;

  const channels = guild.channels.cache.filter((channel) => channel.type === 0) as Map<string, TextChannel>;
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

const port = process.env.PORT || 3000;

export default {
  port,
  async fetch(req: Request) {
    if (!isClientReady) {
      await client.login(process.env.DISCORD_TOKEN);
    }

    const url = new URL(req.url);
    const guildId = url.searchParams.get('guildId');
    const apiKey = url.searchParams.get('apiKey');

    if (apiKey !== process.env.API_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    if (!guildId) {
      return new Response(JSON.stringify({ error: 'Invalid guildId' }), { status: 400 });
    }

    const stats = await getServerStats(guildId);
    if (stats) {
      return new Response(JSON.stringify(stats));
    } else {
      return new Response(JSON.stringify({ error: 'Guild not found' }), { status: 404 });
    }
  },
};

console.log(`Server ready to handle requests on port ${port}`);