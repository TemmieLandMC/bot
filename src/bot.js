require("nodejs-better-console").overrideConsole();
const Discord = require("discord.js");
const config = require("../config");
const commandHandler = require("./handlers/commands");
const slashHandler = require("./handlers/interactions/");
const client = new Discord.Client({
    makeCache: Discord.Options.cacheWithLimits({
        BaseGuildEmojiManager: 0,
        GuildStickerManager: 0,
        GuildInviteManager: 0,
        GuildEmojiManager: 0,
        GuildBanManager: {
            sweepInterval: 10,
            sweepFilter: Discord.LimitedCollection.filterByLifetime({
                lifetime: 5
            })
        },
        MessageManager: {
            sweepInterval: 60,
            maxSize: 100,
            keepOverLimit: (message) => message.author.id != message.client.user.id,
            sweepFilter: Discord.LimitedCollection.filterByLifetime({
                lifetime: 300
            })
        }
    }),
    intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MEMBERS", "GUILD_PRESENCES", "GUILD_BANS"],
    presence: {
        status: "dnd",
        activity: {
            type: "WATCHING",
            name: "загрузочный экран",
        }
    }
});
const db = require("./database/")();
const { deleteMessage, checkMutes, checkBans } = require("./handlers/utils");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const rest = new REST({ version: "9" }).setToken(config.token);
require("discord-logs")(client);

global.sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
global.msToTime = require("./constants/").msToTime;
global.parse = require("./constants/").parseTime;
module.exports.client = client;
global.delMsg = deleteMessage;
global.client = client;
global.db = db;

let shard = "[Shard N/A]";

client.once("shardReady", async (shardId, unavailable = new Set()) => {
    client.shardId = shardId;
    shard = `[Shard ${shardId}]`;
    console.log(`${shard} Ready as ${client.user.tag}! Caching guilds.`);

    client.loading = true;

    let disabledGuilds = new Set([...Array.from(unavailable), ...client.guilds.cache.map((guild) => guild.id)]);
    let guildCachingStart = Date.now();

    await db.cacheGSets(disabledGuilds);
    await db.cacheGuilds(disabledGuilds);
    console.log(`${shard} All ${disabledGuilds.size} guilds have been cached. [${Date.now() - guildCachingStart}ms]`);

    disabledGuilds.size = 0;

    slashHandler(client);

    client.loading = false;

    await require("./handlers/interactions/slash").registerCommands(client);
    console.log(`${shard} Refreshed slash commands.`);

    await updatePresence();
    setInterval(updatePresence, 10 * 60 * 1000); // 10 minutes

    await checkMutes(client);
    setInterval(() => checkMutes(client), 3 * 1000); // 3 seconds

    await checkBans(client);
    setInterval(() => checkBans(client), 5 * 1000); // 5 seconds
});

client.on("messageCreate", async (message) => {
    if (
        !message.guild ||
        message.author.bot
    ) return;

    const gdb = await db.guild(message.guild.id);
    const gsdb = await db.settings(message.guild.id);

    if (gdb.get().mutes[message.author.id] && gsdb.get().delMuted) return deleteMessage(message);
    if (gdb.get().mutes[message.author.id]) return;

    global.gdb = gdb;
    global.gsdb = gsdb;
    global.gldb = db.global;
    if (message.content.startsWith(config.prefix) || message.content.match(`^<@!?${client.user.id}> `)) return commandHandler(message, config.prefix, gdb, db);
    if (message.content.match(`^<@!?${client.user.id}>`)) return message.react("👋").catch(() => { });
});

client.on("guildMemberAdd", async (member) => {
    if (member.guild.id == "900361487141441586") {
        member.roles.add("901533889326108752");
        member.roles.add("901534105357930537");
        member.roles.add("901534707798376448"); //asd
        member.guild.channels.get("900361599422967828").send({
            content: ``,
            embeds: [{
                title: `Приветствую, ${member.user.username}`,
                description: `Ты попал на сервер ${member.guild}. Он пока еще не открыт, рекомендую почитать информацию о нем в <#901138809121546310>`,
                timestamp: new Date(),
                footer: `{ text: ${member.user.username}`,
                icon_url: member.user.avatarURL()
            }]
        })
    })

const updatePresence = async () => {
    const gc = await client.shard.broadcastEval(bot => bot.guilds.cache.size).then(res => res.reduce((prev, cur) => prev + cur, 0));
    let name = `TemmieLand`;
    return client.user.setPresence({
        status: "online",
        activities: [{ type: "WATCHING", name }],
    });
};

client.on("error", (err) => console.error(`${shard} Client error. ${err}`));
client.on("rateLimit", (rateLimitInfo) => console.warn(`${shard} Rate limited.\n${JSON.stringify(rateLimitInfo)}`));
client.on("shardDisconnected", (closeEvent) => console.warn(`${shard} Disconnected. ${closeEvent}`));
client.on("shardError", (err) => console.error(`${shard} Error. ${err}`));
client.on("shardReconnecting", () => console.log(`${shard} Reconnecting.`));
client.on("shardResume", (_, replayedEvents) => console.log(`${shard} Resumed. ${replayedEvents} replayed events.`));
client.on("warn", (info) => console.warn(`${shard} Warning. ${info}`));
client.login(config.token);

process.on("unhandledRejection", (rej) => console.error(rej.stack));