// Front-end: busca os dados da API Express com fetch() e atualiza a página.
const API = '/api/lendas';

const grid = document.querySelector('#gridLendas');
const busca = document.querySelector('#busca');
const modal = document.querySelector('#modalLenda');
const formulario = document.querySelector('#formLenda');
const toast = document.querySelector('#toast');
const modalExcluir = document.querySelector('#modalExcluir');
let idParaExcluir = null;

let classeSelecionada = 'Todas';
let somenteFavoritas = false;
let idEmEdicao = null;
let tempoBusca;
let tempoToast;
let ultimaConsulta = 0;

const simbolos = { Assalto: '✦', Combate: '⟡', Batedor: '◎', Controle: '▣', Suporte: '✚' };
const coresClasse = { Assalto: '#f19e65', Combate: '#e56f70', Batedor: '#65d3b0', Controle: '#b78fe5', Suporte: '#84d6d1' };

function siglaDaLenda(nome) {
  const letras = nome.trim().split(/\s+/).filter(Boolean).map(palavra => palavra[0]);
  return letras.length ? letras.join('').slice(0, 2).toUpperCase() : '?';
}

// Mantém a arte do cadastro idêntica à arte dos outros cartões.
function atualizarPrevia() {
  const nome = formulario.elements.nome.value.trim();
  const classe = formulario.elements.classe.value;
  document.querySelector('#previewSigla').textContent = siglaDaLenda(nome);
  document.querySelector('#previewSimbolo').textContent = simbolos[classe] || '✦';
  document.querySelector('#previewClasse').textContent = classe ? classe.toUpperCase() : 'ESCOLHA UMA CLASSE';
  document.querySelector('#previewNome').textContent = nome ? nome.toUpperCase() : 'NOVA LENDA';
  document.querySelector('#previewBanner').style.setProperty('--accent', formulario.elements.cor.value);
}

formulario.addEventListener('input', atualizarPrevia);
formulario.elements.classe.addEventListener('change', () => {
  const classe = formulario.elements.classe.value;
  if (coresClasse[classe]) formulario.elements.cor.value = coresClasse[classe];
  atualizarPrevia();
});

