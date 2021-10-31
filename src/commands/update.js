module.exports = {
    name: "update",
    permissionRequired: 4,
    slash: true,
};

const { exec } = require("child_process");
const { Interaction, Client } = require("discord.js");

module.exports.run = async (interaction = new Interaction()) => {
    exec("git stash push --include-untracked");
    exec("git pull", (error, stdout) => {
        exec("git stash drop");
        if (error) return interaction.reply(`\`\`\`fix\n${error}\n\`\`\``);

        if (stdout.includes("Already up to date.")) {
            interaction.reply({
                content: "Bot already up to date. No changes since last pull.",
                ephemeral: true,
            });
        } else {
            interaction
                .reply({
                    content:
                        "Pulled from GitHub. Restarting the bot.\n\nLogs:\n```\n" +
                        stdout +
                        "\n```",
                    ephemeral: true,
                })
                .then((() => { process.exit(); exec("node --trace-warnings index.js") }));
        }
    });
};
