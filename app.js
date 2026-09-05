const express = require('express');
const pino = require('pino');

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

let sock = null;
let iniciando = false;


// ==============================
// INICIAR WHATSAPP
// ==============================

async function startBot() {

  if (iniciando) return;

  iniciando = true;

  try {

    console.log("🚀 Iniciando WhatsApp...");

    const { state, saveCreds } =
      await useMultiFileAuthState('./auth');

    // Pega a versão atual do WhatsApp
    const { version, isLatest } =
      await fetchLatestBaileysVersion();

    console.log(
      "📱 Versão WhatsApp:",
      version.join('.'),
      " | Atual:",
      isLatest
    );

    sock = makeWASocket({

      version,

      auth: state,

      logger: pino({
        level: 'silent'
      }),

      printQRInTerminal: false,

      browser: [
        'Chrome',
        'Windows',
        '10'
      ]

    });


    // ==============================
    // EVENTOS DE CONEXÃO
    // ==============================

    sock.ev.on('connection.update', (update) => {

      const {
        connection,
        qr,
        lastDisconnect
      } = update;


      // ==============================
      // QR CODE
      // ==============================

      if (qr) {

        console.log("");
        console.log("==============================");
        console.log("📲 QR CODE GERADO!");
        console.log("==============================");

        console.log(
          "https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=" +
          encodeURIComponent(qr)
        );

        console.log("==============================");
        console.log("");

      }


      // ==============================
      // CONECTADO
      // ==============================

      if (connection === 'open') {

        console.log("");
        console.log("================================");
        console.log("✅ WHATSAPP CONECTADO!");
        console.log("================================");
        console.log("");

        iniciando = false;

      }


      // ==============================
      // DESCONECTADO
      // ==============================

      if (connection === 'close') {

        iniciando = false;

        const statusCode =
          lastDisconnect?.error?.output?.statusCode;

        console.log("");
        console.log("❌ Conexão fechada.");
        console.log("Código:", statusCode);


        const shouldReconnect =
          statusCode !== DisconnectReason.loggedOut;


        if (shouldReconnect) {

          console.log(
            "🔄 Tentando conectar novamente em 5 segundos..."
          );

          setTimeout(() => {
            startBot();
          }, 5000);

        } else {

          console.log(
            "🚫 WhatsApp desconectado."
          );

          console.log(
            "Será necessário gerar um novo QR Code."
          );

        }

      }

    });


    // Salvar autenticação
    sock.ev.on(
      'creds.update',
      saveCreds
    );


  } catch (error) {

    iniciando = false;

    console.error(
      "❌ Erro ao iniciar WhatsApp:"
    );

    console.error(error);

    setTimeout(() => {
      startBot();
    }, 10000);

  }

}


// ==============================
// ENVIAR MENSAGEM
// ==============================

app.post('/enviar', async (req, res) => {

  try {

    const {
      numero,
      mensagem
    } = req.body;


    if (!numero || !mensagem) {

      return res.json({
        ok: false,
        erro: "Informe numero e mensagem"
      });

    }


    if (!sock) {

      return res.json({
        ok: false,
        erro: "WhatsApp ainda não conectado"
      });

    }


    await sock.sendMessage(
      numero,
      {
        text: mensagem
      }
    );


    return res.json({
      ok: true,
      enviado: true
    });


  } catch (error) {

    console.error(
      "Erro ao enviar:",
      error
    );

    return res.json({
      ok: false,
      erro: error.message
    });

  }

});


// ==============================
// TESTE
// ==============================

app.get('/', (req, res) => {

  res.send(
    'Bot WhatsApp online'
  );

});


// ==============================
// SERVIDOR
// ==============================

app.listen(PORT, () => {

  console.log(
    "🚀 Servidor rodando na porta",
    PORT
  );

  startBot();

});