const { Client, LocalAuth, Poll } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const cron = require("node-cron");
const fs = require("fs");

const config = JSON.parse(fs.readFileSync("./config.json", "utf-8"));

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    executablePath: "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
  },
});

client.on("qr", (qr) => {
  console.log("QR Code received! Scan this with your WhatsApp:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("WhatsApp bot is ready!");
  console.log(`Bot will send daily polls at ${config.pollTime}`);
  console.log('💡 To test immediately, send "!test" to the bot in any chat');

  // Registra o listener de mensagem aqui
  client.on("message", async (message) => {
    console.log("Message received!");
    console.log("From:", message.from, "| Body:", message.body);
    if (message.body === "!test") {
      console.log("Test command received! Sending poll now...");
      await sendDailyPoll();
    }
  });

  scheduleDailyPoll();
});

client.on("authenticated", () => {
  console.log("Successfully authenticated!");
});

client.on("auth_failure", (msg) => {
  console.error("Authentication failed:", msg);
});

client.on("disconnected", (reason) => {
  console.log("Client was disconnected:", reason);
});

async function sendDailyPoll() {
  try {
    const chats = await client.getChats();
    const targetGroup = chats.find(
      (chat) => chat.isGroup && chat.name === config.groupName
    );
    console.log(targetGroup);

    if (!targetGroup) {
      console.error(`Group "${config.groupName}" not found!`);
      console.log("Available groups:");
      chats
        .filter((chat) => chat.isGroup)
        .forEach((group) => {
          console.log(`- ${group.name}`);
        });
      return;
    }

    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const pollTitle = `${day}-${month}`;

    const pollOptions = ["Sim", "Não"];

    const poll = new Poll(`*${pollTitle}*`, pollOptions, {
      allowMultipleAnswers: false,
    });
    await targetGroup.sendMessage(poll);

    console.log(`✅ Poll sent successfully at ${new Date().toLocaleString()}`);
    console.log(`Poll title: ${pollTitle}`);
    console.log(`Options: ${pollOptions.join(", ")}`);
  } catch (error) {
    console.error("Error sending poll:", error);
  }
}

function scheduleDailyPoll() {
  const [hour, minute] = config.pollTime.split(":");
  const cronExpression = `${minute} ${hour} * * *`;

  console.log(`Poll scheduled with cron: ${cronExpression}`);
  console.log(`Timezone: ${config.timezone}`);
  console.log(
    `Daily poll will be sent at ${config.pollTime} (${config.timezone})`
  );

  cron.schedule(
    cronExpression,
    () => {
      console.log("Executing scheduled poll...");
      sendDailyPoll();
    },
    {
      timezone: config.timezone,
    }
  );
}

client.initialize();

console.log("Starting WhatsApp bot...");
console.log("Waiting for QR code...");
