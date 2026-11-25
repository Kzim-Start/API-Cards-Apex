# LEGEND ARCHIVE — Projeto Final de Programação Web

Catálogo de personagens inspirado em **Apex Legends**, feito para demonstrar uma **API REST com Express.js** e uma interface com **HTML, CSS e JavaScript puro**.

> Projeto educacional não oficial, sem vínculo com a Electronic Arts ou a Respawn Entertainment.

## Como executar

Você precisa ter o **Node.js 18 ou mais recente** instalado.

1. Abra a pasta do projeto no VS Code.
2. Abra o terminal **dentro dessa pasta**.
3. Rode os comandos abaixo, um de cada vez:

```bash
npm install
npm start
```

4. Acesse no navegador: **http://localhost:3000**

O navegador deve ser aberto pelo endereço acima. **Não** abra `public/index.html` com dois cliques: ele precisa se comunicar com o servidor Express.

Para parar o servidor, pressione `Ctrl + C` no terminal. Para reiniciar com atualizações automáticas durante o desenvolvimento, use `npm run dev`.

## Funcionalidades

- Listar personagens existentes.
- Buscar por nome ou descrição.
- Filtrar pelas cinco classes: **Assalto, Combate, Batedor, Controle e Suporte**.
- Consultar dados de uma lenda específica.
- Cadastrar personagens informando apenas nome e classe (obrigatórios). Título, descrição, habilidades e cor são opcionais. O banner e o símbolo da classe aparecem em tempo real.
- Editar registros existentes.
- Excluir personagens por uma janela de confirmação personalizada.
- Marcar ou desmarcar favoritos e exibir somente favoritos.
- Exibir totais por classe.
- Salvar alterações no arquivo `data/lendas.json` para persistir após reiniciar.
- Mostrar erros de validação e mensagens de confirmação.

## Rotas da API REST

| Método | Endpoint | O que faz |
| --- | --- | --- |
| `GET` | `/api/lendas` | Lista todas as lendas |
| `GET` | `/api/lendas?classe=Suporte` | Filtra por classe |
| `GET` | `/api/lendas?busca=ash` | Busca por texto |
| `GET` | `/api/lendas?favoritas=true` | Filtra favoritas |
| `GET` | `/api/lendas/1` | Consulta uma lenda pelo ID |
| `POST` | `/api/lendas` | Cadastra uma lenda |
| `PUT` | `/api/lendas/1` | Edita uma lenda |
| `PATCH` | `/api/lendas/1/favorita` | Alterna o favorito |
| `DELETE` | `/api/lendas/1` | Remove uma lenda |
| `GET` | `/api/status` | Confirma que a API está online |

### Exemplo de POST

Envie uma requisição `POST` para `http://localhost:3000/api/lendas` com o cabeçalho `Content-Type: application/json` e este corpo:

```json
{
  "nome": "Minha Lenda",
  "titulo": "Novo Competidor",
  "classe": "Combate",
  "descricao": "Personagem criado como exemplo de cadastro na API.",
  "tatica": "Impulso Rápido",
  "suprema": "Salto Dimensional",
  "cor": "#e94b5f"
}
```

A API devolve **201 Created** com os dados da nova lenda e um `id` gerado automaticamente. Também utiliza **200 OK**, **204 No Content**, **400 Bad Request**, **404 Not Found** e **409 Conflict** conforme a operação.

## Estrutura de arquivos

```text
apex-legends-api/
├── data/
│   └── lendas.json       # Personagens e armazenamento
├── public/
│   ├── index.html        # Estrutura da página
│   ├── styles.css        # Visual e responsividade
│   └── app.js            # fetch(), filtros e eventos de clique
├── tests/
│   └── api.test.js       # Testes das rotas REST
├── server.js             # Servidor Express e endpoints
├── package.json          # Dependências e comandos
└── README.md             # Este guia
```

## Como o sistema funciona

1. O **Express** (`server.js`) atende ao endereço `localhost:3000`.
2. A rota `GET /api/lendas` lê os dados carregados do arquivo JSON.
3. O **JavaScript no navegador** (`public/app.js`) chama essa rota com `fetch()`.
4. A resposta chega no formato **JSON**, que o JavaScript transforma em cartões na tela.
5. Quando o usuário cadastra ou edita, o `fetch()` envia um **POST** ou **PUT**.
6. O Express valida os campos, atualiza `data/lendas.json` e devolve uma resposta.
7. O front-end consulta novamente a API para atualizar a interface.

## Roteiro rápido para apresentar ao professor (2–3 minutos)

**1. Apresentação:** "Nosso projeto é um catálogo de lendas de Apex Legends. O objetivo foi juntar o Express no back-end com HTML, CSS e JavaScript no front-end."

**2. Front-end:** Mostre os cartões, busque por "Ash", filtre por "Suporte" e marque uma favorita. Explique que esses filtros chamam a API pelo `fetch()`.

**3. API:** Abra `http://localhost:3000/api/lendas` no navegador e mostre os objetos JSON. Em `server.js`, destaque `app.get`, `app.post`, `app.put` e `app.delete`.

**4. Cadastro:** Clique em **NOVA LENDA**, preencha e salve. Mostre o registro aparecendo e o arquivo `data/lendas.json` atualizado. Edite ou exclua o personagem.

**5. Finalização:** "O projeto segue o estilo REST: cada rota tem um método HTTP e uma função. O servidor retorna JSON e o front-end consome esses dados sem atualizar a página inteira."

## Testes automáticos

Com as dependências instaladas, execute:

```bash
npm test
```

Os testes verificam filtros, consulta por ID, validação, cadastro, edição, favoritos, exclusão e gravação em JSON. Eles usam uma cópia temporária do arquivo de dados, preservando seu catálogo.

## Observação sobre os personagens

O projeto começa com uma **seleção de 12 lendas**, não com o elenco completo. Suas classes foram consultadas no [guia oficial da EA](https://help.ea.com/pt-br/articles/apex-legends/abilities/) em novembro de 2026. Habilidades e descrições foram resumidas para a atividade; atualizações futuras do jogo podem modificá-las.

## Créditos

Apex Legends e seus personagens pertencem à Electronic Arts/Respawn Entertainment. Layout, código e ilustrações geométricas deste projeto foram criados para fins didáticos.

## Atualizações de cadastro e banners

- **Todo novo personagem recebe automaticamente o mesmo banner dos cards existentes:** código `APX`, anéis, símbolo da classe, monograma (iniciais) e cor escolhida. Não é necessário enviar imagem.
- O modal mostra uma prévia ao vivo do banner antes do cadastro. A classe sugere uma cor, que pode ser alterada manualmente.
- Depois do cadastro, a busca e os filtros são limpos, o novo card aparece destacado e a página rola até ele.
- A confirmação de exclusão agora usa uma janela estilizada.
- Para o salvamento persistir, abra o site via `npm start` e `http://localhost:3000`, não por duplo clique no HTML.
