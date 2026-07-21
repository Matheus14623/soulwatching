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
  - "scripts/serve.mjs"
  - "scripts/verify.mjs"
  - "scripts/build.mjs"
---

# Comandos e ambiente

## Current Confirmed Structure

O projeto declara ESM e não possui dependências no manifesto ou no lockfile.

| Comando | Efeito confirmado |
| --- | --- |
| `npm run dev` | Inicia `scripts/serve.mjs`, normalmente na porta 5173. |
| `npm start` | Mesmo servidor local de desenvolvimento. |
| `npm run verify` | Verifica o produto e a sincronização da base `ai/`. |
| `npm run build` | Verifica, recria `dist/` e copia apenas os caminhos públicos autorizados. |
| `npm run knowledge:build` | Regenera ledger, roteamento e grafo da base. |
| `npm run knowledge:check` | Confere os artefatos da base sem escrever arquivos. |
| `npm run knowledge:test` | Executa os testes nativos dos parsers, validadores e geradores da base. |

## Contracts To Preserve

- O servidor local serve a raiz do repositório, não somente `dist/`. Use-o apenas em desenvolvimento e não compartilhe sua URL em rede não confiável.
- Abra o site por HTTP; módulos ES não devem ser testados por `file://`.
- O build é a verificação de publicação, não apenas um alias do servidor local.
- Não inclua dependências no lockfile sem uma necessidade confirmada e autorização compatível com a tarefa.

## Validation

Os comandos devem retornar código zero. Em mudanças nos validadores, execute também `npm run knowledge:test`.

## To Verify

- O README recomenda Node 18+, mas a versão mínima não está fixada em `engines`, `.nvmrc` ou equivalente.
- O servidor local não fixa explicitamente o host; confirmar a exposição efetiva em cada ambiente antes de usá-lo fora da máquina local.
