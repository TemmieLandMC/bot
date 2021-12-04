module.exports = {
    name: "update",
    permissionRequired: 4,
    slash: true
};

const { exec } = require("child_process");
const { CommandInteraction } = require("discord.js");

module.exports.run = async (interaction = new CommandInteraction) => {
    exec("git stash push --include-untracked");
    exec("git pull", (error, stdout) => {
        exec("git stash drop");
        if (error) return interaction.reply({
            content: `\`\`\`fix\n${error}\n\`\`\``, "components": [
                {
                    type: 2,
                    emoji: {
                        name: "🗑"
                    },
                    style: 4,
                    custom_id: "reply:delete"
                }
            ]
        });

        if (stdout.includes("Already up to date.")) {
            interaction.reply({
                content: "Bot already up to date. No changes since last pull.",
                "components": [
                    {
                        type: 2,
                        emoji: {
                            name: "🗑"
                        },
                        style: 4,
                        custom_id: "reply:delete"
                    }
                ]
            });
        } else {
            interaction.reply({
                content: "Pulled from GitHub. Restarting the bot.\n\nLogs:\n```\n" + stdout + "\n```"
            }).then(() => process.exit());
        };
    });
};
