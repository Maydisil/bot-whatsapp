const express = require('express');
const app = express();

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require('@whiskeysockets/baileys');

app.use(express.json());

const PORT = process.env.PORT || 3000;

let sock = null;

// iniciar WhatsApp
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, qr, lastDisconnect } = update;

    // QR CODE
    if (qr) {
      console.log("\n==============================");
      console.log("QR CODE GERADO:");
      console.log(
        "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" +
        encodeURIComponent(qr)
      );
      console.log("==============================\n");
    }

    // CONECTADO
    if (connection === 'open') {
      console.log("✅ WhatsApp conectado!");
    }

    // DESCONECTADO
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;

      const shouldReconnect =
        statusCode !== DisconnectReason.loggedOut;

      console.log("❌ Conexão fechada");

      if (shouldReconnect) {
        console.log("🔄 Reconectando...");
        startBot();
      } else {
        console.log("🚫 Logout detectado. Precisa novo QR.");
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

// endpoint para enviar mensagem
app.post('/enviar', async (req, res) => {
  try {
    const { numero, mensagem } = req.body;

    if (!sock) {
      return res.json({
        ok: false,
        erro: "WhatsApp ainda não conectado"
      });
    }

    await sock.sendMessage(numero, {
      text: mensagem
    });

    return res.json({
      ok: true,
      enviado: true
    });

  } catch (e) {
    return res.json({
      ok: false,
      erro: e.message
    });
  }
});

// teste básico
app.get('/', (req, res) => {
  res.send('Bot WhatsApp online');
});

// iniciar servidor
app.listen(PORT, () => {
  console.log("🚀 Servidor rodando na porta", PORT);
  startBot();
});
