---
id: "infrastructure.index"
title: "Índice de infraestrutura"
scope: "infrastructure"
kind: "index"
status: "canonical"
canonical_for:
  - "roteamento de build, artefato público, servidor local e hospedagem"
triggers:
  - "deploy"
  - "Vercel"
  - "dist"
  - "build"
  - "servidor local"
required_context:
  - "root.index"
related_context:
  - "infrastructure.static-deploy"
evidence_sources:
  - "scripts/build.mjs"
  - "scripts/serve.mjs"
  - "vercel.json"
---

# Índice de infraestrutura

Leia este escopo para mudanças no ciclo de publicação ou na fronteira entre repositório e site público.

## Navegação

- [Build estático e deploy](STATIC_BUILD_AND_DEPLOY.md)

## Estado confirmado

A Vercel executa `npm run build` e publica `dist/`. Não há containers, infraestrutura como código, ambientes múltiplos ou pipeline de CI no repositório.

## Quando atualizar

Atualize este escopo quando mudar a hospedagem, o diretório de saída, a allowlist, o servidor local ou a política de cache/URLs.

## To Verify

- Domínio canônico final.
- Estratégia de rollback e preview por ambiente.
