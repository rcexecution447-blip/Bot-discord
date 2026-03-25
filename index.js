require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    PermissionsBitField,
    EmbedBuilder,
    SlashCommandBuilder,
    REST,
    Routes
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages
    ],
    partials: [Partials.Channel]
});

const commands = [
    new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Verifikasi member'),

    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban member')
        .addUserOption(opt => opt.setName('user').setDescription('Target').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Alasan')),

    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick member')
        .addUserOption(opt => opt.setName('user').setDescription('Target').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Alasan')),

    new SlashCommandBuilder()
        .setName('report')
        .setDescription('Report scammer')
        .addUserOption(opt => opt.setName('user').setDescription('Scammer').setRequired(true))
        .addStringOption(opt => opt.setName('bukti').setDescription('Bukti / alasan').setRequired(true))
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// REGISTER COMMAND
(async () => {
    try {
        console.log('Registering commands...');
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );
        console.log('Commands ready!');
    } catch (err) {
        console.error(err);
    }
})();

client.on('ready', () => {
    console.log(`Bot aktif sebagai ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    // VERIFY
    if (commandName === 'verify') {
        const role = interaction.guild.roles.cache.find(r => r.name === "Verified");

        if (!role) return interaction.reply({ content: "Role 'Verified' tidak ada!", ephemeral: true });

        await interaction.member.roles.add(role);
        interaction.reply({ content: "✅ Kamu sudah terverifikasi!", ephemeral: true });
    }

    // BAN
    if (commandName === 'ban') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({ content: "❌ Tidak ada izin!", ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || "Tidak ada alasan";

        const member = await interaction.guild.members.fetch(user.id);

        await member.ban({ reason });

        interaction.reply(`🔨 ${user.tag} dibanned!\nAlasan: ${reason}`);
    }

    // KICK
    if (commandName === 'kick') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return interaction.reply({ content: "❌ Tidak ada izin!", ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || "Tidak ada alasan";

        const member = await interaction.guild.members.fetch(user.id);

        await member.kick(reason);

        interaction.reply(`👢 ${user.tag} dikick!\nAlasan: ${reason}`);
    }

    // REPORT
    if (commandName === 'report') {
        const user = interaction.options.getUser('user');
        const bukti = interaction.options.getString('bukti');

        const channel = interaction.guild.channels.cache.find(c => c.name === "report");

        if (!channel) return interaction.reply({ content: "Channel report tidak ada!", ephemeral: true });

        const embed = new EmbedBuilder()
            .setTitle("🚨 REPORT SCAMMER")
            .addFields(
                { name: "Pelapor", value: interaction.user.tag },
                { name: "Tersangka", value: user.tag },
                { name: "Bukti", value: bukti }
            )
            .setColor("Red")
            .setTimestamp();

        channel.send({ embeds: [embed] });

        interaction.reply({ content: "✅ Report berhasil dikirim!", ephemeral: true });
    }
});

client.login(process.env.TOKEN);