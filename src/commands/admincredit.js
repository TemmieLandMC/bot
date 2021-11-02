module.exports = {
    name: "admincredit",
    permissionRequired: 1,
    slash: true,
    opts: [
        {
            name: "view",
            description: "Узнать сколько у человека кредитов.",
            type: 1,
            options: [
                {
                    name: "member",
                    description: "Человек, которого вы хотите проверить",
                    type: 6,
                    required: true,
                },
            ],
        },
        {
            name: "give",
            description: "Дать человеку кредит",
            type: 1,
            options: [
                {
                    name: "amount",
                    description: "Сумма денег, которую вам надо дать",
                    type: 4,
                    required: true,
                },
                {
                    name: "member",
                    description: "Человек, которому выдается кредит",
                    type: 6,
                    required: true,
                },
            ],
        },
    ],
};

const { CommandInteraction } = require("discord.js");
const db = require("../database/")();

module.exports.run = async (interaction = new CommandInteraction()) => {
    const gdb = await db.guild(interaction.guildId);
    const toPay = interaction.options.getMember("member");
    const logChannel = interaction.guild.channels.cache.get(gdb.get().settings.logChannel);
    const money = gdb.get().money[toPay.id];
    if (!gdb.get().money[user.id]) return interaction.reply({
        content: "❌ Человек, которому Вы хотите передать деньги, не имеет кошелька.",
        ephemeral: true
    });
    if (!gdb.get().credits[toPay.id]) gdb.setOnObject("credits", toPay.id, 0);
    const credit = gdb.get().credits[toPay.id];

    switch (interaction.options.getSubcommand()) {
        case "view":
            if (credit == 0) return interaction.reply({ content: `❌ У человека нет задолжности.`, ephemeral: true });
            return interaction.reply({ content: `ℹ️ Задолжность ${toPay.username} - ${credit}.`, ephemeral: true });
        case "give":
            const amount = interaction.options.getInteger("amount");
            gdb.setOnObject("credits", toPay.id, credit + amount + 10);
            gdb.setOnObject("money", toPay.id, money + amount);
            logChannel.send(`✅ Кредит на ${amount} TLoв выдан игроку ${toPay}.`);
            return interaction.reply({ content: `✅ Кредит на ${amount} TLoв выдан.`, ephemeral: true });
    };
};