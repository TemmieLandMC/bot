module.exports = {
    name: "search",
    permissionRequired: 0,
    slash: true,
    opts: [
        {
            name: "query",
            description: "Что вы хотите найти",
            type: 3
        },
    ]
};

const { CommandInteraction } = require("discord.js");
const axios = require("axios");

module.exports.run = async (interaction = new CommandInteraction) => {
    axios.get("https://google.com/search", { params: { "q": "asd" } }).then(r => {
        interaction.reply("https://google.com" + r.request.path)
    })
};