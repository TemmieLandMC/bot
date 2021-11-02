module.exports = {
    name: "credit",
    permissionRequired: 0,
    slash: true,
    opts: [
        {
            name: "view",
            description: "Узнать сколько у вас кредитов",
            type: 1,
        },
        {
            name: "take",
            description: "Оформить заявку на кредит",
            type: 1,
            options: [
                {
                    name: "amount",
                    description: "Сумма денег, которую вы хотите взять",
                    type: 4,
                    required: true,
                },
            ],
        },
        {
            name: "pay",
            description: "Выплатить проценты за кредит",
            type: 1,
            options: [
                {
                    name: "amount",
                    description: "Сумма денег, которую вы хотите выплатить",
                    type: 4,
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
    const logChannel = interaction.guild.channels.cache.get(gdb.get().settings.logChannel);
    const money = gdb.get().money[interaction.user.id]
    if (gdb.get().credits[interaction.user.id] == undefined) {
        gdb.setOnObject("credits", interaction.user.id, 0)
    }
    const credit = gdb.get().credits[interaction.user.id]
    if (money == undefined || money == null) return interaction.reply({ content: `❌ У вас нет кошелька.`, ephemeral: true, });
    switch (interaction.options.getSubcommand()) {
        case "view":
            if (credit == 0) return interaction.reply({ content: `❌ У вас нет задолжности.`, ephemeral: true, });
            return interaction.reply({ content: `ℹ️ Задолжность ${interaction.user.username} - ${credit}.`, ephemeral: true, });
        case "take":
            const amount = interaction.options.getInteger("amount");
            if (credit != 0) return interaction.reply({ content: `❌ Вы уже взяли кредит, обратитесь в банк, чтобы взять еще один.`, ephemeral: true, });
            if ((money * 10) < amount || amount > 1000) return interaction.reply({ content: `❌ Слишком большая сумма, чтобы получить кредит, обратитесь в банк.`, ephemeral: true, });
            gdb.setOnObject("credits", interaction.user.id, credit + amount + 10);
            gdb.setOnObject("money", interaction.user.id, money + amount);
            logChannel.send(`✅ Кредит на ${amount} TLoв выдан игроку ${interaction.user.toString()}.`)
            return interaction.reply({ content: `✅ Кредит на ${amount} TLoв одобрен.`, ephemeral: true, });
        case "pay":
            const amountq = interaction.options.getInteger("amount");
            if (credit == 0) return interaction.reply({ content: `❌ У вас нет задолжности.`, ephemeral: true, });
            if (amountq > credit) return interaction.reply({ content: `❌ Кол-во денег, которое вы хотите выплатить больше, чем ваша задолжность.`, ephemeral: true, });
            if (amountq > money) return interaction.reply({ content: `❌ Кол-во денег, которое вы хотите выплатить больше, чем ваш баланс.`, ephemeral: true, });
            logChannel.send(`✅ ${interaction.user.toString()} выплатил ${amountq}.`)
            gdb.setOnObject("credits", interaction.user.id, credit - amountq);
            gdb.setOnObject("money", interaction.user.id, money - amountq);
            return interaction.reply({ content: `✅ Вы выплатили ${amountq} TLoв, вам осталось заплатить ${gdb.get().credits[interaction.user.id]} TLoв.`, ephemeral: true, });
    }
}