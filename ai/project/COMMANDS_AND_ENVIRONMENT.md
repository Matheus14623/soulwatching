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
  - "scripts/public-manifest.mjs"
  - "scripts/serve.mjs"
  - "scripts/verify.mjs"
  - "scripts/build.mjs"
  - "scripts/tests/public-smoke.test.mjs"
---

# Comandos e ambiente

## Current Confirmed Structure

O projeto declara ESM, não possui dependências no manifesto ou no lockfile e fixa suporte a Node.js `>=18.17 <25` em `engines`. A versão recomendada e usada pela CI é a 22, registrada em `.nvmrc`; o ciclo `prebuild` interrompe versões incompatíveis com uma orientação explícita antes de carregar os módulos do produto.

| Comando | Efeito confirmado |
| --- | --- |
| `npm run dev` | Inicia o servidor de fonte com allowlist pública em `localhost`, normalmente na porta 5173. |
| `npm start` | Mesmo servidor local de desenvolvimento. |
| `npm run preview` | Executa o build e serve somente `dist/`. |
| `npm run verify` | Verifica o produto e a sincronização da base `ai/`. |
| `npm run build` | Verifica, recria `dist/` e copia apenas os caminhos públicos autorizados. |
| `npm test` | Executa o build no `pretest` e depois a suíte de smoke tests HTTP, contratos de acessibilidade e navegador disponível. |
| `npm run test:smoke` | Executa somente a suíte de smoke tests; pressupõe `dist/` já gerado. |
| `npm run knowledge:build` | Regenera ledger, roteamento e grafo da base. |
| `npm run knowledge:check` | Confere os artefatos da base sem escrever arquivos. |
| `npm run knowledge:test` | Executa os testes nativos dos parsers, validadores e geradores da base. |

## Contracts To Preserve

- O servidor de fonte resolve somente rotas e caminhos autorizados pelo manifesto público; `ai/`, `docs/`, `scripts/` e `package.json` devem responder 404.
- Os modos fonte e preview aceitam apenas `GET` e `HEAD`, vinculam-se a `localhost` e reconhecem as URLs limpas declaradas no manifesto.
- Abra o site por HTTP; módulos ES não devem ser testados por `file://`.
- O build é a verificação de publicação, não apenas um alias do servidor local.
- Não inclua dependências no lockfile sem uma necessidade confirmada e autorização compatível com a tarefa.

## Validation

Os comandos devem retornar código zero. Em mudanças nos validadores, execute também `npm run knowledge:test`.

## To Verify

- Matriz de sistemas operacionais validada para todas as versões de Node declaradas.
- O smoke de navegador é ignorado quando Chrome, Chromium ou Edge não está disponível; confirmar sua execução efetiva no ambiente de CI escolhido.
