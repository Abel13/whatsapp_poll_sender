const { Client, LocalAuth, Poll } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const cron = require("node-cron");
const fs = require("fs");
const cronitor = require("cronitor")(process.env.CRONITOR_API_KEY);
const fetch = require("node-fetch");

cronitor.wraps(cron);
const monitor = new cronitor.Monitor("daily_poll_bot");

// chave do monitor (consistente)
const MONITOR_KEY = "daily_poll_bot";
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

  scheduleDailyPoll();
});

// Registra o listener de mensagem aqui
client.on("message", async (message) => {
  if (message.body === "!test") {
    console.log("From:", message.from, "| Body:", message.body);
    console.log("Test command received! Sending poll now...");
    await sendDailyPoll();
  }
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
      // opcional: notificar monitor de falha por ausência de grupo
      try {
        await monitor.ping(MONITOR_KEY, {
          state: "fail",
          message: "group_not_found",
        });
      } catch (e) {
        console.error("Cronitor ping fail:", e.message);
      }
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

async function scheduleDailyPoll() {
  console.log(`Version 1.0.1`);
  const [hour, minute] = config.pollTime.split(":");
  const cronExpression = `${minute} ${hour} * * *`;

  console.log(`Poll scheduled with cron: ${cronExpression}`);
  console.log(`Timezone: ${config.timezone}`);
  console.log(
    `Daily poll will be sent at ${config.pollTime} (${config.timezone})`
  );

  // cria/atualiza monitor no Cronitor usando a API HTTP oficial
  const monitorPayload = {
    monitors: [
      {
        type: "job",
        key: MONITOR_KEY,
        schedule: cronExpression,
        timezone: config.timezone,
        note: "Envia enquete diária",
      },
    ],
  };

  try {
    const encoded = Buffer.from(`${process.env.CRONITOR_API_KEY}:`).toString(
      "base64"
    );

    const res = await fetch("https://cronitor.io/api/monitors", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${encoded}`,
      },
      body: JSON.stringify(monitorPayload),
    });

    if (!res.ok) {
      throw new Error(`Cronitor API error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    console.log("Cronitor monitor created/updated:", data);
  } catch (err) {
    console.error("Erro ao criar/atualizar monitor no Cronitor:", err.message);
  }

  cron.schedule(
    cronExpression,
    cronitor.wrap("daily_poll_bot", async () => {
      console.log("⏰ Executando agendamento:", new Date().toLocaleString());
      try {
        await monitor.ping(MONITOR_KEY, { state: "run" });
      } catch (e) {
        console.error("Cronitor ping (run) error:", e.message);
      }

      try {
        await sendDailyPoll();
        // sinaliza sucesso
        await monitor.ping(MONITOR_KEY, { state: "complete" });
      } catch (err) {
        // sinaliza falha
        await monitor.ping(MONITOR_KEY, {
          state: "fail",
          message: err.message,
        });
      }
    }),
    {
      timezone: config.timezone,
    }
  );

  console.log(`✅ Poll agendado com: ${cronExpression}`);
}

client.initialize();

console.log("Starting WhatsApp bot...");
console.log("Waiting for QR code...");
