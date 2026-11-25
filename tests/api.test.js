// Testes automáticos da API, usando o test runner do próprio Node.js.
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Usa uma cópia temporária do JSON para não alterar os personagens do projeto.
const pastaTemporaria = fs.mkdtempSync(path.join(os.tmpdir(), 'apex-test-'));
const arquivoTemporario = path.join(pastaTemporaria, 'lendas.json');
fs.copyFileSync(path.join(__dirname, '..', 'data', 'lendas.json'), arquivoTemporario);
process.env.DATA_FILE = arquivoTemporario;

const app = require('../server');
const servidor = app.listen(0);
const endereco = `http://127.0.0.1:${servidor.address().port}`;
let idCriado;

after(async () => {
  await new Promise((resolve) => servidor.close(resolve));
  fs.rmSync(pastaTemporaria, { recursive: true });
});

test('Express entrega o HTML, o CSS e o JavaScript do front-end', async () => {
  for (const arquivo of ['/', '/styles.css', '/app.js']) {
    const resposta = await fetch(`${endereco}${arquivo}`);
    assert.equal(resposta.status, 200, `Arquivo ${arquivo} não disponível`);
    assert.ok((await resposta.text()).length > 100);
  }
});

test('GET /api/lendas lista personagens e permite filtros', async () => {
  const resposta = await fetch(`${endereco}/api/lendas?classe=Suporte&busca=Lifeline`);
  const lendas = await resposta.json();

  assert.equal(resposta.status, 200);
  assert.equal(lendas.length, 1);
  assert.equal(lendas[0].nome, 'Lifeline');
});

test('GET /api/lendas/:id devolve 404 para ID inexistente', async () => {
  const resposta = await fetch(`${endereco}/api/lendas/999999`);
  assert.equal(resposta.status, 404);
});

test('POST /api/lendas recusa dados incompletos', async () => {
  const resposta = await fetch(`${endereco}/api/lendas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: 'Teste' })
  });
  assert.equal(resposta.status, 400);
});

test('POST /api/lendas cria e grava uma nova lenda', async () => {
  const resposta = await fetch(`${endereco}/api/lendas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: 'Lenda de Teste',
      titulo: 'Teste de API',
      classe: 'Combate',
      descricao: 'Personagem criado durante um teste automático.',
      tatica: 'Tática Teste',
      suprema: 'Suprema Teste',
      cor: '#f04d5b'
    })
  });

  const criada = await resposta.json();
  assert.equal(resposta.status, 201);
  assert.equal(criada.nome, 'Lenda de Teste');
  idCriado = criada.id;

  const salvas = JSON.parse(fs.readFileSync(arquivoTemporario, 'utf8'));
  assert.ok(salvas.some((lenda) => lenda.id === idCriado));
});

test('PUT /api/lendas/:id edita um registro existente', async () => {
  const resposta = await fetch(`${endereco}/api/lendas/${idCriado}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: 'Lenda Editada',
      titulo: 'Teste de Edição',
      classe: 'Batedor',
      descricao: 'Registro alterado por um teste automático.',
      tatica: 'Tática Editada',
      suprema: 'Suprema Editada',
      cor: '#65d3b0'
    })
  });
  assert.equal(resposta.status, 200);
  assert.equal((await resposta.json()).classe, 'Batedor');
});

test('PATCH /api/lendas/:id/favorita alterna o favorito', async () => {
  const resposta = await fetch(`${endereco}/api/lendas/${idCriado}/favorita`, { method: 'PATCH' });
  assert.equal(resposta.status, 200);
  assert.equal((await resposta.json()).favorita, true);
});

test('DELETE /api/lendas/:id apaga um registro', async () => {
  const resposta = await fetch(`${endereco}/api/lendas/${idCriado}`, { method: 'DELETE' });
  assert.equal(resposta.status, 204);

  const consulta = await fetch(`${endereco}/api/lendas/${idCriado}`);
  assert.equal(consulta.status, 404);
});

test('POST aceita apenas nome e classe e gera os demais campos', async () => {
  const resposta = await fetch(`${endereco}/api/lendas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: 'Nova Fera', classe: 'Suporte' })
  });
  assert.equal(resposta.status, 201);
  const criada = await resposta.json();
  assert.equal(criada.cor, '#84d6d1');
  assert.equal(criada.titulo, 'Nova lenda');
  assert.equal(criada.tatica, 'Não informada');
  assert.ok(JSON.parse(fs.readFileSync(arquivoTemporario, 'utf8')).some(lenda => lenda.id === criada.id));
});
