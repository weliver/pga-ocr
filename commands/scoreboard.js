const path = require('node:path');
const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');

const { scoreboardScraper } = require('../scoreboard-scraper.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('scoreboard')
    .setDescription('Process scoreboard images.')
    .addStringOption(option =>
      option
        .setName('eventname')
        .setDescription('name of society event')
    ),
  async execute(interaction) {

    const eventName = interaction.options.getString('eventname') ?? 'society-event';

    await interaction.reply({
      content: `Upload image(s) for ${eventName}`,
      fetchReply: true
    }).then(() => {
      console.log("inside reply then");
      interaction.channel.awaitMessages({
        filter: m => {
          return true;
        },
        max: 1,
        time: 40000,
        errors: ['time']
      }).then(async collected => {
        // console.log("collected messages", collected);

        console.log("collected attachments", collected.first().attachments);

        interaction.followUp('Processing message...');

        try {
          if (collected.first().attachments) {

            const scoreboardParams = {
              eventName: eventName,
              screenshots: collected.first().attachments.map(att => att.url)
            };
            await scoreboardScraper(scoreboardParams).then(res => {
              if (res) {
                const file = new AttachmentBuilder(path.join('public', 'csv', res));
                interaction.channel.send({ files: [file] });
              }
            });
          }
        } catch (e) {
          console.error("Error submitting uploads to scraper.", e);
        }
      })
        .catch(err => {
          console.error("No responses registered", err);
          interaction.followUp('Timeout after 40 seconds: I stopped checking for images. Please try again.', err);
        });
    });
  }
};
