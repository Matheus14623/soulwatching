---
id: "frontend.index"
title: "Índice do frontend"
scope: "frontend"
kind: "index"
status: "canonical"
canonical_for:
  - "roteamento de páginas, módulos, design, interações e fluxos do navegador"
triggers:
  - "frontend"
  - "HTML"
  - "CSS"
  - "JavaScript"
  - "interface"
  - "responsividade"
required_context:
  - "root.index"
related_context:
  - "frontend.pages-modules"
  - "frontend.interactive-systems"
  - "frontend.design-accessibility"
  - "frontend.user-flows"
evidence_sources:
  - "index.html"
  - "assets/css/styles.css"
  - "assets/js/main.js"
---

# Índice do frontend

Leia este escopo para mudanças visíveis ou comportamentais no navegador.

## Navegação

- [Páginas e módulos](PAGE_AND_MODULE_ARCHITECTURE.md)
- [Sistemas interativos](INTERACTIVE_SYSTEMS.md)
- [Design, responsividade e acessibilidade](DESIGN_AND_ACCESSIBILITY.md)
- [Fluxos do usuário e estado](USER_FLOWS.md)

## Pontos de entrada

A home usa `main.js`; Teorias e Mapa possuem controladores próprios; Arquivo e Laboratório usam somente o shell compartilhado. CSS global vem antes do CSS compartilhado de páginas internas e do CSS específico da rota.

## Quando atualizar

Atualize este escopo quando mudar uma rota, um módulo compartilhado, a ordem da cascata, um contrato de interação, um breakpoint ou uma regra de acessibilidade.

## To Verify

- Estado visual atual nas larguras 1440, 1024, 768, 430, 390 e 360 px após cada mudança relevante.
- Foco após reconstruções de filtros e cards na home.
