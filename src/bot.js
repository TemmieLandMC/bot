require("nodejs-better-console").overrideConsole();
const Discord = require("discord.js");
const config = require("../config");
const commandHandler = require("./handlers/commands");
const slashHandler = require("./handlers/interactions/");
const client = new Discord.Client({
    intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MEMBERS"],
    presence: {
        status: "dnd",
        activity: {
            type: "WATCHING",
            name: "загрузочный экран",
        }
    }
});
const db = require("./database/")();
const { deleteMessage } = require("./handlers/utils");
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

    await db.cacheGuilds(disabledGuilds);
    console.log(`${shard} All ${disabledGuilds.size} guilds have been cached. [${Date.now() - guildCachingStart}ms]`);

    disabledGuilds.size = 0;

    slashHandler(client);

    client.loading = false;

    await require("./handlers/interactions/slash").registerCommands(client);
    console.log(`${shard} Refreshed slash commands.`);

    await updatePresence();
    setInterval(updatePresence, 10 * 60 * 1000); // 10 minutes
});

client.on("messageCreate", async (message) => {
    if (
        !message.guild ||
        message.author.bot
    ) return;

    const gdb = await db.guild(message.guild.id);

    global.gdb = gdb;
    global.gldb = db.global;
    if (message.content.startsWith(config.prefix) || message.content.match(`^<@!?${client.user.id}> `)) return commandHandler(message, config.prefix, gdb, db);
    if (message.content.match(`^<@!?${client.user.id}>`)) return message.react("👋").catch(() => { });
});

client.on("guildMemberAdd", async (member) => {
    if (member.guild.id == "900361487141441586") {
        member.roles.add(["901533889326108752", "901534707798376448", "901534105357930537"]);
        member.guild.channels.get("900361599422967828").send({
            content: `${member.user.toString()},`,
            embeds: [{
                title: `Приветствую, ${member.user.username}`,
                description: `Ты попал на сервер ${member.guild}. Он пока еще не открыт, рекомендую почитать информацию о нем в <#901138809121546310>`,
                timestamp: new Date(),
                footer: {
                    text: `${member.user.username}`,
                    icon_url: member.user.avatarURL(),
                },
            }]
        });
    };
});

const updatePresence = async () => {
    return client.user.setPresence({
        status: "online",
        activities: [{ type: "WATCHING", name: "TemmieLand" }],
    });
};

client.on("error", (err) => console.error(`${shard} Client error.${err}`));
client.on("rateLimit", (rateLimitInfo) => console.warn(`${shard} Rate limited.\n${JSON.stringify(rateLimitInfo)}`));
client.on("shardDisconnected", (closeEvent) => console.warn(`${shard} Disconnected.${closeEvent}`));
client.on("shardError", (err) => console.error(`${shard} Error.${err}`));
client.on("shardReconnecting", () => console.log(`${shard} Reconnecting.`));
client.on("shardResume", (_, replayedEvents) => console.log(`${shard} Resumed.${replayedEvents} replayed events.`));
client.on("warn", (info) => console.warn(`${shard} Warning.${info}`));
client.login(config.token);

process.on("unhandledRejection", (rej) => console.error(rej));