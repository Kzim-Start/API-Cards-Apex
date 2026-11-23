// API REST do catálogo. Os registros ficam salvos em um arquivo JSON.
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORTA = process.env.PORT || 3000;
const ARQUIVO = process.env.DATA_FILE || path.join(__dirname, 'data', 'lendas.json');
const CLASSES = ['Assalto', 'Combate', 'Batedor', 'Controle', 'Suporte'];
let lendas = JSON.parse(fs.readFileSync(ARQUIVO, 'utf8'));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function salvar(dados) {
  // Como é um JSON pequeno, a gravação síncrona evita dois cadastros ao mesmo tempo
  // receberem o mesmo ID ou sobrescreverem as alterações um do outro.
  fs.writeFileSync(ARQUIVO, JSON.stringify(dados, null, 2) + '\n');
  lendas = dados;
}

function encontrar(id) {
  return lendas.find((lenda) => lenda.id === Number(id));
}

function validar(dados) {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
    return 'Envie os dados da lenda em JSON.';
  }

  const limites = { nome: 70, titulo: 100, classe: 100, tatica: 100, suprema: 100, descricao: 240 };
  for (const [campo, limite] of Object.entries(limites)) {
    if (typeof dados[campo] !== 'string' || !dados[campo].trim()) {
      return `Preencha o campo ${campo}.`;
    }
    if (dados[campo].trim().length > limite) {
      return `O campo ${campo} aceita até ${limite} caracteres.`;
    }
  }
  if (!CLASSES.includes(dados.classe.trim())) return 'Escolha uma classe válida.';
  if (dados.cor !== undefined && (typeof dados.cor !== 'string' || !/^#[0-9a-f]{6}$/i.test(dados.cor))) {
    return 'Escolha uma cor válida.';
  }
  return null;
}

function limpar(dados) {
  return {
    nome: dados.nome.trim(),
    titulo: dados.titulo.trim(),
    classe: dados.classe.trim(),
    descricao: dados.descricao.trim(),
    tatica: dados.tatica.trim(),
    suprema: dados.suprema.trim(),
    cor: dados.cor || '#df454b'
  };
}

function nomeExistente(nome, ignorarId = null) {
  return lendas.some((item) =>
    item.id !== ignorarId && item.nome.trim().toLowerCase() === nome.trim().toLowerCase()
  );
}

app.get('/api/lendas', (req, res) => {
  const busca = String(req.query.busca || '').trim().toLowerCase();
  const classe = String(req.query.classe || '');
  const favoritas = req.query.favoritas === 'true';

  const resultado = lendas.filter((lenda) => {
    const combinaBusca = !busca || `${lenda.nome} ${lenda.titulo} ${lenda.descricao}`.toLowerCase().includes(busca);
    return combinaBusca && (!classe || lenda.classe === classe) && (!favoritas || lenda.favorita);
  });
  res.json(resultado);
});

app.get('/api/lendas/:id', (req, res) => {
  const lenda = encontrar(req.params.id);
  if (!lenda) return res.status(404).json({ erro: 'Lenda não encontrada.' });
  res.json(lenda);
});

app.post('/api/lendas', (req, res, next) => {
  try {
    const erro = validar(req.body);
    if (erro) return res.status(400).json({ erro });
    if (nomeExistente(req.body.nome)) {
      return res.status(409).json({ erro: 'Já existe uma lenda com esse nome.' });
    }
    const id = Math.max(0, ...lendas.map((lenda) => lenda.id)) + 1;
    const nova = { id, ...limpar(req.body), favorita: false };
    salvar([...lendas, nova]);
    res.status(201).json(nova);
  } catch (erro) { next(erro); }
});

app.put('/api/lendas/:id', (req, res, next) => {
  try {
    const atual = encontrar(req.params.id);
    if (!atual) return res.status(404).json({ erro: 'Lenda não encontrada.' });
    const erro = validar(req.body);
    if (erro) return res.status(400).json({ erro });
    if (nomeExistente(req.body.nome, atual.id)) {
      return res.status(409).json({ erro: 'Já existe uma lenda com esse nome.' });
    }
    const alterada = { ...atual, ...limpar(req.body) };
    salvar(lendas.map((item) => item.id === atual.id ? alterada : item));
    res.json(alterada);
  } catch (erro) { next(erro); }
});

app.patch('/api/lendas/:id/favorita', (req, res, next) => {
  try {
    const atual = encontrar(req.params.id);
    if (!atual) return res.status(404).json({ erro: 'Lenda não encontrada.' });
    const alterada = { ...atual, favorita: !atual.favorita };
    salvar(lendas.map((item) => item.id === atual.id ? alterada : item));
    res.json(alterada);
  } catch (erro) { next(erro); }
});

app.delete('/api/lendas/:id', (req, res, next) => {
  try {
    if (!encontrar(req.params.id)) return res.status(404).json({ erro: 'Lenda não encontrada.' });
    salvar(lendas.filter((lenda) => lenda.id !== Number(req.params.id)));
    res.status(204).end();
  } catch (erro) { next(erro); }
});

app.get('/api/status', (req, res) => {
  res.json({ mensagem: 'API Apex online', total: lendas.length, classes: CLASSES });
});

app.use((erro, req, res, next) => {
  if (erro instanceof SyntaxError && erro.status === 400 && 'body' in erro) {
    return res.status(400).json({ erro: 'JSON inválido.' });
  }
  console.error(erro);
  res.status(500).json({ erro: 'Não foi possível salvar. Verifique o servidor.' });
});

if (require.main === module) {
  app.listen(PORTA, () => console.log(`Servidor aberto em http://localhost:${PORTA}`));
}
module.exports = app;
