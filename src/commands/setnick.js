module.exports = {
    name: "setnick",
    permissionRequired: 4,
    slash: true,
    opts: [
        {
            name: "member",
            description: "Человек, которому надо установить ник",
            type: 6,
            required: true
        },
        {
            name: "nick",
            description: "ник, который вы хотите установить",
            type: 3,
            required: true
        }
    ]
};

const { CommandInteraction } = require("discord.js");
const db = require("../database/")();

module.exports.run = async (interaction) => {
    if (!(interaction instanceof CommandInteraction)) return;
    const gdb = db.global;
    const user = interaction.options.getUser("member");
    const nick = interaction.options.getString("nick");
    const member = await interaction.guild.members.fetch(user.id);

    gdb.setOnObject("nicknames", user.id, nick);
    await member.setNickname(member.displayName.substring(0, 29 - nick.length) + ` | ${nick}`).catch(() => { });
    interaction.reply(`set \`${user.id}\` on object \`nicknames\` with data \`${nick}\``);
};