// Evita que textos cadastrados sejam interpretados como HTML.
function textoSeguro(valor) {
  return String(valor).replace(/[&<>"']/g, (letra) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[letra]));
}

async function requisicao(url, opcoes = {}) {
  if (location.protocol === 'file:') throw new Error('Abra http://localhost:3000 após executar npm start.');
  const resposta = await fetch(url, opcoes).catch(() => {
    throw new Error('Não foi possível conectar à API. Verifique se o servidor está ligado.');
  });

  if (!resposta.ok) {
    const dados = await resposta.json().catch(() => ({}));
    throw new Error(dados.erro || 'Não foi possível concluir a requisição.');
  }

  if (resposta.status === 204) return null;
  return resposta.json();
}

function notificar(mensagem, erro = false) {
  clearTimeout(tempoToast);
  toast.textContent = mensagem;
  toast.classList.toggle('error', erro);
  toast.classList.add('visible');
  tempoToast = setTimeout(() => toast.classList.remove('visible'), 3500);
}

function atualizarResumo(lendas) {
  const totais = { Assalto: 0, Combate: 0, Batedor: 0, Controle: 0, Suporte: 0 };
  lendas.forEach((lenda) => { if (lenda.classe in totais) totais[lenda.classe]++; });

  document.querySelector('#totalLendas').textContent = String(lendas.length).padStart(2, '0');
  Object.entries(totais).forEach(([classe, quantidade]) => {
    document.querySelector(`#total${classe}`).textContent = String(quantidade).padStart(2, '0');
  });
}

function desenharCards(lendas) {
  document.querySelector('#contadorResultados').textContent = `${String(lendas.length).padStart(2, '0')} REGISTRO(S) ENCONTRADO(S)`;

  if (!lendas.length) {
    grid.innerHTML = `<div class="empty-state"><span>◇</span><h3>NENHUMA LENDA ENCONTRADA.</h3><p>Experimente outra busca ou adicione um novo personagem.</p></div>`;
    return;
  }

  grid.innerHTML = lendas.map((lenda, indice) => {
    const sigla = siglaDaLenda(lenda.nome);
    const simbolo = simbolos[lenda.classe] || '✦';

    return `
      <article class="legend-card" data-id="${lenda.id}" style="--accent:${textoSeguro(lenda.cor)}; --delay:${Math.min(indice * 45, 360)}ms">
        <div class="card-art">
          <div class="art-top"><span>APX // ${String(lenda.id).padStart(3, '0')}</span><span>◈ CLASSIFIED</span></div>
          <div class="art-rings"></div><div class="art-cut"></div>
          <span class="art-symbol" aria-hidden="true">${simbolo}</span>
          <span class="art-monogram" aria-hidden="true">${textoSeguro(sigla)}</span>
          <div class="art-bottom"><span>${textoSeguro(lenda.classe.toUpperCase())}</span><span>///</span></div>
        </div>
        <div class="card-content">
          <div class="card-kicker"><span class="class-dot"></span>${textoSeguro(lenda.classe.toUpperCase())}<span class="card-actions">
            <button type="button" data-acao="favoritar" data-id="${lenda.id}" class="icon-button favorite-button ${lenda.favorita ? 'is-favorite' : ''}" aria-label="${lenda.favorita ? 'Desfavoritar' : 'Favoritar'} ${textoSeguro(lenda.nome)}" title="Favoritar">${lenda.favorita ? '★' : '☆'}</button>
          </span></div>
          <h3>${textoSeguro(lenda.nome.toUpperCase())}</h3>
          <p class="legend-title">${textoSeguro(lenda.titulo)}</p>
          <p class="legend-description">${textoSeguro(lenda.descricao)}</p>
          <div class="abilities"><div><small>TÁTICA</small><span>${textoSeguro(lenda.tatica)}</span></div><div><small>SUPREMA</small><span>${textoSeguro(lenda.suprema)}</span></div></div>
          <div class="card-footer"><button type="button" data-acao="editar" data-id="${lenda.id}">✎ EDITAR</button><button type="button" data-acao="excluir" data-id="${lenda.id}">✕ EXCLUIR</button></div>
        </div>
      </article>`;
  }).join('');
}

async function carregarLendas(idDestacado = null) {
  const consultaAtual = ++ultimaConsulta;
  const parametros = new URLSearchParams();
  if (busca.value.trim()) parametros.set('busca', busca.value.trim());
  if (classeSelecionada !== 'Todas') parametros.set('classe', classeSelecionada);
  if (somenteFavoritas) parametros.set('favoritas', 'true');

  try {
    // A lista mostrada na tela vem da API, inclusive os filtros e a busca.
    const [filtradas, todas] = await Promise.all([
      requisicao(`${API}?${parametros.toString()}`),
      requisicao(API)
    ]);
    if (consultaAtual !== ultimaConsulta) return;

    desenharCards(filtradas);
    atualizarResumo(todas);
    if (idDestacado !== null) {
      const novoCard = Array.from(grid.querySelectorAll('.legend-card')).find(
        card => Number(card.dataset.id) === idDestacado
      );
      if (novoCard) {
        novoCard.classList.add('just-created');
        novoCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => novoCard.classList.remove('just-created'), 3600);
      }
    }
    document.querySelector('#apiStatus').textContent = 'API ONLINE';
    document.querySelector('.header-right').classList.add('connected');
  } catch (erro) {
    if (consultaAtual !== ultimaConsulta) return;
    grid.innerHTML = `<div class="empty-state"><span>!</span><h3>SEM CONEXÃO COM A API</h3><p>Verifique se você iniciou o servidor com npm start.</p></div>`;
    document.querySelector('#apiStatus').textContent = 'API OFFLINE';
    document.querySelector('.header-right').classList.remove('connected');
    notificar(erro.message, true);
  }
}

function abrirModal(lenda = null) {
  formulario.reset();
  document.querySelector('#erroFormulario').textContent = '';
  idEmEdicao = lenda ? lenda.id : null;
  document.querySelector('#tituloModal').textContent = lenda ? 'EDITAR LENDA' : 'NOVA LENDA';
  document.querySelector('#salvarLenda').textContent = lenda ? 'SALVAR ALTERAÇÕES ↗' : 'CADASTRAR LENDA ↗';

  if (lenda) {
    for (const campo of ['nome', 'titulo', 'classe', 'descricao', 'tatica', 'suprema', 'cor']) {
      formulario.elements[campo].value = lenda[campo];
    }
  }
  atualizarPrevia();
  modal.showModal();
  formulario.elements.nome.focus();
}

async function editarLenda(id) {
  try {
    const lenda = await requisicao(`${API}/${id}`);
    abrirModal(lenda);
  } catch (erro) {
    notificar(erro.message, true);
  }
}

async function excluirLenda(id) {
  try {
    const lenda = await requisicao(`${API}/${id}`);
    idParaExcluir = id;
    document.querySelector('#nomeExclusao').textContent = lenda.nome;
    modalExcluir.showModal();
  } catch (erro) {
    notificar(erro.message, true);
  }
}

function fecharExclusao() {
  idParaExcluir = null;
  modalExcluir.close();
}

document.querySelector('#fecharExclusao').addEventListener('click', fecharExclusao);
document.querySelector('#cancelarExclusao').addEventListener('click', fecharExclusao);
document.querySelector('#confirmarExclusao').addEventListener('click', async () => {
  if (idParaExcluir === null) return;
  const botao = document.querySelector('#confirmarExclusao');
  botao.disabled = true;
  try {
    await requisicao(`${API}/${idParaExcluir}`, { method: 'DELETE' });
    modalExcluir.close();
    idParaExcluir = null;
    await carregarLendas();
    notificar('Lenda excluída com sucesso.');
  } catch (erro) {
    notificar(erro.message, true);
  } finally {
    botao.disabled = false;
  }
});

// Limpa filtros após cadastrar ou editar, para a lenda ficar visível.
function limparFiltros() {
  clearTimeout(tempoBusca);
  busca.value = '';
  classeSelecionada = 'Todas';
  somenteFavoritas = false;
  document.querySelectorAll('[data-classe]').forEach(item => {
    const selecionado = item.dataset.classe === 'Todas';
    item.classList.toggle('selected', selecionado);
    item.setAttribute('aria-pressed', String(selecionado));
  });
  const botaoFavoritas = document.querySelector('#filtroFavoritas');
  botaoFavoritas.classList.remove('selected');
  botaoFavoritas.setAttribute('aria-pressed', 'false');
}

async function favoritarLenda(id) {
  try {
    await requisicao(`${API}/${id}/favorita`, { method: 'PATCH' });
    await carregarLendas();
  } catch (erro) {
    notificar(erro.message, true);
  }
}

// Criação ou edição: os dados do formulário são enviados como JSON.
formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const dados = Object.fromEntries(new FormData(formulario).entries());
  for (const campo of ['nome', 'titulo', 'descricao', 'tatica', 'suprema']) {
    dados[campo] = dados[campo].trim();
  }
  if (!formulario.reportValidity()) return;
  if (!dados.nome) {
    document.querySelector('#erroFormulario').textContent = 'Informe o nome da lenda.';
    return;
  }
  const botao = document.querySelector('#salvarLenda');
  botao.disabled = true;
  const rotuloOriginal = botao.textContent;
  botao.textContent = 'SALVANDO...';
  document.querySelector('#erroFormulario').textContent = '';

  try {
    const url = idEmEdicao ? `${API}/${idEmEdicao}` : API;
    const metodo = idEmEdicao ? 'PUT' : 'POST';

    const lendaSalva = await requisicao(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });

    modal.close();
    limparFiltros();
    await carregarLendas(lendaSalva.id);
    notificar(idEmEdicao ? 'Lenda atualizada com sucesso.' : 'Nova lenda cadastrada com banner completo.');
  } catch (erro) {
    document.querySelector('#erroFormulario').textContent = erro.message;
  } finally {
    botao.disabled = false;
    botao.textContent = rotuloOriginal;
  }
});

