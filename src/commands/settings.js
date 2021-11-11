module.exports = {
    name: "settings",
    permissionRequired: 0,
    opts: [
        {
            name: "get",
            description: "Получить ваши настройки.",
            type: 1
        },
        {
            name: "toggle",
            description: "Изменить значение найстройки.",
            type: 1,
            options: [
                {
                    name: "setting",
                    description: "Настройка, которую надо изменить.",
                    type: 3,
                    required: true,
                    choices: [
                        {
                            name: "Получение уведомлений о переводе денег.",
                            value: "notifyOff"
                        }
                    ]
                }
            ]
        }
    ],
    slash: true
};

const { CommandInteraction } = require("discord.js");
const db = require("../database/")();

module.exports.run = async (interaction = new CommandInteraction) => {
    const gdb = await db.guild(interaction.guild.id);
    switch (interaction.options.getSubcommand()) {
        case "get":
            return await interaction.reply({
                embeds: [
                    {
                        title: "Настройки " + interaction.user.username,
                        timestamp: Date.now(),
                        fields: [
                            {
                                name: "Получение уведомлений при переводе денег.",
                                value: gdb.get().notifyOff[interaction.user.id] ?
                                    "**`Включено`**" :
                                    "**`Выключено`**",
                                inline: true
                            }
                        ]
                    }
                ]
            });
        case "toggle":
            let idk = "";
            if (interaction.options.getString("setting") == "notifyOff") {
                gdb.get().notifyOff[interaction.user.id] ?
                    (() => {
                        gdb.setOnObject("notifyOff", interaction.user.id, false);
                        idk = "**`Получение уведомлений при переводе денег`** было выключено.";
                    })() :
                    (() => {
                        gdb.setOnObject("notifyOff", interaction.user.id, true);
                        idk = "**`Получение уведомлений при переводе денег`** былo включено.";
                    })();
            };
            return interaction.reply(idk);
    };
};
