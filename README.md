# VPlay Dev Bot - Discord Server Stats API

This project provides a simple API to fetch statistics for a Discord server using a Discord bot.

## API Endpoint

`GET https://vplay-bot.vercel.app/api/stats`

## Query Parameters

- `guildId`: The ID of the Discord server (guild) you want to fetch stats for.

## Headers

- `X-API-Key`: Your API key for authentication.


## Response

On success, the API returns a JSON object with the following structure:

```json
{
  "members": 100,
  "channels": 10,
  "messages": 1000
}