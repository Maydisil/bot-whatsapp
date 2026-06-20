const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Bot online! v2');
});

app.post('/enviar', (req, res) => {
  const { mensagem } = req.body;

  console.log('Mensagem recebida:', mensagem);

  res.json({
    sucesso: true,
    recebido: mensagem
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
