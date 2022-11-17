const { ActionRowBuilder } = require('@discordjs/builders');
const { TextInputBuilder, TextInputStyle, SlashCommandBuilder, ModalBuilder, awaitMessages } = require('discord.js');

const { scoreboardScraper } = require('./scoreboard.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('scoreboard')
    .setDescription('Process scoreboard images.'),
  async execute(interaction) {
    // console.log("interaction", interaction);
    // interaction.guild is the object representing the Guild in which the command was run
    // await interaction.reply(`This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members.`);

    const modal = new ModalBuilder()
      .setCustomId('scoreboard-modal')
      .setTitle('Society Leaderboard Scraper');

    const societyName = new TextInputBuilder()
      .setCustomId('society-name-input')
      .setLabel('Society Name')
      .setStyle(TextInputStyle.Short);

    const eventName = new TextInputBuilder()
      .setCustomId('society-event-input')
      .setLabel('Event Name')
      .setStyle(TextInputStyle.Short);
    const eventDate = new TextInputBuilder()
      .setCustomId('event-date-input')
      .setLabel('Event Date')
      .setStyle(TextInputStyle.Short);

    const actionRows = [
      new ActionRowBuilder().addComponents(societyName),
      new ActionRowBuilder().addComponents(eventName),
      new ActionRowBuilder().addComponents(eventDate),
    ];

    modal.addComponents(...actionRows);

    await interaction.showModal(modal);

    const submitted = await interaction.awaitModalSubmit({
      time: 60000,
      filter: i => i.user.id === interaction.user.id
    }).catch(err => {
      console.error(err);
      return null;
    });

    if (submitted) {
      submitted.reply({
        content: "Thanks!",
        fetchReply: true
      }).then(() => {
        console.log("inside reply then");
        console.log("interaction...", interaction);
        console.log("interaction user.id", interaction.user.id);
        interaction.channel.awaitMessages({
          // filter: m => {
          //   console.log("filter check", m.author.id == interaction.user.id);
          //   return m.author.id == interaction.user.id;
          // },
          time: 30000,
          errors: ['time']
        }).then(collected => {
          console.log("collected messages", collected);

          console.log("attachments", collected.first().attachments);
          interaction.followUp('Processing images...');

          // try {
          //   if (collected.first().attachments) {

          //     const scoreboardParams = {
          //       society: interaction.fieds.getTextInputValue('society-name-input'),
          //       eventName: interaction.fieds.getTextInputValue('society-event-input'),
          //       eventDate: interaction.fieds.getTextInputValue('event-date-input'),
          //       screenShots: collected.first().attachments.map(att => att.url)
          //     };

          //     console.log("Submitting params", scoreboardParams);
          //     scoreboardScraper(scoreboardParams);
          //   }
          // } catch (e) {
          //   console.err("error in scraper", e);
          // }



        })
          .catch(err => {
            interaction.followUp('Done listening.', err);
          });
      });
    }
  }
};
