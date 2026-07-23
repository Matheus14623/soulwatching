---
id: "project.index"
title: "Índice do projeto"
scope: "project"
kind: "index"
status: "canonical"
canonical_for:
  - "roteamento de arquitetura, comandos e fronteiras do repositório"
triggers:
  - "estrutura do repositório"
  - "arquitetura"
  - "comandos"
  - "legado"
required_context:
  - "root.index"
related_context:
  - "project.architecture"
  - "project.commands"
  - "project.boundaries"
evidence_sources:
  - "README.md"
  - "package.json"
  - "scripts/public-manifest.mjs"
  - "scripts/build.mjs"
---

# Índice do projeto

Leia este escopo para entender a aplicação antes de escolher uma camada específica.

## Navegação

- [Arquitetura atual](ARCHITECTURE.md): stack, rotas, entrypoints e dependências entre módulos.
- [Comandos e ambiente](COMMANDS_AND_ENVIRONMENT.md): desenvolvimento, verificação, build e limitações do runtime.
- [Fronteiras e legado](REPOSITORY_BOUNDARIES.md): fonte de verdade, conteúdo privado, derivados e precedência documental.

## Pontos de entrada confirmados

- `index.html` com `assets/js/main.js` para a home interativa.
- HTML e controlador próprios em `Teorias/`, `Mapa/`, `GrandesNomes/`, `Constelacoes/`, `Laboratorio/`, `Rotas/` e `Contribuicoes/`.
- HTML estático com `assets/js/page-shell.js` em `Arquivo/`.
- `scripts/public-manifest.mjs` como catálogo central de rotas, arquivos e diretórios públicos.
- `scripts/serve.mjs`, `scripts/verify.mjs`, `scripts/build.mjs` e `scripts/tests/` para desenvolvimento, verificação, build e smoke tests.

## Quando atualizar

Atualize este escopo quando mudar a stack, surgir uma rota principal, um processo novo for criado ou a fronteira entre fonte, conteúdo privado e artefato público for alterada.

## To Verify

- Se os assets sem consumidor encontrados na auditoria continuam reservados intencionalmente.
- Se o módulo de reexportação `assets/js/theories.js` ainda possui consumidor externo não presente no repositório.
