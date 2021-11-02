module.exports = {
    name: "admincredit",
    permissionRequired: 0,
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
const { getPermissionLevel } = require("../constants")

module.exports.run = async (interaction = new CommandInteraction()) => {
    const gdb = await db.guild(interaction.guildId);
    const toPay = interaction.options.getMember("member")
    const bankRole = gdb.get().settings.bankRole;
    const logChannel = interaction.guild.channels.cache.get(gdb.get().settings.logChannel);
    if (interaction.member.roles.cache.has(bankRole) || getPermissionLevel(interaction.member) > 0) {
        const money = gdb.get().money[toPay.id]
        if (gdb.get().credits[toPay.id] == undefined) {
            gdb.setOnObject("credits", toPay.id, 0)
        }
        const credit = gdb.get().credits[toPay.id]
        if (money == undefined || money == null) return interaction.reply({ content: "❌ Человек не имеет кошелька, чтобы его зарегестрировать, необходимо написать команду **`/money view`**", ephemeral: true, });
        switch (interaction.options.getSubcommand()) {
            case "view":
                if (credit == 0) return interaction.reply({ content: `❌ У человека нет задолжности.`, ephemeral: true, });
                return interaction.reply({ content: `ℹ️ Задолжность ${toPay.username} - ${credit}.`, ephemeral: true, });
            case "give":
                const amount = interaction.options.getInteger("amount")
                gdb.setOnObject("credits", toPay.id, credit + amount + 10);
                gdb.setOnObject("money", toPay.id, money + amount);
                logChannel.send(`✅ Кредит на ${amount} TLoв выдан игроку ${toPay.toString()}.`)
                return interaction.reply({ content: `✅ Кредит на ${amount} TLoв выдан.`, ephemeral: true, });
        }
    } return await interaction.reply({ content: "❌ Недостаточно прав.", ephemeral: true, });
}