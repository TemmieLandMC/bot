module.exports = {
    name: "search",
    permissionRequired: 0,
    slash: true,
    opts: [
        {
            name: "query",
            description: "Что вы хотите найти",
            type: 3,
            required: true,
        },
    ]
};

const { CommandInteraction } = require("discord.js");
const axios = require("axios");

module.exports.run = async (interaction = new CommandInteraction) => {
    const query = interaction.options.getString("query");
    axios.get("https://google.com/search", { params: { "q": query } }).then(r => {
        interaction.reply("https://google.com" + r.request.path)
    })
};