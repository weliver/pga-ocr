const { SlashCommandSubcommandBuilder } = require("discord.js");


module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName('ping')
    .setDescription('Replies with pong!'),
  async execute(interaction) {

    await interaction.reply("Thanks!");

    // await interaction.reply('Pong!');


  }
}



