# Catálogo de Lendas - Apex Legends

Projeto da disciplina de Programação Web. O site usa **HTML, CSS e JavaScript** para consumir uma **API REST feita com Node.js e Express**.

## Para rodar

1. Instale o Node.js (versão 18 ou superior).
2. Abra a pasta do projeto no terminal.
3. Execute:

```bash
npm install
npm start
```

4. Acesse **http://localhost:3000**.

**Importante:** não abra o arquivo `index.html` diretamente. O cadastro precisa do servidor Express ligado.

## O que o site faz

- Mostra as lendas cadastradas e permite buscar e filtrar por classe.
- Cadastra, edita e exclui lendas.
- Marca ou desmarca as favoritas.
- Salva os dados em `data/lendas.json`.

## API

| Método | Caminho | Função |
| --- | --- | --- |
| GET | `/api/lendas` | Lista as lendas (aceita `busca`, `classe` e `favoritas`) |
| GET | `/api/lendas/1` | Mostra uma lenda |
| POST | `/api/lendas` | Cadastra |
| PUT | `/api/lendas/1` | Edita |
| PATCH | `/api/lendas/1/favorita` | Altera favorito |
| DELETE | `/api/lendas/1` | Exclui |

## Arquivos principais

- `server.js`: servidor, rotas e validação de dados.
- `public/index.html`: estrutura da página e formulário.
- `public/styles.css`: aparência do site.
- `public/app.js`: faz as requisições `fetch()` e atualiza os cards.
- `data/lendas.json`: banco de dados simples em JSON para o trabalho.

Para conferir as rotas automaticamente, execute `npm test`.

Este é um projeto acadêmico não oficial, sem vínculo com a EA ou a Respawn.
