const express = require('express');
const app = express();

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require('@whiskeysockets/baileys');

const qrcode = require('qrcode-terminal');

app.use(express.json());

const PORT = process.env.PORT || 3000;

let sock;

// iniciar WhatsApp
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, qr } = update;

    if (qr) {
      console.log("ESCANEIE O QR CODE:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      console.log("WhatsApp conectado!");
    }

    if (connection === 'close') {
      console.log("Conexão fechada, reiniciando...");
      startBot();
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

// endpoint para enviar mensagem
app.post('/enviar', async (req, res) => {
  try {
    const { numero, mensagem } = req.body;

    if (!sock) {
      return res.json({ ok: false, erro: "WhatsApp ainda não conectado" });
    }

    await sock.sendMessage(numero, {
      text: mensagem
    });

    res.json({ ok: true, enviado: true });

  } catch (e) {
    res.json({ ok: false, erro: e.message });
  }
});

app.get('/', (req, res) => {
  res.send('Bot WhatsApp online');
});

app.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
  startBot();
});
