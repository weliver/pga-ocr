const path = require('node:path');
const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');

const { leaderboardScraper } = require('../leaderboard-scraper.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Process leaderboard images.')
    .addStringOption(option =>
      option
        .setName('eventname')
        .setDescription('Something nice and descriptive for your records.')
    ),
  async execute(interaction) {

    const eventName = interaction.options.getString('eventname') ?? 'society-event';

    await interaction.reply({
      content: `Upload image(s) for ${eventName}`,
      fetchReply: true
    }).then(() => {
      interaction.channel.awaitMessages({
        filter: m => m.author.id === interaction.user.id,
        max: 1,
        time: 40000,
        errors: ['time']
      }).then(collected => {
        try {
          if (collected.first().attachments.size > 0) {
            interaction.followUp('Woot! Hang tight while I process your screenshots...');

            const params = {
              eventName: eventName,
              screenshots: collected.first().attachments.map(att => att.url)
            };

            leaderboardScraper(params).then(res => {
              if (res) {
                const file = new AttachmentBuilder(path.join('public', 'csv', res));
                interaction.channel.send({ files: [file] });
              } else {
                interaction.followUp("Well that's awkward... I don't have a .csv for you :-/ Sorry! I'll have macgreg0r check it out.")
              }
            });
          } else {
            interaction.followUp("Hmm, I need images to scrape. Words are so boring!");
          }
        } catch (e) {
          interaction.followUp("Error :( Something broke while scraping these images. I'll ping macgreg0r to take a look.", e);
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
