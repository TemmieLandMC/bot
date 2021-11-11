module.exports = {
    name: "adminmoney",
    permissionRequired: 1,
    slash: true,
    opts: [
        {
            name: "view",
            description: "Узнать чей-то баланс",
            type: 1,
            options: [
                {
                    name: "member",
                    description: "Человек, баланс которого вы хотите узнать",
                    type: 6,
                    required: true
                }
            ]
        },
        {
            name: "add",
            description: "Добавить деньги кому-то",
            type: 1,
            options: [
                {
                    name: "member",
                    description: "Человек, которому вы хотите добавить деньги",
                    type: 6,
                    required: true
                },
                {
                    name: "amount",
                    description: "Сумма денег, которую вы хотите добавить (от 0 до 10000)",
                    type: 4,
                    required: true
                }
            ]
        }
    ]
};

const { CommandInteraction } = require("discord.js");
const db = require("../database/")();

module.exports.run = async (interaction = new CommandInteraction()) => {
    const gdb = await db.guild(interaction.guildId);

    switch (interaction.options.getSubcommand()) {
        case "view":
            let toMemberID = interaction.options.getMember("member").id;
            let money = gdb.get().money[toMemberID];
            if (!gdb.get().money[toMemberID]) return interaction.reply({ content: "❌ Человек не имеет кошелька, чтобы его зарегестрировать, необходимо написать команду **`/money view`**", ephemeral: true, });
            return interaction.reply({ content: `Баланс <@${toMemberID}>: ${money} TLов`, ephemeral: true, });
        case "add":
            let toPay = interaction.options.getInteger("amount");
            let toMember = interaction.options.getMember("member").id;
            let toMemberObj = interaction.options.getMember("member");
            if (!gdb.get().money[toMember]) return interaction.reply({ content: "❌ Человек не имеет кошелька, чтобы его зарегестрировать, необходимо написать команду **`/money view`**", ephemeral: true, });
            gdb.setOnObject("money", toMember, gdb.get().money[toMember] + toPay);
            return interaction.reply({ content: `✅ Вы добавили ${toPay} TLов ${toMemberObj}`, ephemeral: true });
    };
};