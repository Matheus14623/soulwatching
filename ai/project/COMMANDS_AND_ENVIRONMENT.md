---
id: "project.commands"
title: "Comandos e ambiente"
scope: "project"
kind: "canonical-reference"
status: "canonical"
canonical_for:
  - "comandos locais, requisitos declarados e comportamento operacional"
triggers:
  - "npm run dev"
  - "npm run verify"
  - "npm run build"
  - "npm run preview"
  - "npm test"
  - "Node"
  - "ambiente local"
required_context:
  - "project.index"
related_context:
  - "quality.validation-release"
  - "infrastructure.static-deploy"
evidence_sources:
  - "package.json"
  - "package-lock.json"
  - ".nvmrc"
  - "scripts/check-node-version.cjs"
  - "scripts/content/change-set.mjs"
  - "scripts/content/cli.mjs"
  - "scripts/content/install-record.mjs"
  - "scripts/public-manifest.mjs"
  - "scripts/serve.mjs"
  - "scripts/verify.mjs"
  - "scripts/build.mjs"
  - "scripts/tests/public-smoke.test.mjs"
---

# Comandos e ambiente

## Current Confirmed Structure

O projeto declara ESM, não possui dependências no manifesto ou no lockfile e fixa Node.js `22.x` em `engines`. A mesma linha principal é registrada em `.nvmrc` e usada pela CI; o ciclo `prebuild` interrompe versões incompatíveis com uma orientação explícita antes de carregar os módulos do produto.

| Comando | Efeito confirmado |
| --- | --- |
| `npm run dev` | Inicia o servidor de fonte com allowlist pública em `localhost`, normalmente na porta 5173. |
| `npm start` | Mesmo servidor local de desenvolvimento. |
| `npm run dashboard` | Inicia a dashboard editorial privada em `http://localhost:4174`; cria workspaces em `.content-drafts/`, gera previews isolados em `.content-cache/` e não expõe uma rota pública. |
| `npm run test:dashboard` | Executa os contratos focados do servidor local, workspace, fluxo editorial, segurança e gate de preview/aplicação. |
| `npm run test:dashboard:preview` | Executa um build real no workspace-sombra, abre o preview protegido e verifica por hash que `content/public/` não mudou. |
| `npm run preview` | Executa o build e serve somente `dist/`. |
| `npm run verify` | Verifica o produto e a sincronização da base `ai/`. |
| `npm run build` | Verifica, recria `dist/` e copia apenas os caminhos públicos autorizados. |
| `npm run content:new -- --type <tipo> --id <id>` | Cria rascunho não publicável; com `--source`, instala um registro revisado pelo mesmo carregador, gate e transação do manifesto. Toda substituição exige `--change-class` e `--force`. |
| `npm run content:check` | Valida schemas, integridade cruzada, ledger editorial, `reviewedAgainst`, budgets e blockers globais. |
| `npm run content:build` | Compila a fonte canônica e gera o runtime; `-- --check` apenas confere se a saída está atual. |
| `npm run content:report` | Atualiza o relatório privado de integridade, incluindo relações desatualizadas, baselines legados e dívidas. |
| `npm run content:impact -- --manifest <arquivo.json>` | Analisa um conjunto privado sem escrever: diff, classe efetiva, dependências diretas, avisos e blockers. |
| `npm run content:apply -- --manifest <arquivo.json>` | Aplica o conjunto autorizado como transação com lock, gate, ledgers, compilação e rollback. |
| `npm run content:rollback` | Restaura o último runtime gerado válido; não corrige nem reverte a fonte canônica. |
| `npm test` | Executa o build no `pretest` e depois a suíte de smoke tests HTTP, contratos de acessibilidade e navegador disponível. |
| `npm run test:smoke` | Executa somente a suíte de smoke tests; pressupõe `dist/` já gerado. |
| `npm run knowledge:build` | Regenera ledger, roteamento e grafo da base. |
| `npm run knowledge:check` | Confere os artefatos da base sem escrever arquivos. |
| `npm run knowledge:test` | Executa os testes nativos dos parsers, validadores e geradores da base. |

## Contracts To Preserve

- O servidor de fonte resolve somente rotas e caminhos autorizados pelo manifesto público; `ai/`, `docs/`, `scripts/` e `package.json` devem responder 404.
- Os modos fonte e preview aceitam apenas `GET` e `HEAD`, vinculam-se a `localhost` e reconhecem as URLs limpas declaradas no manifesto.
- A dashboard é outro processo, também exclusivo de loopback. Ela valida `Host`, `Origin` e token de sessão nas mutações, não aceita caminhos enviados pelo navegador e permanece fora do manifesto e do build públicos.
- O preview editorial é construído em workspace-sombra: ele não altera `content/public/` antes da confirmação de instalação e deve ser descartado junto com o processo ou pela ação explícita da interface.
- Abra o site por HTTP; módulos ES não devem ser testados por `file://`.
- O build é a verificação de publicação, não apenas um alias do servidor local.
- Não inclua dependências no lockfile sem uma necessidade confirmada e autorização compatível com a tarefa.
- O manifesto de `content:impact` e `content:apply` precisa ficar dentro do projeto e fora de `content/public/`; as fontes apontadas seguem a mesma fronteira privada.
- O manifesto aceita operações de `theory`, `figure`, `party`, `publication`, `experiment`, `reference` e `relation`. Toda substituição exige classe de mudança explícita e `force: true`; duas operações para o mesmo tipo e ID são inválidas.
- `content:impact` é somente leitura e valida o overlay completo com a mesma integridade cruzada, política de revisão e ledgers usados por `content:apply`. A aplicação precisa usar o mesmo manifesto analisado e nunca contornar blockers alterando relações revisadas para `pending`.
- O ledger editorial assina o registro canônico de cada revisão; o ledger de publicação assina conjuntamente o snapshot público e o de créditos. Alterações diretas sem revisão válida são recusadas.
- Falha capturada durante a aplicação restaura registros, ledgers e relatório privado tocados; encerramento abrupto do processo não é coberto por journal da fonte.

## Validation

Os comandos devem retornar código zero. Em mudanças nos validadores, execute também `npm run knowledge:test`. Em mudanças editoriais compostas, rode primeiro `content:impact`, revise os blockers e somente então `content:apply`; finalize com `content:check`, `content:build -- --check`, `verify` e os testes proporcionais.

## To Verify

- Matriz de sistemas operacionais validada para todas as versões de Node declaradas.
- O smoke de navegador é ignorado quando Chrome, Chromium ou Edge não está disponível; confirmar sua execução efetiva no ambiente de CI escolhido.
