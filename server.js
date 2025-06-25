require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const DATA_FILE = path.join(__dirname, 'data', 'dados.json');
const CONFIRMACOES_FILE = path.join(__dirname, 'data', 'confirmacoes.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

function loadGifts() {
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data);
}

function saveGifts(gifts) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(gifts, null, 2));
}

function loadConfirmacoes() {
  if (!fs.existsSync(CONFIRMACOES_FILE)) return [];
  const data = fs.readFileSync(CONFIRMACOES_FILE, 'utf-8').trim();
  if (!data) return [];
  return JSON.parse(data);
}

function saveConfirmacoes(confirmacoes) {
  fs.writeFileSync(CONFIRMACOES_FILE, JSON.stringify(confirmacoes, null, 2));
}

app.get('/api/presentes', (req, res) => {
  res.json(loadGifts());
});

app.post('/api/reservar', (req, res) => {
  const { id, nome } = req.body;
  if (!id || !nome) return res.status(400).json({ error: 'Dados incompletos.' });

  const gifts = loadGifts();
  const gift = gifts.find(g => g.id === id);
  if (!gift) return res.status(404).json({ error: 'Presente não encontrado.' });
  if (gift.reservadoPor) return res.status(409).json({ error: 'Presente já reservado.' });

  gift.reservadoPor = nome;
  saveGifts(gifts);

  res.json({ sucesso: true });
});

app.post('/api/cancelar', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'ID não informado.' });

  const gifts = loadGifts();
  const gift = gifts.find(g => g.id === id);
  if (!gift) return res.status(404).json({ error: 'Presente não encontrado.' });

  gift.reservadoPor = '';
  saveGifts(gifts);

  res.json({ sucesso: true });
});

app.post('/api/confirmar-presenca', (req, res) => {
  let { nome, quantidade } = req.body;

  if (
    !nome ||
    typeof nome !== 'string' ||
    !quantidade ||
    typeof quantidade !== 'number' ||
    quantidade < 1
  ) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }

  nome = nome.trim();

  const confirmacoes = loadConfirmacoes();

  const idx = confirmacoes.findIndex(c => c.nome.toLowerCase() === nome.toLowerCase());

  if (idx >= 0) {
    confirmacoes[idx].quantidade = quantidade;
    confirmacoes[idx].data = new Date().toISOString();
  } else {
    confirmacoes.push({
      nome,
      quantidade,
      data: new Date().toISOString()
    });
  }

  saveConfirmacoes(confirmacoes);

  res.status(201).json({ sucesso: true });
});

app.get('/api/confirmacoes', (req, res) => {
  res.json(loadConfirmacoes());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