document.querySelector('#abrirCadastro').addEventListener('click', () => abrirModal());
document.querySelector('#heroNovaLenda').addEventListener('click', () => abrirModal());
document.querySelector('#fecharModal').addEventListener('click', () => modal.close());
document.querySelector('#cancelarModal').addEventListener('click', () => modal.close());

document.querySelector('#filtrosClasse').addEventListener('click', (evento) => {
  const botao = evento.target.closest('[data-classe]');
  if (!botao) return;

  classeSelecionada = botao.dataset.classe;
  document.querySelectorAll('[data-classe]').forEach((item) => {
    const selecionado = item === botao;
    item.classList.toggle('selected', selecionado);
    item.setAttribute('aria-pressed', String(selecionado));
  });
  carregarLendas();
});

document.querySelector('#filtroFavoritas').addEventListener('click', (evento) => {
  somenteFavoritas = !somenteFavoritas;
  evento.currentTarget.classList.toggle('selected', somenteFavoritas);
  evento.currentTarget.setAttribute('aria-pressed', String(somenteFavoritas));
  carregarLendas();
});

busca.addEventListener('input', () => {
  clearTimeout(tempoBusca);
  tempoBusca = setTimeout(carregarLendas, 220);
});

grid.addEventListener('click', (evento) => {
  const botao = evento.target.closest('[data-acao]');
  if (!botao) return;
  const id = Number(botao.dataset.id);
  if (botao.dataset.acao === 'editar') editarLenda(id);
  if (botao.dataset.acao === 'excluir') excluirLenda(id);
  if (botao.dataset.acao === 'favoritar') favoritarLenda(id);
});

// A tecla / ativa rapidamente o campo de pesquisa.
document.addEventListener('keydown', (evento) => {
  if (evento.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    evento.preventDefault();
    busca.focus();
  }
});

carregarLendas();
