// Back-end do projeto. O Express recebe as requisições e devolve JSON.
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORTA = process.env.PORT || 3000;
const ARQUIVO = process.env.DATA_FILE || path.join(__dirname, 'data', 'lendas.json');
const CLASSES = ['Assalto', 'Combate', 'Batedor', 'Controle', 'Suporte'];

// Carrega os registros uma vez ao iniciar o servidor.
let lendas = JSON.parse(fs.readFileSync(ARQUIVO, 'utf8'));

app.use(express.json()); // Permite receber JSON no corpo do POST e do PUT.
app.use(express.static(path.join(__dirname, 'public'))); // Entrega HTML, CSS e JS.

// Salva os dados no disco. Eles continuam lá mesmo após reiniciar o Node.js.
async function salvar(dados) {
  await fs.promises.writeFile(ARQUIVO, JSON.stringify(dados, null, 2) + '\n');
  lendas = dados;
}

function encontrar(id) {
  return lendas.find((lenda) => lenda.id === Number(id));
}

// Validação básica para evitar registros incompletos.
function validar(dados) {
  const campos = ['nome', 'titulo', 'classe', 'descricao', 'tatica', 'suprema'];

  for (const campo of campos) {
    if (typeof dados[campo] !== 'string' || !dados[campo].trim()) {
      return `O campo ${campo} é obrigatório.`;
    }
    if (dados[campo].trim().length > 240) {
      return `O campo ${campo} é muito longo (máximo: 240 caracteres).`;
    }
  }

  if (!CLASSES.includes(dados.classe)) {
    return 'Classe inválida. Escolha uma das cinco classes disponíveis.';
  }

  if (dados.cor && !/^#[0-9a-f]{6}$/i.test(dados.cor)) {
    return 'A cor deve estar no formato hexadecimal, como #ff4655.';
  }

  return null;
}

function limparDados(dados) {
  return {
    nome: dados.nome.trim(),
    titulo: dados.titulo.trim(),
    classe: dados.classe,
    descricao: dados.descricao.trim(),
    tatica: dados.tatica.trim(),
    suprema: dados.suprema.trim(),
    cor: dados.cor || '#e94b5f'
  };
}

// GET = consultar todos os personagens (aceita busca e filtro por classe).
app.get('/api/lendas', (req, res) => {
  const busca = String(req.query.busca || '').toLowerCase().trim();
  const classe = String(req.query.classe || '');
  const favoritas = String(req.query.favoritas || '') === 'true';

  let resultado = lendas;

  if (busca) {
    resultado = resultado.filter((lenda) =>
      `${lenda.nome} ${lenda.titulo} ${lenda.descricao}`.toLowerCase().includes(busca)
    );
  }

  if (classe) {
    resultado = resultado.filter((lenda) => lenda.classe === classe);
  }

  if (favoritas) {
    resultado = resultado.filter((lenda) => lenda.favorita);
  }

  res.json(resultado);
});

// GET = consultar apenas um personagem pelo seu ID.
app.get('/api/lendas/:id', (req, res) => {
  const lenda = encontrar(req.params.id);
  if (!lenda) return res.status(404).json({ erro: 'Lenda não encontrada.' });
  res.json(lenda);
});

// POST = cadastrar uma nova lenda.
app.post('/api/lendas', async (req, res, next) => {
  try {
    const erro = validar(req.body || {});
    if (erro) return res.status(400).json({ erro });

    const nome = req.body.nome.trim().toLowerCase();
    if (lendas.some((item) => item.nome.toLowerCase() === nome)) {
      return res.status(409).json({ erro: 'Já existe uma lenda com esse nome.' });
    }

    const id = Math.max(0, ...lendas.map((lenda) => lenda.id)) + 1;
    const novaLenda = { id, ...limparDados(req.body), favorita: false };
    await salvar([...lendas, novaLenda]);
    res.status(201).json(novaLenda);
  } catch (erro) {
    next(erro);
  }
});

// PUT = atualizar um personagem já cadastrado.
app.put('/api/lendas/:id', async (req, res, next) => {
  try {
    const atual = encontrar(req.params.id);
    if (!atual) return res.status(404).json({ erro: 'Lenda não encontrada.' });

    const erro = validar(req.body || {});
    if (erro) return res.status(400).json({ erro });

    const nome = req.body.nome.trim().toLowerCase();
    if (lendas.some((item) => item.id !== atual.id && item.nome.toLowerCase() === nome)) {
      return res.status(409).json({ erro: 'Já existe uma lenda com esse nome.' });
    }

    const atualizada = { ...atual, ...limparDados(req.body) };
    await salvar(lendas.map((item) => item.id === atual.id ? atualizada : item));
    res.json(atualizada);
  } catch (erro) {
    next(erro);
  }
});

// PATCH = altera somente o favorito, sem editar o resto do personagem.
app.patch('/api/lendas/:id/favorita', async (req, res, next) => {
  try {
    const atual = encontrar(req.params.id);
    if (!atual) return res.status(404).json({ erro: 'Lenda não encontrada.' });

    const atualizada = { ...atual, favorita: !atual.favorita };
    await salvar(lendas.map((item) => item.id === atual.id ? atualizada : item));
    res.json(atualizada);
  } catch (erro) {
    next(erro);
  }
});

// DELETE = excluir um personagem pelo ID.
app.delete('/api/lendas/:id', async (req, res, next) => {
  try {
    const atual = encontrar(req.params.id);
    if (!atual) return res.status(404).json({ erro: 'Lenda não encontrada.' });

    await salvar(lendas.filter((item) => item.id !== atual.id));
    res.status(204).end();
  } catch (erro) {
    next(erro);
  }
});

// Uma rota simples de status para mostrar que o servidor está ligado.
app.get('/api/status', (req, res) => {
  res.json({ mensagem: 'API Apex online', total: lendas.length, classes: CLASSES });
});

app.use((erro, req, res, next) => {
  if (erro instanceof SyntaxError && erro.status === 400 && 'body' in erro) {
    return res.status(400).json({ erro: 'JSON inválido.' });
  }
  console.error(erro);
  res.status(500).json({ erro: 'Erro interno no servidor.' });
});

// O teste importa o app sem abrir uma porta; a execução normal abre a porta 3000.
if (require.main === module) {
  app.listen(PORTA, () => {
    console.log(`\n  APEX // LEGEND ARCHIVE`);
    console.log(`  Site: http://localhost:${PORTA}`);
    console.log(`  API:  http://localhost:${PORTA}/api/lendas\n`);
  });
}

module.exports = app;
