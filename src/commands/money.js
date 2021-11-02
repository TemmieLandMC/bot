module.exports = {
    name: "money",
    permissionRequired: 0,
    slash: true,
    opts: [
        {
            name: "view",
            description: "Узнать свой баланс",
            type: 1,
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
                    required: true,
                },
                {
                    name: "amount",
                    description: "Сумма денег, которую вы хотите перевести (от 0 до 10000)",
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
    const logChannel = gdb.get().settings.logChannel;
    if (!gdb.get().money[interaction.user.id]) {
        gdb.setOnObject("money", interaction.user.id, 0);
    }
    const money = gdb.get().money[interaction.user.id];
    switch (interaction.options.getSubcommand()) {
        case "view":
            return interaction.reply({ content: `Ваш баланс: ${money} TLов`, ephemeral: true, });
        case "pay":
            let toPay = interaction.options.getInteger("amount");
            let toMember = interaction.options.getMember("member").id;
            let toMemberObj = interaction.options.getMember("member");
            if (interaction.user.id == toMember) return interaction.reply({ content: `❌ Вы не можете отправить деньги самому себе.`, ephemeral: true, });
            if (money < toPay) return interaction.reply({ content: `❌ Недостаточно денег.`, ephemeral: true, });
            if (1 > toPay) return interaction.reply({ content: `❌ Число должно быть больше нуля.`, ephemeral: true, });
            if (gdb.get().money[toMember] == undefined) return interaction.reply({ content: "❌ Человек не имеет кошелька, чтобы его зарегестрировать, необходимо написать команду **`/money view`**", ephemeral: true, });
            gdb.setOnObject("money", interaction.user.id, money - toPay);
            gdb.setOnObject("money", toMember, gdb.get().money[toMember] + toPay);
            if (gdb.get().notifyOff[toMember]) {
                toMemberObj.send(`⚠️ ${interaction.user.username}#${interaction.user.discriminator} перевёл вам ${toPay} TLов`).catch((err) => { error = ` ⚠️ Сообщение не было отправлено: ${toMemberObj.toString()}(${toMember}) ${err.toString()}`; interaction.guild.channels.cache.get(logChannel).send(error) })
            }
            interaction.guild.channels.cache.get(logChannel).send(`✅ ${interaction.user.toString()} перевел ${toPay} TLов ${toMemberObj.toString()}` + global.error).catch((err) => { console.warn(err) })
            return interaction.reply({ content: `✅ Вы перевели ${toPay} TLов ${toMemberObj.toString()}`, ephemeral: true, });
    }
}