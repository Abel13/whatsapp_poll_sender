const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: '/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

client.on('qr', (qr) => {
    console.log('QR Code received! Scan this with your WhatsApp:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp bot is ready!');
    console.log(`Bot will send daily polls at ${config.pollTime}`);
    
    scheduleDailyPoll();
});

client.on('authenticated', () => {
    console.log('Successfully authenticated!');
});

client.on('auth_failure', (msg) => {
    console.error('Authentication failed:', msg);
});

client.on('disconnected', (reason) => {
    console.log('Client was disconnected:', reason);
});

async function sendDailyPoll() {
    try {
        const chats = await client.getChats();
        const targetGroup = chats.find(chat => 
            chat.isGroup && chat.name === config.groupName
        );

        if (!targetGroup) {
            console.error(`Group "${config.groupName}" not found!`);
            console.log('Available groups:');
            chats.filter(chat => chat.isGroup).forEach(group => {
                console.log(`- ${group.name}`);
            });
            return;
        }

        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const pollTitle = `${day}-${month}`;

        const pollOptions = ['Sim', 'Não'];

        await targetGroup.sendMessage(
            `*${pollTitle}*`
        );

        await targetGroup.sendPoll(pollTitle, pollOptions);

        console.log(`✅ Poll sent successfully at ${new Date().toLocaleString()}`);
        console.log(`Poll title: ${pollTitle}`);
        console.log(`Options: ${pollOptions.join(', ')}`);
        
    } catch (error) {
        console.error('Error sending poll:', error);
    }
}

function scheduleDailyPoll() {
    const [hour, minute] = config.pollTime.split(':');
    const cronExpression = `${minute} ${hour} * * *`;
    
    console.log(`Poll scheduled with cron: ${cronExpression}`);
    console.log(`Timezone: ${config.timezone}`);
    console.log(`Daily poll will be sent at ${config.pollTime} (${config.timezone})`);
    
    cron.schedule(cronExpression, () => {
        console.log('Executing scheduled poll...');
        sendDailyPoll();
    }, {
        timezone: config.timezone
    });
}

client.initialize();

console.log('Starting WhatsApp bot...');
console.log('Waiting for QR code...');
