// O navegador usa fetch() para conversar com a API do Express.
const API = '/api/lendas';
const grid = document.querySelector('#gridLendas');
const form = document.querySelector('#formLenda');
const areaFormulario = document.querySelector('#areaFormulario');
const aviso = document.querySelector('#mensagem');
let idEmEdicao = null;
let numeroConsulta = 0;
let tempoBusca;

function textoSeguro(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (caractere) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[caractere]));
}

async function pedir(url, opcoes = {}) {
  let resposta;
  try {
    resposta = await fetch(url, opcoes);
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Execute npm start.');
  }
  if (!resposta.ok) {
    const dados = await resposta.json().catch(() => ({}));
    throw new Error(dados.erro || `Erro ${resposta.status} ao acessar a API.`);
  }
  return resposta.status === 204 ? null : resposta.json();
}

function mostrarAviso(texto, falha = false) {
  aviso.textContent = texto;
  aviso.classList.toggle('falha', falha);
  aviso.hidden = false;
}

function desenharLendas(lendas) {
  document.querySelector('#contadorResultados').textContent =
    `${lendas.length} ${lendas.length === 1 ? 'lenda encontrada' : 'lendas encontradas'}`;

  if (!lendas.length) {
    grid.innerHTML = '<p class="vazio">Nenhuma lenda encontrada. Tente outra busca.</p>';
    return;
  }

  grid.innerHTML = lendas.map((lenda) => {
    // A cor vem do cadastro, mas só aceitamos cores hexadecimais.
    const cor = /^#[0-9a-f]{6}$/i.test(lenda.cor) ? lenda.cor : '#df454b';
    return `
      <article class="card" style="--cor: ${cor}">
        <div class="card-conteudo">
          <div class="card-topo">
            <div><span class="classe">${textoSeguro(lenda.classe)}</span>
              <h3>${textoSeguro(lenda.nome)}</h3></div>
            <button type="button" class="favorito ${lenda.favorita ? 'marcado' : ''}"
              data-acao="favoritar" data-id="${lenda.id}"
              aria-label="${lenda.favorita ? 'Remover favorita' : 'Marcar favorita'}: ${textoSeguro(lenda.nome)}">${lenda.favorita ? '★' : '☆'}</button>
          </div>
          <p class="titulo">${textoSeguro(lenda.titulo)}</p>
          <p class="descricao">${textoSeguro(lenda.descricao)}</p>
          <div class="habilidades">
            <p><strong>Tática:</strong> ${textoSeguro(lenda.tatica)}</p>
            <p><strong>Suprema:</strong> ${textoSeguro(lenda.suprema)}</p>
          </div>
        </div>
        <div class="acoes">
          <button type="button" class="botao secundario" data-acao="editar" data-id="${lenda.id}">Editar</button>
          <button type="button" class="botao perigo" data-acao="excluir" data-id="${lenda.id}">Excluir</button>
        </div>
      </article>`;
  }).join('');
}

async function carregarLendas() {
  const minhaConsulta = ++numeroConsulta;
  const parametros = new URLSearchParams();
  const busca = document.querySelector('#busca').value.trim();
  const classe = document.querySelector('#filtroClasse').value;
  if (busca) parametros.set('busca', busca);
  if (classe) parametros.set('classe', classe);
  if (document.querySelector('#soFavoritas').checked) parametros.set('favoritas', 'true');

  try {
    const lendas = await pedir(`${API}?${parametros}`);
    if (minhaConsulta !== numeroConsulta) return;
    desenharLendas(lendas);
    const status = document.querySelector('#apiStatus');
    status.textContent = 'API conectada';
    status.className = 'status online';
  } catch (erro) {
    if (minhaConsulta !== numeroConsulta) return;
    grid.innerHTML = '<p class="vazio">Não foi possível carregar as lendas.</p>';
    const status = document.querySelector('#apiStatus');
    status.textContent = 'API desconectada';
    status.className = 'status offline';
    mostrarAviso(erro.message, true);
  }
}

function abrirFormulario(lenda = null) {
  form.reset();
  document.querySelector('#erroFormulario').textContent = '';
  idEmEdicao = lenda ? lenda.id : null;
  document.querySelector('#tituloFormulario').textContent = lenda ? 'Editar lenda' : 'Cadastrar lenda';
  document.querySelector('#salvarLenda').textContent = lenda ? 'Salvar alterações' : 'Cadastrar';

  if (lenda) {
    for (const campo of ['nome', 'titulo', 'classe', 'tatica', 'suprema', 'descricao', 'cor']) {
      form.elements.namedItem(campo).value = lenda[campo] ?? '';
    }
  }
  areaFormulario.hidden = false;
  areaFormulario.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function fecharFormulario() {
  areaFormulario.hidden = true;
  idEmEdicao = null;
  form.reset();
}

function limparFiltros() {
  document.querySelector('#busca').value = '';
  document.querySelector('#filtroClasse').value = '';
  document.querySelector('#soFavoritas').checked = false;
}

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (!form.reportValidity()) return;

  const botao = document.querySelector('#salvarLenda');
  const editando = idEmEdicao !== null;
  const dados = Object.fromEntries(new FormData(form).entries());
  botao.disabled = true;
  document.querySelector('#erroFormulario').textContent = '';

  try {
    await pedir(editando ? `${API}/${idEmEdicao}` : API, {
      method: editando ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    fecharFormulario();
    limparFiltros(); // A lenda criada não fica escondida por um filtro antigo.
    await carregarLendas();
    mostrarAviso(editando ? 'Lenda atualizada!' : 'Lenda cadastrada com sucesso!');
    document.querySelector('#lendas').scrollIntoView({ behavior: 'smooth' });
  } catch (erro) {
    document.querySelector('#erroFormulario').textContent = erro.message;
  } finally {
    botao.disabled = false;
  }
});

document.querySelector('#abrirCadastro').addEventListener('click', () => abrirFormulario());
document.querySelector('#cancelarCadastro').addEventListener('click', fecharFormulario);
document.querySelector('#filtroClasse').addEventListener('change', carregarLendas);
document.querySelector('#soFavoritas').addEventListener('change', carregarLendas);
document.querySelector('#busca').addEventListener('input', () => {
  clearTimeout(tempoBusca);
  tempoBusca = setTimeout(carregarLendas, 250);
});

grid.addEventListener('click', async (evento) => {
  const botao = evento.target.closest('button[data-acao]');
  if (!botao) return;
  const id = Number(botao.dataset.id);
  botao.disabled = true;

  try {
    if (botao.dataset.acao === 'editar') {
      const lenda = await pedir(`${API}/${id}`);
      abrirFormulario(lenda);
    } else if (botao.dataset.acao === 'excluir') {
      if (!confirm('Deseja excluir esta lenda?')) return;
      await pedir(`${API}/${id}`, { method: 'DELETE' });
      mostrarAviso('Lenda excluída.');
      await carregarLendas();
    } else if (botao.dataset.acao === 'favoritar') {
      await pedir(`${API}/${id}/favorita`, { method: 'PATCH' });
      await carregarLendas();
    }
  } catch (erro) {
    mostrarAviso(erro.message, true);
  } finally {
    botao.disabled = false;
  }
});

carregarLendas();
