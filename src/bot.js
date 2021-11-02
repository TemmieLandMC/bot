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
});

client.on("guildMemberAdd", async (member) => {
    if (member.guild.id == "900361487141441586") {
        member.roles.add(["901533889326108752", "901534707798376448", "901534105357930537"]);
        member.guild.channels.get("900361599422967828").send({
            content: `${member.user},`,
            embeds: [{
                title: `Привет!`,
                description: `> Ты попал на сервер ${member.guild.name}. На данный момент сервер ещё не открыт. Рекомендую почитать <#901138809121546310>`,
                footer: {
                    text: member.user.tag,
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

client.on("rateLimit", (rateLimitInfo) => console.warn(`${shard} Rate limited.\n${JSON.stringify(rateLimitInfo)}`));
client.login(config.token);

process.on("unhandledRejection", (rej) => console.error(rej));