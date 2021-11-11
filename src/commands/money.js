module.exports = {
    name: "money",
    permissionRequired: 0,
    slash: true,
    opts: [
        {
            name: "view",
            description: "Узнать свой баланс",
            type: 1
        },
        {
            name: "pay",
            description: "Заплатить деньги кому-то",
            type: 1,
            options: [
                {
                    name: "member",
                    description: "Человек, которому вы хотите перевести деньги",
                    type: 6,
                    required: true
                },
                {
                    name: "amount",
                    description: "Сумма денег, которую вы хотите перевести (от 0 до 10000)",
                    type: 4,
                    required: true
                }
            ]
        }
    ]
};

const { CommandInteraction } = require("discord.js");
const db = require("../database/")();

module.exports.run = async (interaction = new CommandInteraction) => {
    const gdb = await db.guild(interaction.guildId);
    const logChannel = gdb.get().settings.logChannel;
    if (!gdb.get().money[interaction.user.id]) gdb.setOnObject("money", interaction.user.id, 0);
    const money = gdb.get().money[interaction.user.id];

    switch (interaction.options.getSubcommand()) {
        case "view":
            return interaction.reply({ content: `Ваш баланс: ${money} TLов`, ephemeral: true });
        case "pay":
            let amount = interaction.options.getInteger("amount");
            let user = interaction.options.getUser("member");
            if (interaction.user.id == user.id) return interaction.reply({ content: `❌ Вы не можете передать деньги самому себе.`, ephemeral: true });
            if (!gdb.get().money[user.id]) return interaction.reply({
                content: "❌ Человек, которому Вы хотите передать деньги, не имеет кошелька.",
                ephemeral: true
            });
            if (money < amount) return interaction.reply({ content: `❌ Недостаточно денег.`, ephemeral: true });
            if (1 > amount) return interaction.reply({ content: `❌ Число должно быть больше нуля.`, ephemeral: true });

            gdb.setOnObject("money", interaction.user.id, money - amount);
            gdb.setOnObject("money", user.id, gdb.get().money[user.id] + amount);

            if (gdb.get().notifyOff[user.id]) user.send(`⚠️ ${interaction.user.tag} перевёл вам ${amount} TLов`).catch(() => { });
            interaction.guild.channels.cache.get(logChannel).send(`✅ ${interaction.user} перевел ${amount} TLов ${user}`);
            return interaction.reply({ content: `✅ Вы перевели ${amount} TLов ${user}`, ephemeral: true, });
    };
};