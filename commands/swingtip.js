const { SlashCommandSubcommandBuilder } = require("discord.js");


module.exports = {

  data: new SlashCommandSubcommandBuilder()
    .setName('swing-tip')
    .setDescription('Sound advice from your friendly 15 handicap.'),
  async execute(interaction) {

    await interaction.reply("I don't know.. maybe try bending your knees more?");
  }
}



